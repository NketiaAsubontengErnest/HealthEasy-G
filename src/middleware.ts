import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { ROLE_DEFINITIONS, UserRole } from '@/lib/types/rbac';

/**
 * Perimeter authentication.
 *
 * `RoleGuard` runs in the browser and can be bypassed by anyone with dev
 * tools, so it cannot be the only gate. This middleware rejects unauthenticated
 * traffic before a route handler or page ever renders, and additionally
 * enforces each role's `allowedRoutes` on navigation.
 */

/** Endpoints that must stay reachable without a session. */
const PUBLIC_API = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/session']);

const PUBLIC_PAGES = ['/', '/auth/login', '/auth/register'];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some((page) => {
    if (page === '/') return pathname === '/';
    return pathname === page || pathname.startsWith(`${page}/`);
  });
}

/**
 * Every route that appears in at least one role's `allowedRoutes`. Paths
 * outside this set (the theme's utility and demo pages) are not part of the
 * RBAC model and only require a valid session.
 */
const GOVERNED_ROUTES = Array.from(
  new Set(Object.values(ROLE_DEFINITIONS).flatMap((definition) => definition.allowedRoutes))
);

function matches(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isGovernedRoute(pathname: string): boolean {
  return GOVERNED_ROUTES.some((route) => matches(pathname, route));
}

function canAccessRoute(role: string, pathname: string): boolean {
  const definition = ROLE_DEFINITIONS[role as UserRole];
  if (!definition) return false;

  return definition.allowedRoutes.some((allowed) => matches(pathname, allowed));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (isApi && PUBLIC_API.has(pathname)) return NextResponse.next();
  if (!isApi && isPublicPage(pathname)) return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Authentication required. Sign in to the hospital portal.' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/auth/login', req.url);
    if (pathname !== '/') loginUrl.searchParams.set('next', pathname);

    const response = NextResponse.redirect(loginUrl);
    // Clear a stale or tampered cookie so the browser stops resending it.
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Per-endpoint permissions are enforced by `withAuth` inside each handler;
  // middleware only establishes that a valid session exists.
  if (isApi) return NextResponse.next();

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isGovernedRoute(pathname) && !canAccessRoute(session.role, pathname)) {
    const denied = new URL('/dashboard', req.url);
    denied.searchParams.set('denied', pathname);
    return NextResponse.redirect(denied);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Everything except Next internals and static assets. Auth pages and public
   * API endpoints are allowed through inside the handler above so the matcher
   * stays simple and fails closed.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.svg|images|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$).*)']
};
