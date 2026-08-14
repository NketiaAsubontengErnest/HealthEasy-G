/**
 * Chooses which PostgreSQL instance the application talks to.
 *
 * The hospital needs to run against a local database when the site has no
 * internet (and during marking/demos), and against the managed cloud database
 * when it does. Both use the identical Prisma schema and seed, so switching is
 * a connection-string change and nothing more.
 *
 * Resolution order:
 *   1. DATABASE_URL           — set explicitly, always wins (CI, hosting)
 *   2. DATABASE_TARGET        — "local" or "cloud"
 *   3. DATABASE_URL_LOCAL     — fallback if neither is set
 */

export type DatabaseTarget = 'local' | 'cloud';

export interface ResolvedDatasource {
  url: string;
  target: DatabaseTarget | 'explicit';
  description: string;
}

/** Strips credentials so a connection string is safe to print or log. */
export function redact(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return url.replace(/:\/\/[^@]*@/, '://***@');
  }
}

/** Any string map — `process.env`, a parsed .env file, or a test fixture. */
export type EnvSource = Record<string, string | undefined>;

export function resolveDatasource(env: EnvSource = process.env): ResolvedDatasource {
  const target = (env.DATABASE_TARGET || '').trim().toLowerCase();

  if (target !== 'local' && target !== 'cloud') {
    if (env.DATABASE_URL) {
      return {
        url: env.DATABASE_URL,
        target: 'explicit',
        description: 'DATABASE_URL (set explicitly)'
      };
    }
  }

  if (target === 'cloud') {
    const url = env.DATABASE_URL_CLOUD || env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_TARGET is "cloud" but neither DATABASE_URL_CLOUD nor DATABASE_URL is set.');
    }
    return { url, target: 'cloud', description: 'DATABASE_URL_CLOUD (managed PostgreSQL)' };
  }

  if (target === 'local') {
    const url = env.DATABASE_URL_LOCAL;
    if (!url) {
      throw new Error('DATABASE_TARGET is "local" but DATABASE_URL_LOCAL is not set.');
    }
    return { url, target: 'local', description: 'DATABASE_URL_LOCAL (offline PostgreSQL)' };
  }

  const fallback = env.DATABASE_URL_LOCAL;
  if (!fallback) {
    throw new Error(
      'No database configured. Set DATABASE_URL, or set DATABASE_TARGET=local|cloud with the matching DATABASE_URL_LOCAL / DATABASE_URL_CLOUD.'
    );
  }

  return { url: fallback, target: 'local', description: 'DATABASE_URL_LOCAL (default)' };
}
