import { PrismaClient } from '@prisma/client';
import { redact, resolveDatasource } from '../../prisma/resolve-datasource';

/**
 * A single Prisma client, pointed at whichever PostgreSQL instance the
 * environment selects — the local database when the hospital is offline, the
 * managed cloud database when it is online. See `prisma/resolve-datasource.ts`.
 */

const globalForPrisma = global as unknown as { prisma?: PrismaClient; prismaTarget?: string };

function createClient(): PrismaClient {
  const datasource = resolveDatasource();

  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prismaTarget !== datasource.description) {
    globalForPrisma.prismaTarget = datasource.description;
    console.log(`[db] ${datasource.description} → ${redact(datasource.url)}`);
  }

  return new PrismaClient({
    datasources: { db: { url: datasource.url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
