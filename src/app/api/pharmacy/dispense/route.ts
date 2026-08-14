import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { formatDate, toDispenseRecord } from '@/lib/adapters';
import { badRequest, finiteNumber, requiredString } from '@/lib/validation';

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const dispenses = await prisma.dispenseRecord.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { dispenseTimestamp: 'desc' }
  });

  const data = dispenses.map(toDispenseRecord);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    prescriptionId,
    patientId,
    mrn,
    patientName,
    drugName,
    dosageInstructions,
    quantityPrescribed,
    quantityDispensed,
    batchNumber,
    counselingNotes
  } = body;

  let quantity: number;
  try {
    requiredString(patientId, 'patientId', 100);
    requiredString(batchNumber, 'batchNumber', 100);
    requiredString(prescriptionId, 'prescriptionId', 100);
    quantity = finiteNumber(quantityDispensed, 'Dispensed quantity', 1, 10_000);
    if (!Number.isInteger(quantity)) throw new Error('Dispensed quantity must be a whole number.');
  } catch (error) {
    return badRequest(error);
  }

  // Recording the dispense and deducting stock must succeed or fail together.
  // Previously they were two independent writes, so a failure between them
  // handed out medicine that the stock ledger never accounted for — and the
  // read-then-write deduction lost units whenever two counters dispensed the
  // same batch concurrently.
  const result = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({ where: { id: patientId } });
    if (!patient) return { error: 'Patient does not exist.', status: 404 as const };

    // A dispense must reference a signed encounter. The client cannot invent
    // an identifier and turn it into a stock-moving prescription.
    const encounter = await tx.eMREncounter.findUnique({ where: { id: prescriptionId } });
    if (!encounter || !encounter.signed || encounter.patientId !== patientId) {
      return { error: 'A signed encounter for this patient is required before dispensing.', status: 409 as const };
    }
    const batch = await tx.pharmacyBatch.findUnique({ where: { batchNumber } });

    if (!batch) {
      return { error: `Batch ${batchNumber} does not exist in pharmacy stock.`, status: 404 as const };
    }

    if (batch.quantityInStock < quantity) {
      return {
        error: `Insufficient stock: batch ${batchNumber} holds ${batch.quantityInStock} unit(s), ${quantity} requested.`,
        status: 409 as const
      };
    }

    if (batch.expiryDate && batch.expiryDate.getTime() < Date.now()) {
      return {
        error: `Batch ${batchNumber} of ${batch.drugName} expired on ${formatDate(batch.expiryDate)} and cannot be dispensed.`,
        status: 409 as const
      };
    }

    const dispense = await tx.dispenseRecord.create({
      data: {
        prescriptionId: prescriptionId || `rx-${Date.now()}`,
        patientId,
        mrn: patient.mrn,
        patientName: patient.fullName,
        drugName: batch.drugName,
        dosageInstructions: dosageInstructions || 'Dispensed per clinician orders',
        quantityPrescribed: Math.max(quantity, Number(quantityPrescribed) || quantity),
        quantityDispensed: quantity,
        batchNumber,
        dispensedById: session.id,
        dispensedByName: session.name,
        status: (Number(quantityPrescribed) || quantity) > quantity ? 'Partially Dispensed' : 'Dispensed',
        counselingNotes: counselingNotes || 'Patient advised on proper dosage timing.'
      }
    });

    // Conditional decrement — the `gte` guard makes the update a no-op if a
    // concurrent dispense drained the batch first, and the transaction rolls
    // back rather than driving stock negative.
    const deducted = await tx.pharmacyBatch.updateMany({
      where: { batchNumber, quantityInStock: { gte: quantity } },
      data: { quantityInStock: { decrement: quantity } }
    });

    if (deducted.count === 0) {
      throw new Error(`Batch ${batchNumber} was depleted by a concurrent dispense. Please retry.`);
    }

    return { dispense };
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'DISPENSE_MEDICATION',
      patientId,
      mrn: result.dispense.mrn,
      details: `Dispensed ${quantity} unit(s) of ${result.dispense.drugName} from batch ${batchNumber}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toDispenseRecord(result.dispense) });
});
