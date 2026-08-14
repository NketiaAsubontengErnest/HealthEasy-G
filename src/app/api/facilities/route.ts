import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LicenseStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const facilities = await prisma.facilityBranch.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: facilities.length, data: facilities });
  } catch (error: any) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json({ error: 'Failed to fetch facilities from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, hefraLicenseNo, hefraExpiryDate, location, gpsAddress, phone, email } = body;

    const newFacility = await prisma.facilityBranch.create({
      data: {
        name,
        code,
        hefraLicenseNo,
        hefraExpiryDate,
        hefraStatus: 'ACTIVE',
        location,
        gpsAddress,
        phone,
        email,
      },
    });

    return NextResponse.json({ success: true, message: 'Facility branch created in PostgreSQL', facility: newFacility });
  } catch (error: any) {
    console.error('Error creating facility:', error);
    return NextResponse.json({ error: error.message || 'Failed to create facility branch' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hefraStatus } = body;

    if (!id) {
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
    }

    let statusEnum: LicenseStatus = LicenseStatus.ACTIVE;
    if (hefraStatus === 'PENDING_RENEWAL' || hefraStatus === 'Pending Renewal') statusEnum = LicenseStatus.PENDING_RENEWAL;
    else if (hefraStatus === 'EXPIRED' || hefraStatus === 'Expired') statusEnum = LicenseStatus.EXPIRED;

    const updated = await prisma.facilityBranch.update({
      where: { id },
      data: { hefraStatus: statusEnum }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating facility status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update facility status' }, { status: 500 });
  }
}
