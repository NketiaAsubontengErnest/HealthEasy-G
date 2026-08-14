import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';

export const GET = withAuth('GET', async () => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100 // Most recent 100 entries for fast loading
  });

  return NextResponse.json({ success: true, count: logs.length, data: logs });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const { action, patientId, mrn, details } = body;

  if (!action) {
    return NextResponse.json({ error: 'An audit action is required.' }, { status: 400 });
  }

  // The acting identity comes from the verified session, never from the
  // request body — otherwise the "immutable" trail could be written under
  // someone else's name.
  const newLog = await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: String(action),
      patientId: patientId || null,
      mrn: mrn || null,
      details: details || '',
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: newLog });
});
