export type PatientCategory = 'Cash' | 'NHIS' | 'Corporate' | 'Private Insurance' | 'Exempted';

export type EmergencySeverity = 'ESI-1 Resuscitation' | 'ESI-2 Emergency' | 'ESI-3 Urgent' | 'ESI-4 Less Urgent' | 'ESI-5 Non-Urgent';

export type BedStatusType = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance' | 'Isolation';

export type PaymentMethod = 'Cash' | 'MTN MoMo' | 'Telecel Cash' | 'Bank Card' | 'NHIS Claim' | 'Private Insurance' | 'Corporate Account';

export type OrderStatus = 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled';

export interface FacilityBranch {
  id: string;
  name: string;
  code: string;
  hefraLicenseNo: string;
  hefraExpiryDate: string;
  hefraStatus: 'Active' | 'Pending Renewal' | 'Expired';
  location: string;
  gpsAddress: string;
  phone: string;
  email: string;
  region: 'Greater Accra' | 'Ashanti' | 'Western' | 'Central' | 'Eastern' | 'Volta' | 'Northern' | 'Upper East' | 'Upper West' | 'Bono' | 'Bono East' | 'Ahafo' | 'Oti' | 'Savannah' | 'North East' | 'Western North';
  facilityType: 'Teaching/Tertiary' | 'Regional' | 'District' | 'Polyclinic' | 'Private Specialist' | 'CHPS Compound';
  status: 'Active' | 'Suspended' | 'Onboarding';
  adminName: string;
  adminEmail: string;
  bedCapacity: number;
  createdDate: string;
}

import { UserRole } from './rbac';

export interface StaffCredential {
  id: string;
  name: string;
  role: UserRole;
  staffId: string;
  email?: string;
  licenseNumber: string;
  licensingBody: 'MDC' | 'NMC' | 'Pharmacy Council' | 'AHPC' | 'Other';
  licenseExpiry: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  department: string;
}

export interface PatientRecord {
  id: string;
  mrn: string; // Medical Record Number
  facilityId?: string; // Hospital branch that registered the patient
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  ghanaCardNo: string;
  nhisNumber?: string;
  nhisStatus?: 'Active' | 'Expired' | 'Pending Verification';
  nhisExpiry?: string;
  patientCategory: PatientCategory;
  gpsAddress: string;
  residentialAddress: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  bloodGroup: string;
  registrationDate: string;
  photoUrl?: string;
  consentSigned: boolean;
  mergedWithMrn?: string;
}

export interface QueueItem {
  id: string;
  patientId: string;
  mrn: string;
  patientName: string;
  patientCategory: PatientCategory;
  department: 'Triage' | 'OPD Consultation' | 'Emergency' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Billing';
  servicePoint: string;
  queueNumber: string;
  arrivalTime: string;
  waitingMinutes: number;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Transferred';
  currentLocation: string;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  encounterId: string;
  timestamp: string;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  temperature: number; // Celsius
  respiratoryRate: number;
  oxygenSaturation: number; // SpO2 %
  weightKg: number;
  heightCm: number;
  bmi: number;
  bloodGlucoseMmoles: number;
  painScore: number; // 0-10
  pregnancyStatus?: string;
  esiSeverity: EmergencySeverity;
  nursingNotes: string;
  abnormalAlerts: string[];
  recordedBy: string;
}

export interface ClinicalOrder {
  id: string;
  encounterId: string;
  patientId: string;
  type: 'Laboratory' | 'Radiology' | 'Prescription' | 'Admission' | 'Procedure';
  code: string;
  description: string;
  costGhc: number;
  nhisCovered: boolean;
  status: OrderStatus;
  orderedBy: string;
  orderTimestamp: string;
}

export interface EMREncounter {
  id: string;
  patientId: string;
  mrn: string;
  patientName: string;
  encounterType: 'OPD' | 'Emergency' | 'Inpatient' | 'Antenatal';
  clinicianName: string;
  timestamp: string;
  presentingComplaints: string;
  historyOfPresentingComplaint: string;
  pastMedicalHistory: string;
  physicalExamination: string;
  icdDiagnoses: { code: string; name: string; category: string }[];
  clinicalNotes: string;
  treatmentPlan: string;
  sickLeaveDays?: number;
  orders: ClinicalOrder[];
  dischargeDecision?: 'Discharged' | 'Admitted' | 'Referred' | 'Under Observation';
  signed: boolean;
}

export interface InpatientBed {
  id: string;
  wardName: string;
  bedNumber: string;
  type: 'General' | 'ICU' | 'Pediatric' | 'Maternity' | 'Isolation';
  status: BedStatusType;
  currentPatientId?: string;
  currentPatientName?: string;
  currentMrn?: string;
  admissionDate?: string;
  assignedNurse?: string;
  dailyRateGhc: number;
}

export interface MedicationAdministrationRecord {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  drugName: string;
  dosage: string;
  route: string;
  dueTime: string;
  administeredTime?: string;
  status: 'Scheduled' | 'Administered' | 'Omitted' | 'Refused';
  administeredBy?: string;
  omissionReason?: string;
}

export interface LabResultItem {
  parameter: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  isCritical: boolean;
}

export interface LabOrderRecord {
  id: string;
  orderId: string;
  patientId: string;
  mrn: string;
  patientName: string;
  testName: string;
  testCategory: string;
  specimenType: string;
  specimenBarcode: string;
  collectedAt?: string;
  receivedAt?: string;
  status: 'Ordered' | 'Specimen Collected' | 'In Analysis' | 'Verified' | 'Completed';
  results: LabResultItem[];
  technicianName?: string;
  verifiedBy?: string;
  verificationTimestamp?: string;
  criticalAlertAcknowledged?: boolean;
}

export interface RadiologyOrderRecord {
  id: string;
  orderId: string;
  patientId: string;
  mrn: string;
  patientName: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI';
  bodyPart: string;
  clinicalIndication: string;
  pregnancyScreened: boolean;
  status: 'Ordered' | 'Scheduled' | 'Completed' | 'Report Verified';
  radiographerNotes?: string;
  radiologistReport?: string;
  verifiedBy?: string;
  verificationTimestamp?: string;
}

export interface PharmacyBatchItem {
  id: string;
  drugCode: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantityInStock: number;
  reorderLevel: number;
  unitPriceGhc: number;
  supplier: string;
  isControlled: boolean;
}

export interface PrescriptionDispenseRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  mrn: string;
  patientName: string;
  drugName: string;
  dosageInstructions: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  batchNumber: string;
  dispensedBy: string;
  dispenseTimestamp: string;
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed';
  counselingNotes?: string;
}

export interface BillingInvoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  mrn: string;
  patientName: string;
  patientCategory: PatientCategory;
  lineItems: {
    description: string;
    category: 'Consultation' | 'Lab' | 'Radiology' | 'Pharmacy' | 'Bed Charge' | 'Procedure';
    amountGhc: number;
    nhisCoveredGhc: number;
    patientPayableGhc: number;
  }[];
  totalAmountGhc: number;
  totalNhisCoveredGhc: number;
  totalPatientPayableGhc: number;
  amountPaidGhc: number;
  balanceDueGhc: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Waived';
  paymentMethod?: PaymentMethod;
  cashierShiftId?: string;
  timestamp: string;
}

export interface NHISClaimLine {
  id: string;
  claimId: string;
  patientId: string;
  mrn: string;
  nhisNumber: string;
  attendanceDate: string;
  verificationRef: string;
  diagnosisCode: string;
  diagnosisName: string;
  tariffServiceCode: string;
  tariffServiceAmountGhc: number;
  tariffMedicineCode: string;
  tariffMedicineAmountGhc: number;
  totalClaimAmountGhc: number;
  status: 'Draft' | 'Validated' | 'Batched' | 'Submitted' | 'Paid' | 'Query/Rejected';
  rejectionReason?: string;
}

export interface NHISClaimBatch {
  id: string;
  batchNo: string;
  monthYear: string; // e.g. "2026-07"
  facilityCode: string;
  claimCount: number;
  totalAmountGhc: number;
  status: 'Prepared' | 'Exported CLAIM-it' | 'Submitted to NHIA' | 'Reconciled';
  createdDate: string;
}

export interface InventoryStoreItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: 'Pharmaceutical' | 'Lab Reagent' | 'Medical Consumable' | 'General Supply';
  storeLocation: 'Central Store' | 'OPD Pharmacy' | 'Lab Store' | 'Ward Stock';
  batchNo: string;
  expiryDate: string;
  quantityOnHand: number;
  reorderPoint: number;
  unitCostGhc: number;
  status: 'In Stock' | 'Low Stock' | 'Near Expiry' | 'Expired';
}

export interface DHIMSReportSummary {
  monthYear: string;
  totalOpdAttendance: number;
  opdUnder5Male: number;
  opdUnder5Female: number;
  opdAbove5Male: number;
  opdAbove5Female: number;
  topDiagnoses: { disease: string; cases: number }[];
  totalAdmissions: number;
  totalDischarges: number;
  totalDeaths: number;
  maternalDeliveries: number;
  nhisClaimsSubmittedGhc: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  role: string;
  action: string;
  patientId?: string;
  mrn?: string;
  details: string;
  ipAddress: string;
}
