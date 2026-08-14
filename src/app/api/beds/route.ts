import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BedStatus } from '@prisma/client';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toBedStatus } from '@/lib/adapters';

export const GET = withAuth('GET', async () => {
  const beds = await prisma.inpatientBed.findMany({ orderBy: { wardName: 'asc' } });
  return NextResponse.json({ success: true, count: beds.length, data: beds });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, status, currentPatientId, patientName, mrn } = body;

  if (!id) {
    return NextResponse.json({ error: 'Bed ID is required' }, { status: 400 });
  }

  const bedStatus: BedStatus = toBedStatus(status);

  // Guard against double-booking: a bed already holding a different patient
  // must be discharged before it can be reassigned.
  const existing = await prisma.inpatientBed.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
  }

  if (
    bedStatus === BedStatus.OCCUPIED &&
    existing.status === BedStatus.OCCUPIED &&
    existing.currentPatientId &&
    currentPatientId &&
    existing.currentPatientId !== currentPatientId
  ) {
    return NextResponse.json(
      {
        error: `Bed ${existing.bedNumber} is already occupied by ${existing.patientName ?? 'another patient'}. Discharge or transfer first.`
      },
      { status: 409 }
    );
  }

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

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'UPDATE_BED_STATUS',
      patientId: currentPatientId || null,
      mrn: mrn || null,
      details: `Bed ${updatedBed.bedNumber} (${updatedBed.wardName}) set to ${bedStatus}${patientName ? ` for ${patientName}` : ''}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: updatedBed });
});
