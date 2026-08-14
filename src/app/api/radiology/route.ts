import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.radiologyOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    console.error('Error fetching radiology orders:', error);
    return NextResponse.json({ error: 'Failed to fetch radiology orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      mrn,
      patientName,
      studyType,
      bodyPart,
      clinicalHistory,
      orderedBy,
      imageUrls,
      criticalFindings
    } = body;

    const count = await prisma.radiologyOrder.count();
    const pacsAccessionNo = `ACC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const newOrder = await prisma.radiologyOrder.create({
      data: {
        patientId,
        mrn,
        patientName,
        studyType: studyType || 'X-Ray',
        bodyPart: bodyPart || 'Chest (PA)',
        clinicalHistory: clinicalHistory || 'Routine clinical investigation',
        orderedBy: orderedBy || 'Medical Officer',
        orderTimestamp: new Date().toISOString(),
        pacsAccessionNo,
        imageUrls: imageUrls || [],
        criticalFindings: Boolean(criticalFindings)
      }
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('Error creating radiology order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create radiology order' }, { status: 500 });
  }
}
