import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, roleHasPermission, withAuth } from '@/lib/api-guard';
import { toRadiologyOrder } from '@/lib/adapters';
import { formatSequence, withUniqueNumber } from '@/lib/sequence';

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const orders = await prisma.radiologyOrder.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { createdAt: 'desc' }
  });

  const data = orders.map(toRadiologyOrder);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    id,
    patientId,
    mrn,
    patientName,
    modality,
    studyType,
    bodyPart,
    clinicalIndication,
    clinicalHistory,
    pregnancyScreened,
    radiographerNotes,
    radiologistReport,
    status,
    imageUrls,
    criticalFindings
  } = body;

  // Updating an existing study (upload images, write or sign a report).
  if (id) {
    const existing = await prisma.radiologyOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Radiology order not found' }, { status: 404 });
    }

    // A radiographer performs and uploads the study; only a radiologist may
    // author and sign the interpretation.
    const isReporting = radiologistReport !== undefined || status === 'Report Verified';
    if (isReporting && !roleHasPermission(session.role, 'WRITE_RADIOLOGY_REPORT')) {
      return NextResponse.json(
        {
          error: `Role "${session.role}" may perform and upload imaging but not issue an interpretation. A Radiologist must sign this report.`
        },
        { status: 403 }
      );
    }

    const updated = await prisma.radiologyOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(radiographerNotes !== undefined && { radiographerNotes }),
        ...(Array.isArray(imageUrls) && { imageUrls }),
        ...(criticalFindings !== undefined && { criticalFindings: Boolean(criticalFindings) }),
        ...(isReporting && {
          reportContent: radiologistReport ?? existing.reportContent,
          radiologistName: session.name,
          signedTimestamp: new Date()
        })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        role: session.role,
        action: isReporting ? 'SIGN_RADIOLOGY_REPORT' : 'UPDATE_RADIOLOGY_STUDY',
        patientId: updated.patientId,
        mrn: updated.mrn,
        details: `${updated.studyType} ${updated.bodyPart} (${updated.pacsAccessionNo}) set to ${updated.status}`,
        ipAddress: clientIp(req)
      }
    });

    return NextResponse.json({ success: true, data: toRadiologyOrder(updated) });
  }

  if (!patientId || !mrn) {
    return NextResponse.json({ error: 'patientId and mrn are required.' }, { status: 400 });
  }

  const newOrder = await withUniqueNumber(
    async (attempt) => formatSequence('ACC', (await prisma.radiologyOrder.count()) + 1 + attempt),
    (pacsAccessionNo) =>
      prisma.radiologyOrder.create({
        data: {
          patientId,
          mrn,
          patientName: patientName || '',
          studyType: modality || studyType || 'X-Ray',
          bodyPart: bodyPart || 'Chest (PA)',
          clinicalHistory: clinicalIndication || clinicalHistory || 'Routine clinical investigation',
          pregnancyScreened: Boolean(pregnancyScreened),
          orderedBy: session.name,
          orderTimestamp: new Date(),
          status: status || 'Ordered',
          pacsAccessionNo,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          criticalFindings: Boolean(criticalFindings)
        }
      })
  );

  return NextResponse.json({ success: true, data: toRadiologyOrder(newOrder) });
});
