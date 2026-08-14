import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const labOrders = await prisma.labOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: labOrders.length, data: labOrders });
  } catch (error: any) {
    console.error('Error fetching lab orders from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch lab orders from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { encounterId, patientId, mrn, patientName, testCode, testName, specimenType, orderedBy } = body;

    const count = await prisma.labOrder.count();
    const barcodeNo = `BC-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newLabOrder = await prisma.labOrder.create({
      data: {
        encounterId: encounterId || null,
        patientId,
        mrn,
        patientName,
        testCode: testCode || 'LAB-GEN',
        testName: testName || 'General Laboratory Investigation',
        specimenType: specimenType || 'Blood / Plasma',
        barcodeNo,
        orderedBy: orderedBy || 'Doctor',
        orderTimestamp: new Date().toISOString(),
        status: 'Pending',
        results: undefined
      }
    });

    return NextResponse.json({ success: true, data: newLabOrder });
  } catch (error: any) {
    console.error('Error creating lab order in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to create lab order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, results, verifiedById, verifiedByName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lab order ID is required' }, { status: 400 });
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(results !== undefined && { results }),
        ...(verifiedById && { verifiedById }),
        ...(verifiedByName && { verifiedByName }),
        verificationTime: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error verifying lab result in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lab order' }, { status: 500 });
  }
}
