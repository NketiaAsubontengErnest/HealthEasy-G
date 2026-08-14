import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const dispenses = await prisma.dispenseRecord.findMany({
      orderBy: { dispenseTimestamp: 'desc' },
    });
    return NextResponse.json({ success: true, count: dispenses.length, data: dispenses });
  } catch (error: any) {
    console.error('Error fetching dispense records:', error);
    return NextResponse.json({ error: 'Failed to fetch dispense records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
      dispensedById,
      dispensedByName,
      counselingNotes
    } = body;

    // 1. Create dispense record in PostgreSQL
    const dispense = await prisma.dispenseRecord.create({
      data: {
        prescriptionId: prescriptionId || `rx-${Date.now()}`,
        patientId,
        mrn,
        patientName,
        drugName,
        dosageInstructions: dosageInstructions || 'Dispensed per clinician orders',
        quantityPrescribed: Number(quantityPrescribed) || 1,
        quantityDispensed: Number(quantityDispensed) || 1,
        batchNumber,
        dispensedById: dispensedById || null,
        dispensedByName: dispensedByName || 'Pharmacist',
        counselingNotes: counselingNotes || 'Patient advised on proper dosage timing.'
      }
    });

    // 2. Deduct FEFO stock quantity from PharmacyBatch if matching batch exists
    if (batchNumber) {
      const batch = await prisma.pharmacyBatch.findUnique({
        where: { batchNumber }
      });

      if (batch) {
        await prisma.pharmacyBatch.update({
          where: { batchNumber },
          data: {
            quantityInStock: Math.max(0, batch.quantityInStock - (Number(quantityDispensed) || 1))
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: dispense });
  } catch (error: any) {
    console.error('Error recording medication dispense:', error);
    return NextResponse.json({ error: error.message || 'Failed to record dispense in database' }, { status: 500 });
  }
}
