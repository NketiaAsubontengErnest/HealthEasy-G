import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const claims = await prisma.nHISClaimLine.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: claims.length, data: claims });
  } catch (error: any) {
    console.error('Error fetching NHIS claims:', error);
    return NextResponse.json({ error: 'Failed to fetch NHIS claims' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      mrn,
      patientName,
      nhisNumber,
      gender,
      dob,
      attendanceDate,
      icdCode,
      icdDescription,
      gdrgCode,
      gdrgTariffGhc,
      medicineTariffGhc,
      totalClaimGhc,
      status,
      auditFlags
    } = body;

    const count = await prisma.nHISClaimLine.count();
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const newClaim = await prisma.nHISClaimLine.create({
      data: {
        claimNumber,
        patientId,
        mrn,
        patientName,
        nhisNumber: nhisNumber || 'N/A',
        gender: gender || 'Unspecified',
        dob: dob || '1990-01-01',
        attendanceDate: attendanceDate || new Date().toISOString().split('T')[0],
        icdCode: icdCode || 'Z00.0',
        icdDescription: icdDescription || 'General Medical Examination',
        gdrgCode: gdrgCode || 'G-DRG-01',
        gdrgTariffGhc: Number(gdrgTariffGhc) || 0,
        medicineTariffGhc: Number(medicineTariffGhc) || 0,
        totalClaimGhc: Number(totalClaimGhc) || 0,
        status: status || 'Passed Verification',
        auditFlags: auditFlags || []
      }
    });

    return NextResponse.json({ success: true, data: newClaim });
  } catch (error: any) {
    console.error('Error creating NHIS claim line:', error);
    return NextResponse.json({ error: error.message || 'Failed to create NHIS claim line' }, { status: 500 });
  }
}
