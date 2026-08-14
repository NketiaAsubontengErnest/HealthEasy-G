import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toPharmacyBatch } from '@/lib/adapters';

export const GET = withAuth('GET', async () => {
  // Ordered by expiry so the first batch returned is the one FEFO says to
  // pick first.
  const batches = await prisma.pharmacyBatch.findMany({ orderBy: { expiryDate: 'asc' } });
  const data = batches.map(toPharmacyBatch);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const PATCH = withAuth('PATCH', async (req, session) => {
  const body = await req.json();
  const { id, batchNumber, quantityInStock, reorderLevel, sellingPriceGhc } = body;

  if (!id && !batchNumber) {
    return NextResponse.json({ error: 'Provide the batch id or batchNumber to update.' }, { status: 400 });
  }

  const where = id ? { id } : { batchNumber };

  const updated = await prisma.pharmacyBatch.update({
    where: where as { id: string } | { batchNumber: string },
    data: {
      ...(quantityInStock !== undefined && { quantityInStock: Math.max(0, Number(quantityInStock)) }),
      ...(reorderLevel !== undefined && { reorderLevel: Math.max(0, Number(reorderLevel)) }),
      ...(sellingPriceGhc !== undefined && { sellingPriceGhc: Math.max(0, Number(sellingPriceGhc)) })
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'ADJUST_PHARMACY_STOCK',
      details: `Batch ${updated.batchNumber} (${updated.drugName}) adjusted to ${updated.quantityInStock} unit(s)`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toPharmacyBatch(updated) });
});
