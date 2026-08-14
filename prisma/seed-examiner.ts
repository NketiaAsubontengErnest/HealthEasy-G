/**
 * Creates the two accounts the examiner uses to assess the deployed system.
 *
 * These are separate from the demonstration staff accounts so that the
 * credentials published in the submission (Links.txt) can be rotated or
 * revoked without disturbing the seeded hospital roster — and so that no
 * password needs to appear in the public source repository.
 *
 * The password is supplied through the environment, never hard-coded:
 *
 *   EXAMINER_PASSWORD="..." npm run db:seed:examiner
 */

import { PrismaClient } from '@prisma/client';
import { resolveDatasource } from './resolve-datasource';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ datasources: { db: { url: resolveDatasource().url } } });

const password = process.env.EXAMINER_PASSWORD;

if (!password || password.length < 12) {
  console.error(
    '\n✖ EXAMINER_PASSWORD must be set and at least 12 characters.\n' +
      '  Example: EXAMINER_PASSWORD="..." npm run db:seed:examiner\n'
  );
  process.exit(1);
}

const EXAMINERS = [
  {
    staffId: 'EXM-0001',
    name: 'Course Examiner (Administrator)',
    email: 'examiner.admin@ridgehms.gh',
    role: 'Super Admin',
    hierarchyLevel: 1,
    department: 'Executive IT'
  },
  {
    staffId: 'EXM-0002',
    name: 'Course Examiner (Clinician)',
    email: 'examiner.doctor@ridgehms.gh',
    role: 'Doctor',
    hierarchyLevel: 3,
    department: 'OPD Consultation'
  }
];

async function main() {
  const passwordHash = bcrypt.hashSync(password!, 10);

  for (const examiner of EXAMINERS) {
    await prisma.userStaff.upsert({
      where: { staffId: examiner.staffId },
      update: { passwordHash, status: 'Active', role: examiner.role },
      create: { ...examiner, passwordHash, status: 'Active' }
    });
    console.log(`✅ ${examiner.email.padEnd(30)} ${examiner.role}`);
  }

  console.log('\nExaminer accounts ready. Put the password in Links.txt only — never in the repository.');
}

main()
  .catch((error) => {
    console.error('❌ Examiner seeding failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
