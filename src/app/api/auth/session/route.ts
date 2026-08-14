import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/api-guard';

/**
 * Returns the signed-in staff profile, or 401. The client uses this instead of
 * trusting a role it kept in localStorage.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      hierarchyLevel: session.hierarchyLevel,
      staffId: session.staffId,
      department: session.department
    },
    expiresAt: session.exp
  });
}
