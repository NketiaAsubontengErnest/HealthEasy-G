import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, roleHasPermission, withAuth } from '@/lib/api-guard';
import { toInvoice, toPatientCategory } from '@/lib/adapters';
import { formatSequence, withUniqueNumber } from '@/lib/sequence';
import { badRequest, finiteNumber, requiredString } from '@/lib/validation';

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const invoices = await prisma.billingInvoice.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { createdAt: 'desc' }
  });

  const data = invoices.map(toInvoice);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    patientId,
    mrn,
    patientName,
    patientCategory,
    subtotalGhc,
    nhisExemptionGhc,
    paidAmountGhc,
    status,
    paymentMethod,
    receiptNumber,
    lineItems
  } = body;

  let patient;
  try {
    requiredString(patientId, 'patientId', 100);
    patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return NextResponse.json({ error: 'Patient does not exist.' }, { status: 404 });
  } catch (error) {
    return badRequest(error);
  }

  // Totals are recomputed from the line items rather than trusted from the
  // request, so a tampered or stale client cannot post an invoice whose
  // header disagrees with what the patient is actually being charged.
  const items: { amountGhc?: number; nhisCoveredGhc?: number }[] = Array.isArray(lineItems) ? lineItems : [];

  let subtotal: number;
  let covered: number;
  let paidInput: number;
  try {
    subtotal = items.length
      ? items.reduce((sum, item) => sum + finiteNumber(item.amountGhc, 'Line item amount', 0, 1_000_000), 0)
      : finiteNumber(subtotalGhc, 'Subtotal', 0, 1_000_000);
    covered = items.length
      ? items.reduce((sum, item) => sum + finiteNumber(item.nhisCoveredGhc ?? 0, 'NHIS-covered amount', 0, 1_000_000), 0)
      : finiteNumber(nhisExemptionGhc ?? 0, 'NHIS exemption', 0, 1_000_000);
    paidInput = finiteNumber(paidAmountGhc ?? 0, 'Paid amount', 0, 1_000_000);
  } catch (error) {
    return badRequest(error);
  }

  const total = Math.max(0, subtotal);
  const paid = Math.min(paidInput, total);
  const balance = Math.max(0, total - covered - paid);

  const newInvoice = await withUniqueNumber(
    async (attempt) => formatSequence('INV', (await prisma.billingInvoice.count()) + 1 + attempt),
    (invoiceNumber) =>
      prisma.billingInvoice.create({
        data: {
          invoiceNumber,
          patientId,
          mrn: patient.mrn,
          patientName: patient.fullName,
          patientCategory: patient.patientCategory,
          subtotalGhc: subtotal,
          nhisExemptionGhc: covered,
          totalAmountGhc: total,
          paidAmountGhc: paid,
          balanceGhc: balance,
          status: status || (balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'),
          paymentMethod: paymentMethod || null,
          cashierName: paid > 0 ? session.name : null,
          receiptNumber: receiptNumber || null,
          lineItems: items
        }
      })
  );

  return NextResponse.json({ success: true, data: toInvoice(newInvoice) });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, paidAmountGhc, status, paymentMethod, receiptNumber } = body;

  if (!id) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  const invoice = await prisma.billingInvoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Reducing a settled amount is a refund, which the Cashier role explicitly
  // may not authorise on its own.
  const nextPaid = paidAmountGhc !== undefined ? Number(paidAmountGhc) : invoice.paidAmountGhc;
  if (nextPaid < invoice.paidAmountGhc && !roleHasPermission(session.role, 'PROCESS_REFUNDS')) {
    return NextResponse.json(
      {
        error: `Reducing a settled amount is a refund. Role "${session.role}" lacks PROCESS_REFUNDS — request Hospital Admin authorisation.`
      },
      { status: 403 }
    );
  }

  if (nextPaid > invoice.totalAmountGhc) {
    return NextResponse.json(
      { error: `Payment of GHS ${nextPaid.toFixed(2)} exceeds the invoice total of GHS ${invoice.totalAmountGhc.toFixed(2)}.` },
      { status: 400 }
    );
  }

  const balance = Math.max(0, invoice.totalAmountGhc - invoice.nhisExemptionGhc - nextPaid);

  const updated = await prisma.billingInvoice.update({
    where: { id },
    data: {
      paidAmountGhc: nextPaid,
      balanceGhc: balance,
      status: status || (balance === 0 ? 'Paid' : nextPaid > 0 ? 'Partial' : 'Unpaid'),
      ...(paymentMethod && { paymentMethod }),
      ...(receiptNumber && { receiptNumber }),
      cashierName: session.name
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: nextPaid < invoice.paidAmountGhc ? 'PROCESS_REFUND' : 'COLLECT_PAYMENT',
      patientId: invoice.patientId,
      mrn: invoice.mrn,
      details: `Invoice ${invoice.invoiceNumber}: paid GHS ${nextPaid.toFixed(2)}, balance GHS ${balance.toFixed(2)} via ${paymentMethod || 'unspecified method'}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toInvoice(updated) });
});
