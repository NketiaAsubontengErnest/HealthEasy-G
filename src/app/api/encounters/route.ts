import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toEncounter } from '@/lib/adapters';

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const encounters = await prisma.eMREncounter.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { timestamp: 'desc' }
  });

  const data = encounters.map(toEncounter);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    patientId,
    mrn,
    patientName,
    encounterType,
    presentingComplaints,
    historyOfPresentingComplaint,
    pastMedicalHistory,
    physicalExamination,
    icdDiagnoses,
    clinicalNotes,
    treatmentPlan,
    dischargeDecision,
    sickLeaveDays,
    orders
  } = body;

  if (!patientId || !mrn) {
    return NextResponse.json({ error: 'patientId and mrn are required.' }, { status: 400 });
  }

  const newEncounter = await prisma.eMREncounter.create({
    data: {
      patientId,
      mrn,
      patientName: patientName || '',
      encounterType: encounterType || 'OPD',
      // The clinician is the signed-in user; it was previously defaulted to a
      // hard-coded doctor's name when the body omitted it.
      clinicianName: session.name,
      signedById: session.id,
      chiefComplaint: presentingComplaints || 'General OPD Consultation',
      historyOfIllness: historyOfPresentingComplaint || 'Acute presentation',
      pastMedicalHistory: pastMedicalHistory || '',
      physicalExam: physicalExamination || 'Patient conscious and alert',
      icdDiagnoses: icdDiagnoses || [],
      orders: orders || [],
      clinicalNotes: clinicalNotes || '',
      treatmentPlan: treatmentPlan || 'Conservative management',
      dischargeDecision: dischargeDecision || null,
      signed: true,
      sickLeaveDays: Number(sickLeaveDays) || 0
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'CREATE_ENCOUNTER',
      patientId,
      mrn,
      details: `Signed ${newEncounter.encounterType} consultation note for ${patientName} (${mrn})`,
      ipAddress: clientIp(req)
    }
  });

  const encounter = toEncounter(newEncounter);
  return NextResponse.json({ success: true, data: encounter, encounter });
});
