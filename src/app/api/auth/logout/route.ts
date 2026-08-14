import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/session';
import { clientIp, getSession } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (session) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          role: session.role,
          action: 'LOGOUT',
          details: `Signed out of the hospital portal (${session.department})`,
          ipAddress: clientIp(req)
        }
      });
    } catch (error) {
      // A failed audit write must not prevent the user from signing out.
      console.error('Failed to record logout audit entry:', error);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
