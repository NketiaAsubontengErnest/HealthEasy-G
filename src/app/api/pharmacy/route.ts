import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const batches = await prisma.pharmacyBatch.findMany({
      orderBy: { expiryDate: 'asc' },
    });
    return NextResponse.json({ success: true, count: batches.length, data: batches });
  } catch (error: any) {
    console.error('Error fetching pharmacy batches from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch pharmacy stock from database' }, { status: 500 });
  }
}
