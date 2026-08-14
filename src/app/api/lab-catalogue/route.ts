import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-guard';

export const GET = withAuth('GET', async () => {
  const tests = await prisma.labTestCatalogue.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ success: true, count: tests.length, data: tests });
});

export const POST = withAuth('POST', async (req) => {
  const body = await req.json();
  const { code, name, category, specimenType, costGhc, nhisCovered } = body;

  if (!code || !name) {
    return NextResponse.json({ error: 'Test code and name are required.' }, { status: 400 });
  }

  const duplicate = await prisma.labTestCatalogue.findUnique({ where: { code } });
  if (duplicate) {
    return NextResponse.json(
      { error: `Test code ${code} is already used by "${duplicate.name}".` },
      { status: 409 }
    );
  }

  const newTest = await prisma.labTestCatalogue.create({
    data: {
      code,
      name,
      category: category || 'General Pathology',
      specimenType: specimenType || 'Blood / Plasma',
      costGhc: Number(costGhc) || 30,
      nhisCovered: nhisCovered !== undefined ? Boolean(nhisCovered) : true
    }
  });

  return NextResponse.json({ success: true, data: newTest, test: newTest });
});
