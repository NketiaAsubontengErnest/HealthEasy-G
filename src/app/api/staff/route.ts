import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-guard';
import { toStaff } from '@/lib/adapters';

/**
 * Staff directory. The 20 seeded accounts previously existed only in the
 * database — every screen read a hard-coded list in HMSContext, so licence
 * expiry warnings never reflected reality.
 *
 * `select` is explicit: `passwordHash` must never leave the server, and a
 * `findMany()` without it would ship every bcrypt hash to the browser.
 */
export const GET = withAuth('GET', async () => {
  const staff = await prisma.userStaff.findMany({
    orderBy: [{ hierarchyLevel: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      role: true,
      hierarchyLevel: true,
      reportsTo: true,
      staffId: true,
      licenseNumber: true,
      licensingBody: true,
      licenseExpiry: true,
      status: true,
      department: true,
      email: true,
      phone: true
    }
  });

  const data = staff.map(toStaff);
  return NextResponse.json({ success: true, count: data.length, data });
});
