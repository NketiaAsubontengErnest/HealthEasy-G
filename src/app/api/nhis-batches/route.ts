import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toClaimBatch } from '@/lib/adapters';

export const GET = withAuth('GET', async () => {
  const batches = await prisma.nHISClaimBatch.findMany({ orderBy: { createdAt: 'desc' } });
  const data = batches.map(toClaimBatch);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const { monthYear, facilityCode } = body;

  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return NextResponse.json({ error: 'monthYear is required in YYYY-MM format.' }, { status: 400 });
  }

  const code = facilityCode || process.env.NEXT_PUBLIC_FACILITY_CODE || 'GAR-RIDGE-01';

  // The batch header is computed from the claim lines it will carry, so the
  // count and total can never disagree with what is actually submitted.
  const monthStart = new Date(`${monthYear}-01T00:00:00.000Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const claims = await prisma.nHISClaimLine.findMany({
    where: {
      batchId: null,
      status: { in: ['Validated', 'Passed Verification'] },
      attendanceDate: {
        gte: monthStart.toISOString().split('T')[0],
        lt: monthEnd.toISOString().split('T')[0]
      }
    },
    select: { id: true, totalClaimGhc: true }
  });

  if (claims.length === 0) {
    return NextResponse.json(
      { error: `No unbatched, validated claims found for ${monthYear}.` },
      { status: 409 }
    );
  }

  const totalAmountGhc = claims.reduce((sum, claim) => sum + claim.totalClaimGhc, 0);

  const batch = await prisma.$transaction(async (tx) => {
    const sequence = (await tx.nHISClaimBatch.count({ where: { monthYear } })) + 1;

    const created = await tx.nHISClaimBatch.create({
      data: {
        batchNo: `NHIA-${code}-${monthYear}-B${sequence}`,
        monthYear,
        facilityCode: code,
        claimCount: claims.length,
        totalAmountGhc,
        status: 'Prepared',
        preparedBy: session.name
      }
    });

    // Stamping the claims inside the same transaction is what stops a claim
    // being submitted twice in two different batches.
    await tx.nHISClaimLine.updateMany({
      where: { id: { in: claims.map((claim) => claim.id) } },
      data: { batchId: created.id, status: 'Batched' }
    });

    return created;
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'PREPARE_CLAIM_BATCH',
      details: `Prepared batch ${batch.batchNo} — ${batch.claimCount} claims totalling GHS ${batch.totalAmountGhc.toFixed(2)}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toClaimBatch(batch) });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, status } = body;

  const STATUSES = ['Prepared', 'Exported CLAIM-it', 'Submitted to NHIA', 'Reconciled'];

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
  }

  if (!STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid batch status "${status}". Expected one of: ${STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  const batch = await prisma.nHISClaimBatch.update({ where: { id }, data: { status } });

  // Reconciliation settles every claim the batch carried.
  if (status === 'Reconciled') {
    await prisma.nHISClaimLine.updateMany({ where: { batchId: id }, data: { status: 'Paid' } });
  } else if (status === 'Submitted to NHIA') {
    await prisma.nHISClaimLine.updateMany({ where: { batchId: id }, data: { status: 'Submitted' } });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'UPDATE_CLAIM_BATCH',
      details: `Batch ${batch.batchNo} set to ${status}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toClaimBatch(batch) });
});
