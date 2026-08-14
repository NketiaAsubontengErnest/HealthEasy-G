import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  toBed,
  toBedStatus,
  toEsiSeverity,
  toInventoryItem,
  toInvoice,
  toPatientCategory,
  toPharmacyBatch,
  toQueueItem,
  toQueueStatus,
  toStaff
} from '../src/lib/adapters';

/**
 * These conversions are what stopped the UI rendering blank cells once real
 * database rows replaced the mock arrays: Prisma stores `IN_CONSULTATION`,
 * `bedType` and `totalClaimGhc`, while every page renders `In Consultation`,
 * `type` and `totalClaimAmountGhc`.
 */
describe('Prisma ↔ client adapters', () => {
  describe('enum translation', () => {
    it('accepts either representation when writing', () => {
      assert.equal(toQueueStatus('In Consultation'), 'IN_CONSULTATION');
      assert.equal(toQueueStatus('IN_CONSULTATION'), 'IN_CONSULTATION');
      assert.equal(toBedStatus('Occupied'), 'OCCUPIED');
      assert.equal(toPatientCategory('Private Insurance'), 'PRIVATE_INSURANCE');
    });

    it('falls back to a safe default for unknown input', () => {
      assert.equal(toQueueStatus('nonsense'), 'WAITING');
      assert.equal(toBedStatus(undefined), 'AVAILABLE');
      assert.equal(toPatientCategory(null), 'CASH');
    });

    it('maps triage severity from the label the nurse selected', () => {
      // Previously the route hard-coded ESI_3_URGENT and threw the real
      // selection away, so a resuscitation case was filed as routine.
      assert.equal(toEsiSeverity('ESI-1 Resuscitation'), 'ESI_1_RESUSCITATION');
      assert.equal(toEsiSeverity('ESI-5 Non-Urgent'), 'ESI_5_NON_URGENT');
      assert.equal(toEsiSeverity('unspecified'), 'ESI_3_URGENT');
    });
  });

  describe('field renaming', () => {
    it('presents a bed with the names the ward screen expects', () => {
      const bed = toBed({
        id: 'bed-1',
        wardName: 'Male Surgical Ward',
        bedNumber: 'Bed MS-01',
        bedType: 'General',
        status: 'OCCUPIED',
        currentPatientId: 'pat-3',
        patientName: 'Yaw Addo-Danquah',
        mrn: 'HG-2026-0003',
        dailyRateGhc: 120
      });

      assert.equal(bed.type, 'General');
      assert.equal(bed.status, 'Occupied');
      assert.equal(bed.currentPatientName, 'Yaw Addo-Danquah');
      assert.equal(bed.currentMrn, 'HG-2026-0003');
    });

    it('presents a pharmacy batch with generic and brand names split out', () => {
      const batch = toPharmacyBatch({
        id: 'b1',
        drugCode: 'AML-10',
        drugName: 'Amlodipine',
        brandName: 'Norvasc',
        dosageForm: 'Tablet',
        strength: '10mg',
        batchNumber: 'BN-AML-2025-09',
        expiryDate: '2027-08-31',
        quantityInStock: 420,
        reorderLevel: 100,
        sellingPriceGhc: 1.5,
        supplier: 'Tobbinco',
        controlledSubstance: false
      });

      assert.equal(batch.genericName, 'Amlodipine');
      assert.equal(batch.brandName, 'Norvasc');
      assert.equal(batch.unitPriceGhc, 1.5);
      assert.equal(batch.isControlled, false);
    });

    it('falls back to the generic name when no brand is recorded', () => {
      const batch = toPharmacyBatch({ drugName: 'Paracetamol', brandName: '', quantityInStock: 0 });
      assert.equal(batch.brandName, 'Paracetamol');
    });
  });

  describe('derived values', () => {
    it('computes the patient-payable balance on an invoice', () => {
      const invoice = toInvoice({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-00001',
        patientCategory: 'NHIS',
        totalAmountGhc: 125,
        nhisExemptionGhc: 125,
        paidAmountGhc: 0,
        balanceGhc: 0,
        status: 'Unpaid',
        lineItems: [],
        createdAt: new Date('2026-08-01T09:00:00Z')
      });

      assert.equal(invoice.totalNhisCoveredGhc, 125);
      assert.equal(invoice.totalPatientPayableGhc, 0);
      assert.equal(invoice.invoiceNo, 'INV-2026-00001');
    });

    it('derives stock status from quantity and expiry rather than storing it', () => {
      const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];
      const past = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
      const far = new Date(Date.now() + 800 * 86_400_000).toISOString().split('T')[0];

      assert.equal(toInventoryItem({ quantity: 100, reorderPoint: 20, expiryDate: past }).status, 'Expired');
      assert.equal(toInventoryItem({ quantity: 100, reorderPoint: 20, expiryDate: soon }).status, 'Near Expiry');
      assert.equal(toInventoryItem({ quantity: 4, reorderPoint: 20, expiryDate: far }).status, 'Low Stock');
      assert.equal(toInventoryItem({ quantity: 100, reorderPoint: 20, expiryDate: far }).status, 'In Stock');
    });

    it('derives waiting minutes from how long the ticket has existed', () => {
      const item = toQueueItem({
        id: 'q1',
        status: 'WAITING',
        priority: 'NORMAL',
        patientCategory: 'NHIS',
        createdAt: new Date(Date.now() - 25 * 60_000)
      });

      // The stored counter was never incremented by anything, so every queue
      // permanently displayed "0 min waiting".
      assert.ok(item.waitingMinutes >= 24 && item.waitingMinutes <= 26, `got ${item.waitingMinutes}`);
      assert.equal(item.status, 'Waiting');
      assert.equal(item.priority, 'Normal');
    });

    it('flags a licence expiring inside 90 days', () => {
      const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];
      const past = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
      const far = new Date(Date.now() + 400 * 86_400_000).toISOString().split('T')[0];

      assert.equal(toStaff({ status: 'Active', licenseExpiry: soon }).status, 'Expiring Soon');
      assert.equal(toStaff({ status: 'Active', licenseExpiry: past }).status, 'Expired');
      assert.equal(toStaff({ status: 'Active', licenseExpiry: far }).status, 'Active');
    });

    it('translates the licensing body to its display name', () => {
      assert.equal(toStaff({ licensingBody: 'PHARMACY_COUNCIL' }).licensingBody, 'Pharmacy Council');
      assert.equal(toStaff({ licensingBody: 'MDC' }).licensingBody, 'MDC');
    });
  });
});
