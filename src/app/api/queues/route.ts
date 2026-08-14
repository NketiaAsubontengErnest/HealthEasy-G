import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-guard';
import { toPatientCategory, toPriorityLevel, toQueueItem, toQueueStatus } from '@/lib/adapters';

export const GET = withAuth('GET', async () => {
  const queues = await prisma.queueItem.findMany({ orderBy: { createdAt: 'asc' } });
  const data = queues.map(toQueueItem);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req) => {
  const body = await req.json();
  const { patientId, mrn, patientName, patientCategory, department, servicePoint, priority, locationNotes } = body;

  if (!patientId || !mrn || !patientName) {
    return NextResponse.json({ error: 'patientId, mrn and patientName are required.' }, { status: 400 });
  }

  const dept = department || 'OPD Consultation';
  // Queue numbers are scoped per department so Triage and OPD do not share a
  // running counter, which previously produced confusing "OPD-007" tickets at
  // the triage desk.
  const prefix = dept.toLowerCase().startsWith('triage') ? 'TRG' : dept.slice(0, 3).toUpperCase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const issuedToday = await prisma.queueItem.count({
    where: { department: dept, createdAt: { gte: todayStart } }
  });

  const newQueue = await prisma.queueItem.create({
    data: {
      queueNumber: `${prefix}-${String(issuedToday + 1).padStart(3, '0')}`,
      patientId,
      mrn,
      patientName,
      patientCategory: toPatientCategory(patientCategory),
      department: dept,
      servicePoint: servicePoint || 'Consultation Room 1',
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: toPriorityLevel(priority),
      status: toQueueStatus('WAITING'),
      currentLocation: locationNotes || 'Waiting in OPD Lounge'
    }
  });

  const queue = toQueueItem(newQueue);
  return NextResponse.json({ success: true, data: queue, queue });
});

export const PATCH = withAuth('PATCH', async (req) => {
  const body = await req.json();
  const { id, status, currentLocation } = body;

  if (!id) {
    return NextResponse.json({ error: 'Queue item ID is required' }, { status: 400 });
  }

  const updated = await prisma.queueItem.update({
    where: { id },
    data: {
      status: toQueueStatus(status),
      ...(currentLocation && { currentLocation })
    }
  });

  return NextResponse.json({ success: true, data: toQueueItem(updated) });
});
