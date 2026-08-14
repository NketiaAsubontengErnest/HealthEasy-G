import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QueueStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const queues = await prisma.queueItem.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, count: queues.length, data: queues });
  } catch (error: any) {
    console.error('Error fetching queues from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch queue records from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, mrn, patientName, patientCategory, department, servicePoint, locationNotes } = body;

    const count = await prisma.queueItem.count();
    const queueNumber = `OPD-${String(count + 1).padStart(3, '0')}`;

    const newQueue = await prisma.queueItem.create({
      data: {
        queueNumber,
        patientId,
        mrn,
        patientName,
        patientCategory: (patientCategory as any) || 'CASH',
        department: department || 'OPD Consultation',
        servicePoint: servicePoint || 'Consultation Room 1',
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: 'NORMAL',
        status: 'WAITING',
        currentLocation: locationNotes || 'Waiting in OPD Lounge'
      }
    });

    return NextResponse.json({ success: true, queue: newQueue });
  } catch (error: any) {
    console.error('Error creating queue in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to create queue record' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, currentLocation } = body;

    if (!id) {
      return NextResponse.json({ error: 'Queue item ID is required' }, { status: 400 });
    }

    let qStatus: QueueStatus = QueueStatus.WAITING;
    if (status === 'IN_CONSULTATION' || status === 'In-Consultation') qStatus = QueueStatus.IN_CONSULTATION;
    else if (status === 'COMPLETED' || status === 'Completed') qStatus = QueueStatus.COMPLETED;
    else if (status === 'TRANSFERRED' || status === 'Transferred') qStatus = QueueStatus.TRANSFERRED;

    const updated = await prisma.queueItem.update({
      where: { id },
      data: {
        status: qStatus,
        ...(currentLocation && { currentLocation })
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating queue status in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to update queue status' }, { status: 500 });
  }
}
