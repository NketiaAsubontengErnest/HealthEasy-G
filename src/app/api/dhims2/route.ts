import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';

/**
 * DHIMS2 monthly return.
 *
 * Every figure that the system already holds is computed live from the
 * clinical tables — attendance, the age/sex disaggregation the GHS return
 * requires, top diagnoses by ICD-10, admissions and NHIS claim value. The two
 * figures the system has no source for (deaths and deliveries) are read from
 * `DhimsMonthlyReturn`, where the records officer enters them, exactly as on
 * the paper return.
 *
 * This replaces a hard-coded summary object that reported the same numbers
 * every month regardless of what the hospital actually did.
 */

function monthBounds(monthYear: string): { start: Date; end: Date } {
  const start = new Date(`${monthYear}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

function ageInYears(dob: Date | string, on: Date): number | null {
  const born = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(born.getTime())) return null;

  let age = on.getUTCFullYear() - born.getUTCFullYear();
  const monthDelta = on.getUTCMonth() - born.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getUTCDate() < born.getUTCDate())) age--;
  return age;
}

export const GET = withAuth('GET', async (req) => {
  const requested = new URL(req.url).searchParams.get('monthYear');
  const monthYear = requested && /^\d{4}-\d{2}$/.test(requested) ? requested : new Date().toISOString().slice(0, 7);

  const { start, end } = monthBounds(monthYear);

  const [encounters, manualReturn, claimTotals, admissions] = await Promise.all([
    prisma.eMREncounter.findMany({
      where: { timestamp: { gte: start, lt: end } },
      select: { patientId: true, icdDiagnoses: true }
    }),
    prisma.dhimsMonthlyReturn.findUnique({ where: { monthYear } }),
    prisma.nHISClaimLine.aggregate({
      where: { attendanceDate: { gte: start, lt: end } },
      _sum: { totalClaimGhc: true }
    }),
    prisma.inpatientBed.count({
      where: { admissionDate: { gte: start, lt: end } }
    })
  ]);

  // Age and sex come from the patient record, resolved once per attendance.
  const patientIds = Array.from(new Set(encounters.map((e) => e.patientId)));
  const patients = patientIds.length
    ? await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, dob: true, gender: true }
      })
    : [];

  const patientById = new Map(patients.map((p) => [p.id, p]));

  const counts = { opdUnder5Male: 0, opdUnder5Female: 0, opdAbove5Male: 0, opdAbove5Female: 0 };
  const diagnosisTally = new Map<string, number>();

  for (const encounter of encounters) {
    const patient = patientById.get(encounter.patientId);
    if (patient) {
      const age = ageInYears(patient.dob, end);
      const isFemale = patient.gender?.toLowerCase().startsWith('f');
      const isUnderFive = age !== null && age < 5;

      if (isUnderFive) {
        if (isFemale) counts.opdUnder5Female++;
        else counts.opdUnder5Male++;
      } else if (isFemale) counts.opdAbove5Female++;
      else counts.opdAbove5Male++;
    }

    // `icdDiagnoses` is a JSON array of { code, name, category }.
    const diagnoses = Array.isArray(encounter.icdDiagnoses)
      ? (encounter.icdDiagnoses as { code?: string; name?: string }[])
      : [];

    for (const diagnosis of diagnoses) {
      const label = diagnosis?.name || diagnosis?.code;
      if (label) diagnosisTally.set(label, (diagnosisTally.get(label) ?? 0) + 1);
    }
  }

  const topDiagnoses = Array.from(diagnosisTally.entries())
    .map(([disease, cases]) => ({ disease, cases }))
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    data: {
      monthYear,
      totalOpdAttendance: encounters.length,
      ...counts,
      topDiagnoses,
      totalAdmissions: admissions,
      totalDischarges: manualReturn?.totalDischarges ?? 0,
      totalDeaths: manualReturn?.totalDeaths ?? 0,
      maternalDeliveries: manualReturn?.maternalDeliveries ?? 0,
      nhisClaimsSubmittedGhc: claimTotals._sum.totalClaimGhc ?? 0,
      // Tells the UI whether the manually captured half of the return exists.
      manualReturnSubmitted: Boolean(manualReturn?.submittedAt)
    }
  });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const { monthYear, totalDeaths, maternalDeliveries, totalDischarges } = body;

  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return NextResponse.json({ error: 'monthYear is required in YYYY-MM format.' }, { status: 400 });
  }

  const figures = {
    totalDeaths: Math.max(0, Number(totalDeaths) || 0),
    maternalDeliveries: Math.max(0, Number(maternalDeliveries) || 0),
    totalDischarges: Math.max(0, Number(totalDischarges) || 0),
    submittedBy: session.name,
    submittedAt: new Date()
  };

  const saved = await prisma.dhimsMonthlyReturn.upsert({
    where: { monthYear },
    update: figures,
    create: {
      monthYear,
      facilityCode: process.env.NEXT_PUBLIC_FACILITY_CODE || 'GAR-RIDGE-01',
      ...figures
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'SUBMIT_DHIMS2_RETURN',
      details: `DHIMS2 return for ${monthYear}: ${saved.totalDeaths} death(s), ${saved.maternalDeliveries} delivery/deliveries, ${saved.totalDischarges} discharge(s)`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: saved });
});
