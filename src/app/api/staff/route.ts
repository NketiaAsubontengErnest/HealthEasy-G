import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-guard';
import { toStaff } from '@/lib/adapters';
import { hashPassword } from '@/lib/auth';
import { ROLE_DEFINITIONS, UserRole } from '@/lib/types/rbac';
import { badRequest, requiredString } from '@/lib/validation';

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

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  try {
    const name = requiredString(body.name, 'Full name');
    const email = requiredString(body.email, 'Email', 254).toLowerCase();
    const password = requiredString(body.password, 'Password', 128);
    const staffId = requiredString(body.staffId, 'Staff ID', 100);
    const department = requiredString(body.department, 'Department');
    const role = requiredString(body.role, 'Role', 100) as UserRole;
    if (password.length < 12) throw new Error('Password must be at least 12 characters.');
    if (!ROLE_DEFINITIONS[role]) throw new Error('Role is not recognised.');

    const created = await prisma.userStaff.create({
      data: {
        name, email, staffId, department, role,
        hierarchyLevel: ROLE_DEFINITIONS[role].level,
        passwordHash: await hashPassword(password),
        facilityId: session.facilityId
      }
    });
    return NextResponse.json({ success: true, data: toStaff(created) }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
});
