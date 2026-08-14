import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to most recent 100 entries for fast loading
    });
    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, role, action, patientId, mrn, details, ipAddress } = body;

    const newLog = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || 'System User',
        role: role || 'Staff',
        action: action || 'ACTION',
        patientId: patientId || null,
        mrn: mrn || null,
        details: details || '',
        ipAddress: ipAddress || req.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, data: newLog });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: error.message || 'Failed to record audit log' }, { status: 500 });
  }
}
