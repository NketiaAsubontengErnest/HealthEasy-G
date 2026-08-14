import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, roleHasPermission, withAuth } from '@/lib/api-guard';
import { parseDate, toLabOrder } from '@/lib/adapters';
import { withUniqueNumber } from '@/lib/sequence';

const LAB_STATUSES = ['Ordered', 'Specimen Collected', 'In Analysis', 'Verified', 'Completed'] as const;
type LabStatus = (typeof LAB_STATUSES)[number];

export const GET = withAuth('GET', async (req) => {
  const patientId = new URL(req.url).searchParams.get('patientId');

  const labOrders = await prisma.labOrder.findMany({
    where: patientId ? { patientId } : {},
    orderBy: { createdAt: 'desc' }
  });

  const data = labOrders.map(toLabOrder);
  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const { encounterId, patientId, mrn, patientName, testCode, testName, testCategory, specimenType } = body;

  if (!patientId || !mrn) {
    return NextResponse.json({ error: 'patientId and mrn are required.' }, { status: 400 });
  }

  // Prefer catalogue metadata over whatever the caller supplied so specimen
  // type and category stay consistent with the hospital test catalogue.
  const catalogueEntry = testCode
    ? await prisma.labTestCatalogue.findUnique({ where: { code: testCode } })
    : null;

  const newLabOrder = await withUniqueNumber(
    async () => `BC-${Math.floor(1_000_000 + Math.random() * 9_000_000)}`,
    (barcodeNo) =>
      prisma.labOrder.create({
        data: {
          encounterId: encounterId || null,
          patientId,
          mrn,
          patientName: patientName || '',
          testCode: catalogueEntry?.code ?? testCode ?? 'LAB-GEN',
          testName: catalogueEntry?.name ?? testName ?? 'General Laboratory Investigation',
          testCategory: catalogueEntry?.category ?? testCategory ?? 'General Pathology',
          specimenType: catalogueEntry?.specimenType ?? specimenType ?? 'Blood / Plasma',
          barcodeNo,
          orderedBy: session.name,
          orderTimestamp: new Date(),
          status: 'Ordered'
        }
      })
  );

  return NextResponse.json({ success: true, data: toLabOrder(newLabOrder) });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, status, results, collectedAt, receivedAt } = body;

  if (!id) {
    return NextResponse.json({ error: 'Lab order ID is required' }, { status: 400 });
  }

  if (status && !LAB_STATUSES.includes(status as LabStatus)) {
    return NextResponse.json(
      { error: `Invalid lab status "${status}". Expected one of: ${LAB_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  // Releasing a result to the clinical record is a separate, higher privilege
  // than running the test: only a verifier may set the Verified state.
  const isVerification = status === 'Verified' || status === 'Completed';
  if (isVerification && !roleHasPermission(session.role, 'VERIFY_LAB_RESULTS')) {
    return NextResponse.json(
      {
        error: `Role "${session.role}" may record laboratory results but not verify them. A Laboratory Scientist with VERIFY_LAB_RESULTS must release this report.`
      },
      { status: 403 }
    );
  }

  const updated = await prisma.labOrder.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(results !== undefined && { results }),
      ...(collectedAt && { collectedAt: parseDate(collectedAt, 'collection time') }),
      ...(receivedAt && { receivedAt: parseDate(receivedAt, 'receipt time') }),
      ...(results !== undefined && { technicianName: session.name }),
      ...(isVerification && {
        verifiedById: session.id,
        verifiedByName: session.name,
        verificationTime: new Date()
      })
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: isVerification ? 'VERIFY_LAB_RESULT' : 'UPDATE_LAB_ORDER',
      patientId: updated.patientId,
      mrn: updated.mrn,
      details: `${updated.testName} (${updated.barcodeNo}) set to ${updated.status}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toLabOrder(updated) });
});
