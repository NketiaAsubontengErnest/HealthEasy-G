import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, withAuth } from '@/lib/api-guard';
import { toDateOnly, toInventoryItem } from '@/lib/adapters';
import { withUniqueNumber } from '@/lib/sequence';

export const GET = withAuth('GET', async () => {
  const items = await prisma.inventoryStoreItem.findMany({ orderBy: { itemName: 'asc' } });
  const data = items.map(toInventoryItem);

  return NextResponse.json({ success: true, count: data.length, data });
});

export const POST = withAuth('POST', async (req, session) => {
  const body = await req.json();
  const {
    itemName,
    category,
    storeLocation,
    batchNo,
    expiryDate,
    quantity,
    unit,
    unitPriceGhc,
    reorderPoint,
    supplier
  } = body;

  if (!itemName) {
    return NextResponse.json({ error: 'itemName is required.' }, { status: 400 });
  }

  const newItem = await withUniqueNumber(
    async (attempt) =>
      `INV-ITEM-${String((await prisma.inventoryStoreItem.count()) + 1 + attempt).padStart(4, '0')}`,
    (itemCode) =>
      prisma.inventoryStoreItem.create({
        data: {
          itemCode,
          itemName,
          category: category || 'General Supply',
          storeLocation: storeLocation || 'Central Store',
          batchNo: batchNo || 'N/A',
          expiryDate: toDateOnly(expiryDate, 'expiry date'),
          quantity: Number(quantity) || 0,
          unit: unit || 'Boxes',
          unitPriceGhc: Number(unitPriceGhc) || 0,
          reorderPoint: Number(reorderPoint) || 20,
          supplier: supplier || 'Ghana Medical Supplies Ltd',
          lastRestocked: new Date()
        }
      })
  );

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      userName: session.name,
      role: session.role,
      action: 'RECEIVE_STOCK',
      details: `Added ${newItem.quantity} ${newItem.unit} of ${newItem.itemName} (${newItem.itemCode}) to ${newItem.storeLocation}`,
      ipAddress: clientIp(req)
    }
  });

  return NextResponse.json({ success: true, data: toInventoryItem(newItem) });
});
