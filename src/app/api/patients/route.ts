import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toPatient, toPatientCategory } from '@/lib/adapters';
import { formatSequence, withUniqueNumber } from '@/lib/sequence';

export const GET = withAuth('GET', async (req) => {
  const facilityId = new URL(req.url).searchParams.get('facilityId');
  const where = facilityId && facilityId !== 'all' ? { facilityId } : {};

  const patients = await prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' } });
  const data = patients.map(toPatient);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    fullName,
    dob,
    gender,
    phone,
    ghanaCardNo,
    nhisNumber,
    nhisStatus,
    nhisExpiry,
    patientCategory,
    gpsAddress,
    residentialAddress,
    emergencyContact,
    allergies,
    chronicConditions,
    bloodGroup,
    facilityId
  } = body;

  if (!fullName || !dob || !gender || !ghanaCardNo) {
    return NextResponse.json(
      { error: 'Full name, date of birth, gender and Ghana Card number are required.' },
      { status: 400 }
    );
  }

  const duplicate = await prisma.patient.findUnique({ where: { ghanaCardNo } });
  if (duplicate) {
    return NextResponse.json(
      {
        error: `Ghana Card ${ghanaCardNo} is already registered to ${duplicate.fullName} (${duplicate.mrn}). Use record merge instead of creating a duplicate.`
      },
      { status: 409 }
    );
  }

  const newPatient = await withUniqueNumber(
    async (attempt) => formatSequence('HG', (await prisma.patient.count()) + 1 + attempt, 4),
    (mrn) =>
      prisma.patient.create({
        data: {
          mrn,
          facilityId: facilityId || 'fac-1',
          fullName,
          dob,
          gender,
          phone: phone || '',
          ghanaCardNo,
          nhisNumber: nhisNumber || null,
          nhisStatus: nhisStatus || null,
          nhisExpiry: nhisExpiry || null,
          patientCategory: toPatientCategory(patientCategory),
          gpsAddress: gpsAddress || '',
          residentialAddress: residentialAddress || '',
          emergencyContact: emergencyContact || {},
          allergies: allergies || [],
          chronicConditions: chronicConditions || [],
          bloodGroup: bloodGroup || 'O+',
          registrationDate: new Date().toISOString().split('T')[0]
        }
      })
  );

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'REGISTER_PATIENT',
      patientId: newPatient.id,
      mrn: newPatient.mrn,
      details: `Registered patient ${newPatient.fullName} (${newPatient.mrn}) at facility ${newPatient.facilityId}`,
      ipAddress: clientIp(req)
    }
  });

  const patient = toPatient(newPatient);

  return NextResponse.json({
    success: true,
    message: 'Patient registered in PostgreSQL',
    data: patient,
    patient
  });
});
