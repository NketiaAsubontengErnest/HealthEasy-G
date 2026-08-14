import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const items = await prisma.inventoryStoreItem.findMany({
      orderBy: { itemName: 'asc' },
    });
    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemName, category, storeLocation, quantity, unit, unitPriceGhc, reorderPoint, supplier } = body;

    const count = await prisma.inventoryStoreItem.count();
    const itemCode = `INV-ITEM-${String(count + 1).padStart(4, '0')}`;

    const newItem = await prisma.inventoryStoreItem.create({
      data: {
        itemCode,
        itemName,
        category: category || 'General Stores',
        storeLocation: storeLocation || 'Central Medical Stores',
        quantity: Number(quantity) || 0,
        unit: unit || 'Boxes',
        unitPriceGhc: Number(unitPriceGhc) || 0,
        reorderPoint: Number(reorderPoint) || 20,
        supplier: supplier || 'Ghana Medical Supplies Ltd',
        lastRestocked: new Date().toISOString().split('T')[0]
      }
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: error.message || 'Failed to create inventory item' }, { status: 500 });
  }
}
