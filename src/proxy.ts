import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { ROLE_DEFINITIONS, UserRole } from '@/lib/types/rbac';

const PUBLIC_API = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/session']);
const PUBLIC_PAGES = ['/', '/auth/login'];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some((page) => page === '/' ? pathname === '/' : pathname === page || pathname.startsWith(`${page}/`));
}

const GOVERNED_ROUTES = Array.from(new Set(Object.values(ROLE_DEFINITIONS).flatMap((definition) => definition.allowedRoutes)));
const matches = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');
  if (isApi && PUBLIC_API.has(pathname)) return NextResponse.next();
  if (!isApi && isPublicPage(pathname)) return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (isApi) return NextResponse.json({ error: 'Authentication required. Sign in to the hospital portal.' }, { status: 401 });
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (isApi) return NextResponse.next();
  if (pathname === '/') return NextResponse.redirect(new URL('/dashboard', req.url));
  const definition = ROLE_DEFINITIONS[session.role as UserRole];
  if (GOVERNED_ROUTES.some((route) => matches(pathname, route)) && !definition?.allowedRoutes.some((route) => matches(pathname, route))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|images|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)$).*)']
};
