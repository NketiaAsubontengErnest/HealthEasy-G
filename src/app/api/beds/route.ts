import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BedStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const beds = await prisma.inpatientBed.findMany({
      orderBy: { wardName: 'asc' },
    });
    return NextResponse.json({ success: true, count: beds.length, data: beds });
  } catch (error: any) {
    console.error('Error fetching inpatient beds from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch bed records from database' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, currentPatientId, patientName, mrn } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bed ID is required' }, { status: 400 });
    }

    let bedStatus: BedStatus = BedStatus.AVAILABLE;
    if (status === 'OCCUPIED' || status === 'Occupied') bedStatus = BedStatus.OCCUPIED;
    else if (status === 'RESERVED' || status === 'Reserved') bedStatus = BedStatus.RESERVED;
    else if (status === 'CLEANING' || status === 'Cleaning') bedStatus = BedStatus.CLEANING;
    else if (status === 'MAINTENANCE' || status === 'Maintenance') bedStatus = BedStatus.MAINTENANCE;
    else if (status === 'ISOLATION' || status === 'Isolation') bedStatus = BedStatus.ISOLATION;

    const updatedBed = await prisma.inpatientBed.update({
      where: { id },
      data: {
        status: bedStatus,
        currentPatientId: currentPatientId || null,
        patientName: patientName || null,
        mrn: mrn || null,
        admissionDate: currentPatientId ? new Date().toISOString().split('T')[0] : null
      }
    });

    return NextResponse.json({ success: true, data: updatedBed });
  } catch (error: any) {
    console.error('Error updating bed status in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to update bed status' }, { status: 500 });
  }
}
