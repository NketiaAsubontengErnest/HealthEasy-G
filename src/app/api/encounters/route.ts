import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const encounters = await prisma.eMREncounter.findMany({
      orderBy: { timestamp: 'desc' },
    });
    return NextResponse.json({ success: true, count: encounters.length, data: encounters });
  } catch (error: any) {
    console.error('Error fetching encounters from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch encounters from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      mrn,
      patientName,
      clinicianName,
      presentingComplaints,
      historyOfPresentingComplaint,
      pastMedicalHistory,
      physicalExamination,
      icdDiagnoses,
      treatmentPlan,
      sickLeaveDays,
      orders
    } = body;

    const newEncounter = await prisma.eMREncounter.create({
      data: {
        patientId,
        mrn,
        patientName,
        clinicianName: clinicianName || 'Dr. Kwame Mensah',
        chiefComplaint: presentingComplaints || 'General OPD Consultation',
        historyOfIllness: historyOfPresentingComplaint || 'Acute presentation',
        physicalExam: physicalExamination || 'Patient conscious and alert',
        icdDiagnoses: icdDiagnoses || [],
        orders: orders || [],
        treatmentPlan: treatmentPlan || 'Conservative management',
        sickLeaveDays: sickLeaveDays || 0
      }
    });

    return NextResponse.json({ success: true, encounter: newEncounter });
  } catch (error: any) {
    console.error('Error creating encounter in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to record encounter' }, { status: 500 });
  }
}
