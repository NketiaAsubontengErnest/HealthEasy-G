import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PatientCategory } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const invoices = await prisma.billingInvoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, count: invoices.length, data: invoices });
  } catch (error: any) {
    console.error('Error fetching billing invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch billing invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      mrn,
      patientName,
      patientCategory,
      subtotalGhc,
      nhisExemptionGhc,
      totalAmountGhc,
      paidAmountGhc,
      balanceGhc,
      status,
      paymentMethod,
      cashierName,
      receiptNumber,
      lineItems
    } = body;

    const count = await prisma.billingInvoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Map patientCategory safely to enum or default to CASH
    let validCat: PatientCategory = PatientCategory.CASH;
    if (patientCategory === 'NHIS') validCat = PatientCategory.NHIS;
    else if (patientCategory === 'CORPORATE') validCat = PatientCategory.CORPORATE;
    else if (patientCategory === 'PRIVATE_INSURANCE') validCat = PatientCategory.PRIVATE_INSURANCE;
    else if (patientCategory === 'EXEMPTED') validCat = PatientCategory.EXEMPTED;

    const newInvoice = await prisma.billingInvoice.create({
      data: {
        invoiceNumber,
        patientId,
        mrn,
        patientName,
        patientCategory: validCat,
        subtotalGhc: Number(subtotalGhc) || 0,
        nhisExemptionGhc: Number(nhisExemptionGhc) || 0,
        totalAmountGhc: Number(totalAmountGhc) || 0,
        paidAmountGhc: Number(paidAmountGhc) || 0,
        balanceGhc: Number(balanceGhc) || 0,
        status: status || 'Unpaid',
        paymentMethod: paymentMethod || null,
        cashierName: cashierName || null,
        receiptNumber: receiptNumber || null,
        lineItems: lineItems || []
      }
    });

    return NextResponse.json({ success: true, data: newInvoice });
  } catch (error: any) {
    console.error('Error creating billing invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create billing invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, paidAmountGhc, balanceGhc, status, paymentMethod, cashierName, receiptNumber } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const updated = await prisma.billingInvoice.update({
      where: { id },
      data: {
        ...(paidAmountGhc !== undefined && { paidAmountGhc: Number(paidAmountGhc) }),
        ...(balanceGhc !== undefined && { balanceGhc: Number(balanceGhc) }),
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(cashierName && { cashierName }),
        ...(receiptNumber && { receiptNumber })
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating billing invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update billing invoice' }, { status: 500 });
  }
}
