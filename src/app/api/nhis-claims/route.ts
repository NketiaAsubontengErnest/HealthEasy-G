import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-guard';
import { toClaimLine } from '@/lib/adapters';
import { formatSequence, withUniqueNumber } from '@/lib/sequence';

export const GET = withAuth('GET', async () => {
  const claims = await prisma.nHISClaimLine.findMany({ orderBy: { createdAt: 'desc' } });
  const data = claims.map(toClaimLine);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req) => {
  const body = await req.json();
  const {
    patientId,
    mrn,
    patientName,
    nhisNumber,
    attendanceDate,
    icdCode,
    icdDescription,
    gdrgCode,
    gdrgTariffGhc,
    medicineCode,
    medicineTariffGhc,
    status
  } = body;

  if (!patientId || !mrn) {
    return NextResponse.json({ error: 'patientId and mrn are required.' }, { status: 400 });
  }

  // Demographics come from the patient record rather than the request body, so
  // a claim can never be submitted to NHIA with details that disagree with the
  // Master Patient Index.
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found in the Master Patient Index.' }, { status: 404 });
  }

  const auditFlags: string[] = [];
  if (!patient.nhisNumber && !nhisNumber) auditFlags.push('Missing NHIS membership number');
  if (patient.nhisStatus && patient.nhisStatus !== 'Active') auditFlags.push(`NHIS status is ${patient.nhisStatus}`);
  if (patient.nhisExpiry && new Date(patient.nhisExpiry).getTime() < Date.now()) {
    auditFlags.push(`NHIS card expired on ${patient.nhisExpiry}`);
  }
  if (!icdCode) auditFlags.push('No ICD-10 diagnosis code attached');

  const serviceTariff = Number(gdrgTariffGhc) || 0;
  const medicineTariff = Number(medicineTariffGhc) || 0;

  const newClaim = await withUniqueNumber(
    async (attempt) => formatSequence('CLM', (await prisma.nHISClaimLine.count()) + 1 + attempt),
    (claimNumber) =>
      prisma.nHISClaimLine.create({
        data: {
          claimNumber,
          patientId,
          mrn,
          patientName: patientName || patient.fullName,
          nhisNumber: patient.nhisNumber || nhisNumber || 'N/A',
          gender: patient.gender,
          dob: patient.dob,
          attendanceDate: attendanceDate || new Date().toISOString().split('T')[0],
          verificationRef: `VER-NHIA-${Math.floor(10_000 + Math.random() * 90_000)}`,
          icdCode: icdCode || 'Z00.0',
          icdDescription: icdDescription || 'General Medical Examination',
          gdrgCode: gdrgCode || 'G-DRG-01',
          gdrgTariffGhc: serviceTariff,
          medicineCode: medicineCode || 'N/A',
          medicineTariffGhc: medicineTariff,
          // Recomputed rather than trusted, so the header always equals the
          // sum of its tariff components.
          totalClaimGhc: serviceTariff + medicineTariff,
          status: auditFlags.length ? 'Draft' : status || 'Validated',
          auditFlags
        }
      })
  );

  return NextResponse.json({ success: true, data: toClaimLine(newClaim) });
});
