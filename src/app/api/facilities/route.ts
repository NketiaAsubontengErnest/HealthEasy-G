import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toFacility, toLicenseStatus } from '@/lib/adapters';

export const GET = withAuth('GET', async () => {
  const facilities = await prisma.facilityBranch.findMany({ orderBy: { createdAt: 'desc' } });
  const data = facilities.map(toFacility);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    name,
    code,
    hefraLicenseNo,
    hefraExpiryDate,
    location,
    gpsAddress,
    phone,
    email,
    region,
    facilityType,
    status,
    adminName,
    adminEmail,
    bedCapacity
  } = body;

  if (!name || !code) {
    return NextResponse.json({ error: 'Facility name and code are required.' }, { status: 400 });
  }

  const duplicate = await prisma.facilityBranch.findUnique({ where: { code } });
  if (duplicate) {
    return NextResponse.json(
      { error: `Facility code ${code} is already registered to ${duplicate.name}.` },
      { status: 409 }
    );
  }

  const newFacility = await prisma.facilityBranch.create({
    data: {
      name,
      code,
      hefraLicenseNo: hefraLicenseNo || '',
      hefraExpiryDate: hefraExpiryDate || '',
      hefraStatus: 'ACTIVE',
      location: location || '',
      gpsAddress: gpsAddress || '',
      phone: phone || '',
      email: email || '',
      region: region || 'Greater Accra',
      facilityType: facilityType || 'District',
      status: status || 'Onboarding',
      adminName: adminName || 'Unassigned',
      adminEmail: adminEmail || '',
      bedCapacity: Number(bedCapacity) || 0
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'CREATE_FACILITY',
      details: `Registered hospital ${newFacility.name} (${newFacility.code}) in ${newFacility.region}`,
      ipAddress: clientIp(req)
    }
  });

  const facility = toFacility(newFacility);
  return NextResponse.json({ success: true, data: facility, facility });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, hefraStatus, status, adminName, adminEmail, bedCapacity } = body;

  if (!id) {
    return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
  }

  const updated = await prisma.facilityBranch.update({
    where: { id },
    data: {
      ...(hefraStatus !== undefined && { hefraStatus: toLicenseStatus(hefraStatus) }),
      ...(status !== undefined && { status }),
      ...(adminName !== undefined && { adminName }),
      ...(adminEmail !== undefined && { adminEmail }),
      ...(bedCapacity !== undefined && { bedCapacity: Number(bedCapacity) || 0 })
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'UPDATE_FACILITY',
      details: `Updated ${updated.name} (${updated.code}) — operational status ${updated.status}, HeFRA licence ${updated.hefraStatus}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toFacility(updated) });
});
