import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BedStatus, QueueStatus } from '@prisma/client';
import { withAuth } from '@/lib/api-guard';

/**
 * Facility-wide counts for dashboards.
 *
 * Deliberately aggregate-only: no names, no MRNs, no diagnoses. That lets
 * roles barred from the patient index — Super Admin and System Auditor under
 * the DPC rule — still see operational totals without any identifiable data
 * crossing the boundary.
 */
export const GET = withAuth('GET', async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    patients,
    patientsToday,
    queueWaiting,
    queueInConsultation,
    bedsTotal,
    bedsOccupied,
    encountersToday,
    labsPending,
    radiologyPending,
    unpaidInvoices,
    claimTotals,
    lowStockBatches,
    facilities,
    activeStaff
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.queueItem.count({ where: { status: QueueStatus.WAITING } }),
    prisma.queueItem.count({ where: { status: QueueStatus.IN_CONSULTATION } }),
    prisma.inpatientBed.count(),
    prisma.inpatientBed.count({ where: { status: BedStatus.OCCUPIED } }),
    prisma.eMREncounter.count({ where: { timestamp: { gte: startOfToday } } }),
    prisma.labOrder.count({ where: { status: { notIn: ['Verified', 'Completed'] } } }),
    prisma.radiologyOrder.count({ where: { status: { notIn: ['Report Verified'] } } }),
    prisma.billingInvoice.aggregate({
      where: { status: { not: 'Paid' } },
      _count: true,
      _sum: { balanceGhc: true }
    }),
    prisma.nHISClaimLine.aggregate({
      where: { status: { not: 'Paid' } },
      _count: true,
      _sum: { totalClaimGhc: true }
    }),
    // Prisma cannot compare two columns in a `where`, so the reorder check is
    // done in memory over the (small) batch list.
    prisma.pharmacyBatch.findMany({ select: { quantityInStock: true, reorderLevel: true, expiryDate: true } }),
    prisma.facilityBranch.count(),
    prisma.userStaff.count({ where: { status: 'Active' } })
  ]);

  const now = Date.now();
  const lowStockCount = lowStockBatches.filter((b) => b.quantityInStock <= b.reorderLevel).length;
  const expiringBatchCount = lowStockBatches.filter((b) => {
    const expiry = new Date(b.expiryDate).getTime();
    return !Number.isNaN(expiry) && expiry - now < 90 * 86_400_000;
  }).length;

  return NextResponse.json({
    success: true,
    data: {
      patients,
      patientsToday,
      queueWaiting,
      queueInConsultation,
      bedsTotal,
      bedsOccupied,
      bedOccupancyRate: bedsTotal ? Math.round((bedsOccupied / bedsTotal) * 100) : 0,
      encountersToday,
      labsPending,
      radiologyPending,
      unpaidInvoiceCount: unpaidInvoices._count,
      outstandingBalanceGhc: unpaidInvoices._sum.balanceGhc ?? 0,
      pendingClaimCount: claimTotals._count,
      pendingClaimGhc: claimTotals._sum.totalClaimGhc ?? 0,
      lowStockCount,
      expiringBatchCount,
      facilities,
      activeStaff
    }
  });
});
