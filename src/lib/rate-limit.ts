type Entry = { attempts: number; resetAt: number };
const attempts = new Map<string, Entry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** Process-local backstop. Deployments should use a shared rate-limit store. */
export function loginAllowed(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  return !entry || entry.resetAt <= now || entry.attempts < MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { attempts: 1, resetAt: now + WINDOW_MS });
  else entry.attempts += 1;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
