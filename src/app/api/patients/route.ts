import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const facilityId = req.nextUrl.searchParams.get('facilityId');
    const whereClause = facilityId && facilityId !== 'all' ? { facilityId } : {};

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: patients.length, data: patients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patient records from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      dob,
      gender,
      phone,
      ghanaCardNo,
      nhisNumber,
      patientCategory,
      gpsAddress,
      residentialAddress,
      emergencyContact,
      allergies,
      chronicConditions,
      bloodGroup,
      facilityId
    } = body;

    const count = await prisma.patient.count();
    const mrn = `HG-2026-${String(count + 1).padStart(4, '0')}`;

    const newPatient = await prisma.patient.create({
      data: {
        mrn,
        facilityId: facilityId || 'fac-1',
        fullName,
        dob,
        gender,
        phone,
        ghanaCardNo,
        nhisNumber,
        patientCategory: patientCategory || 'CASH',
        gpsAddress,
        residentialAddress,
        emergencyContact: emergencyContact || {},
        allergies: allergies || [],
        chronicConditions: chronicConditions || [],
        bloodGroup: bloodGroup || 'O+',
        registrationDate: new Date().toISOString().split('T')[0],
      },
    });

    return NextResponse.json({ success: true, message: 'Patient registered in PostgreSQL', patient: newPatient });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: error.message || 'Failed to create patient record' }, { status: 500 });
  }
}
