import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toEsiSeverity, toVitalSigns } from '@/lib/adapters';

/**
 * Ranges follow the Ghana Health Service triage protocol thresholds used on
 * the triage page, so the alert list is computed once on the server instead of
 * being re-derived (inconsistently) by each screen.
 */
function abnormalAlerts(v: {
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  bloodGlucoseMmoles: number;
}): string[] {
  const alerts: string[] = [];

  if (v.systolicBp >= 180 || v.diastolicBp >= 120) alerts.push('Hypertensive crisis');
  else if (v.systolicBp >= 140 || v.diastolicBp >= 90) alerts.push('Elevated blood pressure');
  else if (v.systolicBp < 90) alerts.push('Hypotension');

  if (v.oxygenSaturation < 90) alerts.push('Severe hypoxaemia (SpO2 < 90%)');
  else if (v.oxygenSaturation < 94) alerts.push('Low oxygen saturation');

  if (v.temperature >= 38) alerts.push('Febrile');
  else if (v.temperature < 35.5) alerts.push('Hypothermia');

  if (v.pulseRate > 120) alerts.push('Tachycardia');
  else if (v.pulseRate < 50) alerts.push('Bradycardia');

  if (v.respiratoryRate > 24) alerts.push('Tachypnoea');
  if (v.bloodGlucoseMmoles < 3.9) alerts.push('Hypoglycaemia');
  else if (v.bloodGlucoseMmoles > 11.1) alerts.push('Hyperglycaemia');

  return alerts;
}

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const vitals = await prisma.vitalSigns.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { timestamp: 'desc' }
  });

  const data = vitals.map(toVitalSigns);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    patientId,
    encounterId,
    systolicBp,
    diastolicBp,
    pulseRate,
    temperature,
    respiratoryRate,
    oxygenSaturation,
    weightKg,
    heightCm,
    bloodGlucoseMmoles,
    painScore,
    pregnancyStatus,
    esiSeverity,
    nursingNotes
  } = body;

  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required to record vitals.' }, { status: 400 });
  }

  const measurements = {
    systolicBp: Number(systolicBp) || 120,
    diastolicBp: Number(diastolicBp) || 80,
    pulseRate: Number(pulseRate) || 75,
    temperature: Number(temperature) || 36.8,
    respiratoryRate: Number(respiratoryRate) || 18,
    oxygenSaturation: Number(oxygenSaturation) || 98,
    bloodGlucoseMmoles: Number(bloodGlucoseMmoles) || 5.5
  };

  const weight = Number(weightKg) || 70;
  const height = Number(heightCm) || 170;

  const newVital = await prisma.vitalSigns.create({
    data: {
      patientId,
      encounterId: encounterId || null,
      ...measurements,
      weightKg: weight,
      heightCm: height,
      bmi: Number((weight / (height / 100) ** 2).toFixed(1)),
      painScore: Number(painScore) || 0,
      pregnancyStatus: pregnancyStatus || null,
      // Previously hard-coded to ESI_3_URGENT, which discarded whatever
      // severity the triage nurse actually selected.
      esiSeverity: toEsiSeverity(esiSeverity),
      abnormalAlerts: abnormalAlerts(measurements),
      nursingNotes: nursingNotes || 'Patient stable.',
      recordedById: session.id,
      recordedByName: session.name
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'RECORD_VITALS',
      patientId,
      details: `Recorded triage vitals — BP ${measurements.systolicBp}/${measurements.diastolicBp}, SpO2 ${measurements.oxygenSaturation}%`,
      ipAddress: clientIp(req)
    }
  });

  const vital = toVitalSigns(newVital);
  return NextResponse.json({ success: true, data: vital, vital });
});
