import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const vitals = await prisma.vitalSigns.findMany({
      orderBy: { timestamp: 'desc' },
    });
    return NextResponse.json({ success: true, count: vitals.length, data: vitals });
  } catch (error: any) {
    console.error('Error fetching vitals from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch vital signs from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
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
      esiSeverity,
      nurseName,
      nursingNotes
    } = body;

    const newVital = await prisma.vitalSigns.create({
      data: {
        patientId,
        systolicBp: systolicBp || 120,
        diastolicBp: diastolicBp || 80,
        pulseRate: pulseRate || 75,
        temperature: temperature || 36.8,
        respiratoryRate: respiratoryRate || 18,
        oxygenSaturation: oxygenSaturation || 98,
        weightKg: weightKg || 70,
        heightCm: heightCm || 170,
        bmi: weightKg && heightCm ? Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)) : 24.2,
        bloodGlucoseMmoles: bloodGlucoseMmoles || 5.5,
        painScore: painScore || 0,
        esiSeverity: 'ESI_3_URGENT',
        nursingNotes: nursingNotes || 'Patient stable.',
        recordedByName: nurseName || 'Triage Nurse'
      }
    });

    return NextResponse.json({ success: true, vital: newVital });
  } catch (error: any) {
    console.error('Error recording vitals in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to record vitals' }, { status: 500 });
  }
}
