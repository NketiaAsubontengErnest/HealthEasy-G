/**
 * HMS staff session tokens.
 *
 * Sessions are stateless, HMAC-SHA256 signed payloads stored in an httpOnly
 * cookie. Everything here uses Web Crypto (`crypto.subtle`) rather than
 * `node:crypto` so the exact same code runs in `middleware.ts` on the Edge
 * runtime and inside Node route handlers.
 */

export const SESSION_COOKIE = 'hms_session';

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 8; // one hospital shift

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  hierarchyLevel: number;
  staffId: string;
  department: string;
  facilityId: string;
  sessionVersion: number;
  /** Issued-at, epoch seconds. */
  iat: number;
  /** Expiry, epoch seconds. */
  exp: number;
}

export function sessionMaxAgeSeconds(): number {
  const raw = Number(process.env.SESSION_MAX_AGE_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_AGE_SECONDS;
}

/**
 * Resolves the signing secret. Missing or weak secrets are fatal in
 * production — a predictable secret means forgeable staff sessions.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SESSION_SECRET is missing or shorter than 32 characters. Refusing to sign HMS sessions with a weak key.'
      );
    }
    // Development convenience only; never reached in production.
    return 'healtheasy-g-insecure-development-secret-do-not-ship';
  }

  return secret;
}

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Constant-time comparison so signature checks cannot be timed byte by byte.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export type NewSession = Omit<SessionPayload, 'iat' | 'exp' | 'facilityId' | 'sessionVersion'> &
  Partial<Pick<SessionPayload, 'facilityId' | 'sessionVersion'>>;

export async function createSessionToken(user: NewSession): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    facilityId: user.facilityId ?? 'fac-1',
    sessionVersion: user.sessionVersion ?? 1,
    iat: now,
    exp: now + sessionMaxAgeSeconds()
  };

  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body));

  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Verifies signature and expiry. Returns null for anything untrustworthy —
 * callers must treat null as "not authenticated" and never fall back to
 * trusting client-supplied identity.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  try {
    const expected = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body));
    if (!timingSafeEqual(new Uint8Array(expected), base64UrlDecode(signature))) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.id || !payload.role) return null;

    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds()
  };
}
