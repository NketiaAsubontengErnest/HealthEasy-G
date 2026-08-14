#!/usr/bin/env node
/**
 * Prints row counts and the resolved column types for the date columns.
 * Handy for confirming a migration landed. Run: npm run db:inspect
 */

import { PrismaClient } from '@prisma/client';
import { resolveDatasource, redact } from '../prisma/resolve-datasource.ts';

const datasource = resolveDatasource();
console.log(`[db] ${datasource.description} → ${redact(datasource.url)}\n`);

const prisma = new PrismaClient({ datasources: { db: { url: datasource.url } }, log: [] });

const models = [
  'facilityBranch',
  'userStaff',
  'patient',
  'queueItem',
  'vitalSigns',
  'eMREncounter',
  'inpatientBed',
  'labOrder',
  'labTestCatalogue',
  'radiologyOrder',
  'pharmacyBatch',
  'dispenseRecord',
  'billingInvoice',
  'nHISClaimLine',
  'nHISClaimBatch',
  'medicationAdministrationRecord',
  'dhimsMonthlyReturn',
  'inventoryStoreItem',
  'auditLog'
];

console.log('Row counts');
for (const model of models) {
  const count = await prisma[model].count();
  console.log(`  ${count === 0 ? 'EMPTY' : '  ok '}  ${model.padEnd(32)} ${count}`);
}

const dateColumns = await prisma.$queryRawUnsafe(`
  select table_name || '.' || column_name as col, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and (column_name ilike '%date%' or column_name ilike '%expiry%'
         or column_name ilike '%timestamp%' or column_name = 'dob'
         or column_name in ('collectedAt','receivedAt','verificationTime','lastRestocked'))
  order by 1
`);

console.log('\nDate columns');
for (const column of dateColumns) {
  const nullable = column.is_nullable === 'YES' ? ' (nullable)' : '';
  const flag = column.data_type === 'text' ? ' <-- still text' : '';
  console.log(`  ${column.col.padEnd(40)} ${column.data_type}${nullable}${flag}`);
}

await prisma.$disconnect();
