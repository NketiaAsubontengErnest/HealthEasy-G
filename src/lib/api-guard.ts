import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SessionPayload, verifySessionToken } from '@/lib/session';
import { API_POLICY, AccessRule } from '@/lib/api-policy';
import { ROLE_DEFINITIONS, Permission, UserRole } from '@/lib/types/rbac';
import { prisma } from '@/lib/prisma';

export type { SessionPayload };

/**
 * Reads and verifies the signed session cookie. Returns null when the request
 * carries no valid session — identity is never taken from the request body,
 * headers or query string.
 */
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  // Signed tokens are still invalid once an account is disabled, re-assigned,
  // or its session version changes. This closes the revocation gap inherent in
  // purely stateless sessions.
  const user = await prisma.userStaff.findUnique({
    where: { id: session.id },
    select: { status: true, role: true, sessionVersion: true, facilityId: true }
  });
  if (!user || user.status.toLowerCase() !== 'active' || user.role !== session.role ||
      user.sessionVersion !== session.sessionVersion || user.facilityId !== session.facilityId) return null;
  return session;
}

export function roleHasPermission(role: string, permission: Permission): boolean {
  const definition = ROLE_DEFINITIONS[role as UserRole];
  return Boolean(definition?.permissions.includes(permission));
}

function satisfies(rule: AccessRule, session: SessionPayload): boolean {
  switch (rule.kind) {
    case 'authenticated':
      return true;
    case 'roles':
      return rule.roles.includes(session.role as UserRole);
    case 'permission':
      return rule.anyOf.some((permission) => roleHasPermission(session.role, permission));
  }
}

function describe(rule: AccessRule): string {
  switch (rule.kind) {
    case 'authenticated':
      return 'an authenticated staff session';
    case 'roles':
      return `one of these roles: ${rule.roles.join(', ')}`;
    case 'permission':
      return `one of these permissions: ${rule.anyOf.join(', ')}`;
  }
}

type Handler = (req: NextRequest, session: SessionPayload) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a route handler with authentication and RBAC enforcement.
 *
 * Every endpoint must be covered by API_POLICY. An unlisted method fails
 * closed with 403 rather than silently allowing access, so adding a new route
 * without a policy entry is a loud error instead of a quiet hole.
 */
export function withAuth(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', handler: Handler) {
  return async function guardedHandler(req: NextRequest): Promise<NextResponse> {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Sign in to the hospital portal.' },
        { status: 401 }
      );
    }

    const pathname = new URL(req.url).pathname;
    const rule = API_POLICY[pathname]?.[method];

    if (!rule) {
      console.error(`[api-guard] No access policy defined for ${method} ${pathname} — denying by default.`);
      return NextResponse.json(
        { error: 'No access policy is defined for this endpoint.' },
        { status: 403 }
      );
    }

    if (!satisfies(rule, session)) {
      return NextResponse.json(
        {
          error: 'Access denied.',
          reason: `Role "${session.role}" is not permitted to ${method} ${pathname}. Requires ${describe(rule)}.`
        },
        { status: 403 }
      );
    }

    try {
      return await handler(req, session);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected server error';
      console.error(`[api] ${method} ${pathname} failed:`, error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
}
