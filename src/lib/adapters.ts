/**
 * The single translation point between Prisma rows and the client-facing HMS
 * types in `src/lib/types/hms.ts`.
 *
 * The two models genuinely differ: Prisma uses SCREAMING_SNAKE enums and
 * storage-oriented column names (`bedType`, `barcodeNo`, `totalClaimGhc`),
 * while every page renders title-case labels and domain names (`type`,
 * `specimenBarcode`, `totalClaimAmountGhc`). Previously nothing bridged them,
 * so any component fed real database rows silently rendered empty cells and
 * mis-counted totals — masked only by the mock data the context started with.
 *
 * API routes call these on the way out, so the browser only ever sees the
 * client shape.
 */

import {
  BedStatus,
  LicenseStatus,
  PatientCategory as PrismaPatientCategory,
  PriorityLevel,
  QueueStatus,
  EmergencySeverity as PrismaEmergencySeverity
} from '@prisma/client';

import type {
  AuditLogEntry,
  BillingInvoice,
  EMREncounter,
  EmergencySeverity,
  FacilityBranch,
  InpatientBed,
  InventoryStoreItem,
  LabOrderRecord,
  NHISClaimLine,
  PatientCategory,
  PatientRecord,
  PharmacyBatchItem,
  PrescriptionDispenseRecord,
  QueueItem,
  RadiologyOrderRecord,
  StaffCredential,
  VitalSigns
} from '@/lib/types/hms';

/* ------------------------------------------------------------------ *
 * Enum conversion
 * ------------------------------------------------------------------ */

/** Accepts either representation so callers can pass through user input. */
function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

const PATIENT_CATEGORY_TO_CLIENT: Record<PrismaPatientCategory, PatientCategory> = {
  CASH: 'Cash',
  NHIS: 'NHIS',
  CORPORATE: 'Corporate',
  PRIVATE_INSURANCE: 'Private Insurance',
  EXEMPTED: 'Exempted'
};

export function toPatientCategory(value: unknown): PrismaPatientCategory {
  const key = normalizeKey(value);
  return key in PrismaPatientCategory ? (key as PrismaPatientCategory) : PrismaPatientCategory.CASH;
}

const QUEUE_STATUS_TO_CLIENT: Record<QueueStatus, QueueItem['status']> = {
  WAITING: 'Waiting',
  IN_CONSULTATION: 'In Consultation',
  COMPLETED: 'Completed',
  TRANSFERRED: 'Transferred'
};

export function toQueueStatus(value: unknown): QueueStatus {
  const key = normalizeKey(value);
  return key in QueueStatus ? (key as QueueStatus) : QueueStatus.WAITING;
}

const PRIORITY_TO_CLIENT: Record<PriorityLevel, QueueItem['priority']> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency'
};

export function toPriorityLevel(value: unknown): PriorityLevel {
  const key = normalizeKey(value);
  return key in PriorityLevel ? (key as PriorityLevel) : PriorityLevel.NORMAL;
}

const BED_STATUS_TO_CLIENT: Record<BedStatus, InpatientBed['status']> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  ISOLATION: 'Isolation'
};

export function toBedStatus(value: unknown): BedStatus {
  const key = normalizeKey(value);
  return key in BedStatus ? (key as BedStatus) : BedStatus.AVAILABLE;
}

const LICENSE_STATUS_TO_CLIENT: Record<LicenseStatus, FacilityBranch['hefraStatus']> = {
  ACTIVE: 'Active',
  PENDING_RENEWAL: 'Pending Renewal',
  EXPIRED: 'Expired'
};

export function toLicenseStatus(value: unknown): LicenseStatus {
  const key = normalizeKey(value);
  return key in LicenseStatus ? (key as LicenseStatus) : LicenseStatus.ACTIVE;
}

const ESI_TO_CLIENT: Record<PrismaEmergencySeverity, EmergencySeverity> = {
  ESI_1_RESUSCITATION: 'ESI-1 Resuscitation',
  ESI_2_EMERGENCY: 'ESI-2 Emergency',
  ESI_3_URGENT: 'ESI-3 Urgent',
  ESI_4_LESS_URGENT: 'ESI-4 Less Urgent',
  ESI_5_NON_URGENT: 'ESI-5 Non-Urgent'
};

export function toEsiSeverity(value: unknown): PrismaEmergencySeverity {
  const raw = String(value ?? '');
  const match = raw.match(/[1-5]/);
  switch (match?.[0]) {
    case '1':
      return PrismaEmergencySeverity.ESI_1_RESUSCITATION;
    case '2':
      return PrismaEmergencySeverity.ESI_2_EMERGENCY;
    case '4':
      return PrismaEmergencySeverity.ESI_4_LESS_URGENT;
    case '5':
      return PrismaEmergencySeverity.ESI_5_NON_URGENT;
    default:
      return PrismaEmergencySeverity.ESI_3_URGENT;
  }
}

const LICENSING_BODY_TO_CLIENT: Record<string, StaffCredential['licensingBody']> = {
  MDC: 'MDC',
  NMC: 'NMC',
  PHARMACY_COUNCIL: 'Pharmacy Council',
  AHPC: 'AHPC',
  OTHER: 'Other'
};

/* ------------------------------------------------------------------ *
 * Row → client record
 * ------------------------------------------------------------------ */

type Row = Record<string, any>;

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? '');

export function toFacility(row: Row): FacilityBranch {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    hefraLicenseNo: row.hefraLicenseNo,
    hefraExpiryDate: row.hefraExpiryDate,
    hefraStatus: LICENSE_STATUS_TO_CLIENT[row.hefraStatus as LicenseStatus] ?? 'Active',
    location: row.location,
    gpsAddress: row.gpsAddress,
    phone: row.phone,
    email: row.email,
    region: row.region,
    facilityType: row.facilityType,
    status: row.status,
    adminName: row.adminName,
    adminEmail: row.adminEmail,
    bedCapacity: row.bedCapacity,
    createdDate: iso(row.createdAt).split('T')[0]
  };
}

/** License expiry drives the staff badge shown on the dashboard. */
function licenseStatus(expiry: string | null | undefined): StaffCredential['status'] {
  if (!expiry) return 'Active';
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return 'Active';

  const daysRemaining = (expiryDate.getTime() - Date.now()) / 86_400_000;
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining < 90) return 'Expiring Soon';
  return 'Active';
}

export function toStaff(row: Row): StaffCredential {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    staffId: row.staffId,
    email: row.email,
    licenseNumber: row.licenseNumber ?? 'N/A',
    licensingBody: LICENSING_BODY_TO_CLIENT[row.licensingBody] ?? 'Other',
    licenseExpiry: row.licenseExpiry ?? '',
    // Suspended accounts keep their stored status; otherwise derive from the
    // licence expiry so the compliance widget reflects reality.
    status: row.status && row.status !== 'Active' ? row.status : licenseStatus(row.licenseExpiry),
    department: row.department
  };
}

export function toPatient(row: Row): PatientRecord {
  return {
    id: row.id,
    mrn: row.mrn,
    facilityId: row.facilityId,
    fullName: row.fullName,
    dob: row.dob,
    gender: row.gender,
    phone: row.phone,
    ghanaCardNo: row.ghanaCardNo,
    nhisNumber: row.nhisNumber ?? undefined,
    nhisStatus: row.nhisStatus ?? undefined,
    nhisExpiry: row.nhisExpiry ?? undefined,
    patientCategory: PATIENT_CATEGORY_TO_CLIENT[row.patientCategory as PrismaPatientCategory] ?? 'Cash',
    gpsAddress: row.gpsAddress,
    residentialAddress: row.residentialAddress,
    emergencyContact: row.emergencyContact ?? { name: '', relationship: '', phone: '' },
    allergies: row.allergies ?? [],
    chronicConditions: row.chronicConditions ?? [],
    bloodGroup: row.bloodGroup,
    registrationDate: row.registrationDate,
    photoUrl: row.photoUrl ?? undefined,
    consentSigned: row.consentSigned,
    mergedWithMrn: row.mergedWithMrn ?? undefined
  };
}

export function toQueueItem(row: Row): QueueItem {
  const arrival = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  const waitingMinutes = Number.isNaN(arrival.getTime())
    ? (row.waitingMinutes ?? 0)
    : Math.max(0, Math.round((Date.now() - arrival.getTime()) / 60_000));

  return {
    id: row.id,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    patientCategory: PATIENT_CATEGORY_TO_CLIENT[row.patientCategory as PrismaPatientCategory] ?? 'Cash',
    department: row.department,
    servicePoint: row.servicePoint,
    queueNumber: row.queueNumber,
    arrivalTime: row.arrivalTime,
    // Waiting time is derived from the row's age rather than a stored counter
    // that nothing ever incremented.
    waitingMinutes:
      row.status === QueueStatus.WAITING ? waitingMinutes : (row.waitingMinutes ?? waitingMinutes),
    priority: PRIORITY_TO_CLIENT[row.priority as PriorityLevel] ?? 'Normal',
    status: QUEUE_STATUS_TO_CLIENT[row.status as QueueStatus] ?? 'Waiting',
    currentLocation: row.currentLocation
  };
}

export function toVitalSigns(row: Row): VitalSigns {
  return {
    id: row.id,
    patientId: row.patientId,
    encounterId: row.encounterId ?? '',
    timestamp: iso(row.timestamp),
    systolicBp: row.systolicBp,
    diastolicBp: row.diastolicBp,
    pulseRate: row.pulseRate,
    temperature: row.temperature,
    respiratoryRate: row.respiratoryRate,
    oxygenSaturation: row.oxygenSaturation,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    bmi: row.bmi,
    bloodGlucoseMmoles: row.bloodGlucoseMmoles,
    painScore: row.painScore,
    pregnancyStatus: row.pregnancyStatus ?? undefined,
    esiSeverity: ESI_TO_CLIENT[row.esiSeverity as PrismaEmergencySeverity] ?? 'ESI-3 Urgent',
    nursingNotes: row.nursingNotes,
    abnormalAlerts: row.abnormalAlerts ?? [],
    recordedBy: row.recordedByName
  };
}

export function toEncounter(row: Row): EMREncounter {
  return {
    id: row.id,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    encounterType: row.encounterType ?? 'OPD',
    clinicianName: row.clinicianName,
    timestamp: iso(row.timestamp),
    presentingComplaints: row.chiefComplaint,
    historyOfPresentingComplaint: row.historyOfIllness,
    pastMedicalHistory: row.pastMedicalHistory ?? '',
    physicalExamination: row.physicalExam,
    icdDiagnoses: row.icdDiagnoses ?? [],
    clinicalNotes: row.clinicalNotes ?? '',
    treatmentPlan: row.treatmentPlan,
    sickLeaveDays: row.sickLeaveDays,
    orders: row.orders ?? [],
    dischargeDecision: row.dischargeDecision ?? undefined,
    signed: row.signed ?? true
  };
}

export function toBed(row: Row): InpatientBed {
  return {
    id: row.id,
    wardName: row.wardName,
    bedNumber: row.bedNumber,
    type: row.bedType,
    status: BED_STATUS_TO_CLIENT[row.status as BedStatus] ?? 'Available',
    currentPatientId: row.currentPatientId ?? undefined,
    currentPatientName: row.patientName ?? undefined,
    currentMrn: row.mrn ?? undefined,
    admissionDate: row.admissionDate ?? undefined,
    assignedNurse: row.assignedNurse ?? undefined,
    dailyRateGhc: row.dailyRateGhc
  };
}

export function toLabOrder(row: Row): LabOrderRecord {
  return {
    id: row.id,
    orderId: row.encounterId ?? row.id,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    testName: row.testName,
    testCategory: row.testCategory ?? 'General Pathology',
    specimenType: row.specimenType,
    specimenBarcode: row.barcodeNo,
    collectedAt: row.collectedAt ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
    status: row.status,
    results: Array.isArray(row.results) ? row.results : [],
    technicianName: row.technicianName ?? undefined,
    verifiedBy: row.verifiedByName ?? undefined,
    verificationTimestamp: row.verificationTime ?? undefined,
    criticalAlertAcknowledged: row.status === 'Verified' || row.status === 'Completed'
  };
}

export function toRadiologyOrder(row: Row): RadiologyOrderRecord {
  return {
    id: row.id,
    orderId: row.pacsAccessionNo,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    modality: row.studyType,
    bodyPart: row.bodyPart,
    clinicalIndication: row.clinicalHistory,
    pregnancyScreened: row.pregnancyScreened ?? false,
    status: row.status,
    radiographerNotes: row.radiographerNotes ?? undefined,
    radiologistReport: row.reportContent ?? undefined,
    verifiedBy: row.radiologistName ?? undefined,
    verificationTimestamp: row.signedTimestamp ?? undefined
  };
}

export function toPharmacyBatch(row: Row): PharmacyBatchItem {
  return {
    id: row.id,
    drugCode: row.drugCode,
    genericName: row.drugName,
    brandName: row.brandName || row.drugName,
    dosageForm: row.dosageForm,
    strength: row.strength,
    batchNumber: row.batchNumber,
    expiryDate: row.expiryDate,
    quantityInStock: row.quantityInStock,
    reorderLevel: row.reorderLevel,
    unitPriceGhc: row.sellingPriceGhc,
    supplier: row.supplier,
    isControlled: row.controlledSubstance
  };
}

export function toDispenseRecord(row: Row): PrescriptionDispenseRecord {
  return {
    id: row.id,
    prescriptionId: row.prescriptionId,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    drugName: row.drugName,
    dosageInstructions: row.dosageInstructions,
    quantityPrescribed: row.quantityPrescribed,
    quantityDispensed: row.quantityDispensed,
    batchNumber: row.batchNumber,
    dispensedBy: row.dispensedByName,
    dispenseTimestamp: iso(row.dispenseTimestamp),
    status: row.status,
    counselingNotes: row.counselingNotes ?? undefined
  };
}

export function toInvoice(row: Row): BillingInvoice {
  const paid = row.paidAmountGhc ?? 0;
  const total = row.totalAmountGhc ?? 0;
  const covered = row.nhisExemptionGhc ?? 0;

  return {
    id: row.id,
    invoiceNo: row.invoiceNumber,
    patientId: row.patientId,
    mrn: row.mrn,
    patientName: row.patientName,
    patientCategory: PATIENT_CATEGORY_TO_CLIENT[row.patientCategory as PrismaPatientCategory] ?? 'Cash',
    lineItems: Array.isArray(row.lineItems) ? row.lineItems : [],
    totalAmountGhc: total,
    totalNhisCoveredGhc: covered,
    totalPatientPayableGhc: Math.max(0, total - covered),
    amountPaidGhc: paid,
    balanceDueGhc: row.balanceGhc ?? Math.max(0, total - covered - paid),
    paymentStatus: row.status,
    paymentMethod: row.paymentMethod ?? undefined,
    timestamp: iso(row.createdAt)
  };
}

export function toClaimLine(row: Row): NHISClaimLine {
  return {
    id: row.id,
    claimId: row.claimNumber,
    patientId: row.patientId,
    mrn: row.mrn,
    nhisNumber: row.nhisNumber,
    attendanceDate: row.attendanceDate,
    verificationRef: row.verificationRef ?? '',
    diagnosisCode: row.icdCode,
    diagnosisName: row.icdDescription,
    tariffServiceCode: row.gdrgCode,
    tariffServiceAmountGhc: row.gdrgTariffGhc,
    tariffMedicineCode: row.medicineCode ?? 'N/A',
    tariffMedicineAmountGhc: row.medicineTariffGhc,
    totalClaimAmountGhc: row.totalClaimGhc,
    status: row.status,
    rejectionReason: row.rejectionReason ?? undefined
  };
}

export function toInventoryItem(row: Row): InventoryStoreItem {
  const quantity = row.quantity ?? 0;
  const reorderPoint = row.reorderPoint ?? 0;

  const expiry = row.expiryDate ? new Date(row.expiryDate) : null;
  const daysToExpiry =
    expiry && !Number.isNaN(expiry.getTime()) ? (expiry.getTime() - Date.now()) / 86_400_000 : null;

  // Status is derived rather than stored, so it can never drift from the
  // quantity and expiry it describes.
  let status: InventoryStoreItem['status'] = 'In Stock';
  if (daysToExpiry !== null && daysToExpiry < 0) status = 'Expired';
  else if (daysToExpiry !== null && daysToExpiry < 90) status = 'Near Expiry';
  else if (quantity <= reorderPoint) status = 'Low Stock';

  return {
    id: row.id,
    itemCode: row.itemCode,
    itemName: row.itemName,
    category: row.category,
    storeLocation: row.storeLocation,
    batchNo: row.batchNo ?? 'N/A',
    expiryDate: row.expiryDate ?? '',
    quantityOnHand: quantity,
    reorderPoint,
    unitCostGhc: row.unitPriceGhc ?? 0,
    status
  };
}

export function toAuditLog(row: Row): AuditLogEntry {
  return {
    id: row.id,
    timestamp: iso(row.timestamp),
    userName: row.userName,
    role: row.role,
    action: row.action,
    patientId: row.patientId ?? undefined,
    mrn: row.mrn ?? undefined,
    details: row.details,
    ipAddress: row.ipAddress
  };
}
