#!/usr/bin/env node
/**
 * Runs a command with DATABASE_URL resolved from DATABASE_TARGET.
 *
 * The Prisma CLI only reads DATABASE_URL, so `prisma db push`, `prisma studio`
 * and the seed script would always hit whichever instance that variable names.
 * This wrapper resolves local-vs-cloud first, then hands the command the right
 * connection string — so `npm run db:push:local` and `npm run db:push:cloud`
 * operate on the database you actually meant.
 *
 * Usage:  node scripts/with-db.mjs <target|-> <command> [args...]
 *         node scripts/with-db.mjs local prisma db push
 *         node scripts/with-db.mjs -     prisma studio
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Minimal .env reader — dotenv is not a dependency of this project. */
function loadEnvFile() {
  const values = {};
  try {
    const contents = readFileSync(join(root, '.env'), 'utf8');
    for (const line of contents.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env file — rely on the ambient environment.
  }
  return values;
}

const [, , requestedTarget, ...command] = process.argv;

if (command.length === 0) {
  console.error('Usage: node scripts/with-db.mjs <local|cloud|-> <command> [args...]');
  process.exit(1);
}

const fileEnv = loadEnvFile();
const env = { ...fileEnv, ...process.env };

if (requestedTarget && requestedTarget !== '-') {
  env.DATABASE_TARGET = requestedTarget;
}

const { resolveDatasource, redact } = await import('../prisma/resolve-datasource.ts');

let datasource;
try {
  datasource = resolveDatasource(env);
} catch (error) {
  console.error(`\n✖ ${error.message}\n`);
  console.error('Configure your databases in .env — see .env.example:');
  console.error('  DATABASE_URL_LOCAL="postgresql://postgres:password@localhost:5432/healtheasy_g?schema=public"');
  console.error('  DATABASE_URL_CLOUD="postgresql://...neon.tech/neondb?sslmode=require"');
  console.error('  DATABASE_TARGET="local"   # or "cloud"\n');
  process.exit(1);
}

console.log(`[db] ${datasource.description} → ${redact(datasource.url)}\n`);

// Passed as one string rather than argv: `prisma` and `tsx` are .cmd shims on
// Windows and need a shell, and shell + separate args is a quoting hazard.
const child = spawn(command.join(' '), {
  stdio: 'inherit',
  shell: true,
  cwd: root,
  env: { ...env, DATABASE_URL: datasource.url }
});

child.on('exit', (code) => process.exit(code ?? 0));
