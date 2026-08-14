import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toMedicationAdministration } from '@/lib/adapters';

const MAR_STATUSES = ['Scheduled', 'Administered', 'Omitted', 'Refused'] as const;

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const records = await prisma.medicationAdministrationRecord.findMany({
    where: patientId ? { patientId } : {},
    orderBy: [{ dueTime: 'asc' }, { createdAt: 'asc' }]
  });

  const data = records.map(toMedicationAdministration);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const { encounterId, patientId, patientName, bedNumber, drugName, dosage, route, dueTime } = body;

  if (!patientId || !drugName || !dueTime) {
    return NextResponse.json(
      { error: 'patientId, drugName and dueTime are required to schedule a dose.' },
      { status: 400 }
    );
  }

  const record = await prisma.medicationAdministrationRecord.create({
    data: {
      encounterId: encounterId || null,
      patientId,
      patientName: patientName || '',
      bedNumber: bedNumber || 'Not assigned',
      drugName,
      dosage: dosage || '',
      route: route || 'Oral',
      dueTime,
      status: 'Scheduled'
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'SCHEDULE_MEDICATION',
      patientId,
      details: `Scheduled ${drugName} ${dosage ?? ''} ${route ?? ''} due ${dueTime}`.replace(/\s+/g, ' ').trim(),
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toMedicationAdministration(record) });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, status, omissionReason } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
  }

  if (!MAR_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status "${status}". Expected one of: ${MAR_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  // A skipped dose must carry a reason — that is what makes the chart
  // defensible at audit.
  if ((status === 'Omitted' || status === 'Refused') && !omissionReason) {
    return NextResponse.json(
      { error: `A reason is required when a dose is recorded as ${status}.` },
      { status: 400 }
    );
  }

  const administered = status === 'Administered';

  const record = await prisma.medicationAdministrationRecord.update({
    where: { id },
    data: {
      status,
      // The administering nurse is taken from the session, so the chart cannot
      // be signed in someone else's name.
      administeredById: administered ? session.id : null,
      administeredBy: administered ? session.name : null,
      administeredTime: administered
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null,
      omissionReason: omissionReason || null
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'MEDICATION_ADMINISTRATION',
      patientId: record.patientId,
      details: `${record.drugName} (${record.bedNumber}) recorded as ${status}${omissionReason ? ` — ${omissionReason}` : ''}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toMedicationAdministration(record) });
});
