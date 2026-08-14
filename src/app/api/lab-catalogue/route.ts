import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const tests = await prisma.labTestCatalogue.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, count: tests.length, data: tests });
  } catch (error: any) {
    console.error('Error fetching lab catalogue from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch lab test catalogue from database' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, category, specimenType, costGhc, nhisCovered } = body;

    const newTest = await prisma.labTestCatalogue.create({
      data: {
        code,
        name,
        category: category || 'General Pathology',
        specimenType: specimenType || 'Blood / Plasma',
        costGhc: costGhc || 30.0,
        nhisCovered: nhisCovered !== undefined ? nhisCovered : true
      }
    });

    return NextResponse.json({ success: true, test: newTest });
  } catch (error: any) {
    console.error('Error creating lab test in DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to create lab test' }, { status: 500 });
  }
}
