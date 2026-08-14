import { Permission, UserRole } from '@/lib/types/rbac';

/**
 * Server-side access policy for every HMS API endpoint.
 *
 * The RBAC catalogue in `src/lib/types/rbac.ts` describes what each role may
 * do; until now nothing enforced it outside the browser. This table is the
 * enforcement point — `withAuth()` consults it before any handler runs.
 *
 * Reads are expressed as explicit role lists so the data-protection boundary
 * is auditable at a glance. Writes are expressed as permissions so they stay
 * tied to the published role catalogue.
 */

const EXECUTIVE: UserRole[] = ['Super Admin', 'Hospital Director', 'Hospital Admin', 'System Auditor'];
const CLINICAL: UserRole[] = ['Doctor', 'Nurse', 'Ward Manager', 'Theatre Nurse'];
const DIAGNOSTICS: UserRole[] = ['Laboratory Technician', 'Radiographer', 'Radiologist'];
const FRONT_DESK: UserRole[] = ['OPD / Medical Records'];
const FINANCE: UserRole[] = ['Cashier', 'Finance Officer', 'Claims Officer'];
const PHARMACY: UserRole[] = ['Pharmacist'];
const STORES: UserRole[] = ['Procurement Officer', 'Store Keeper'];
const HR: UserRole[] = ['HR Officer'];

const ALL_ROLES: UserRole[] = [
  ...EXECUTIVE,
  ...CLINICAL,
  ...DIAGNOSTICS,
  ...FRONT_DESK,
  ...FINANCE,
  ...PHARMACY,
  ...STORES,
  ...HR
];

/**
 * Roles permitted to read identifiable patient data.
 *
 * Super Admin is deliberately absent: the Data Protection Commission
 * constraint published in ROLE_DEFINITIONS states that the system
 * administrator may not access the patient index or clinical records. So are
 * System Auditor, HR, Procurement and Stores, none of whom have a clinical
 * reason to read patient identities.
 */
const PATIENT_DATA_READERS: UserRole[] = [
  'Hospital Director',
  'Hospital Admin',
  ...FRONT_DESK,
  ...CLINICAL,
  ...DIAGNOSTICS,
  ...PHARMACY,
  ...FINANCE
];

/** Clinical records are narrower still — no front desk, no cashier. */
const CLINICAL_RECORD_READERS: UserRole[] = [
  'Hospital Director',
  ...CLINICAL,
  ...PHARMACY,
  'Claims Officer'
];

export type AccessRule =
  /** Any authenticated staff member. */
  | { kind: 'authenticated' }
  /** One of the listed roles. */
  | { kind: 'roles'; roles: UserRole[] }
  /** Holder of at least one of the listed permissions. */
  | { kind: 'permission'; anyOf: Permission[] };

export type MethodPolicy = Partial<Record<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', AccessRule>>;

const roles = (list: UserRole[]): AccessRule => ({ kind: 'roles', roles: list });
const permission = (...anyOf: Permission[]): AccessRule => ({ kind: 'permission', anyOf });
const authenticated: AccessRule = { kind: 'authenticated' };

export const API_POLICY: Record<string, MethodPolicy> = {
  '/api/stats': {
    // Aggregate counts only — carries no patient identifiers, so every
    // authenticated role may read it for dashboards.
    GET: authenticated
  },
  '/api/staff': {
    // Names, roles and licence expiry — no credentials are ever selected.
    GET: authenticated
  },
  '/api/patients': {
    GET: roles(PATIENT_DATA_READERS),
    POST: permission('REGISTER_PATIENT')
  },
  '/api/queues': {
    GET: roles(PATIENT_DATA_READERS),
    POST: permission('QUEUE_MANAGEMENT', 'REGISTER_PATIENT'),
    PATCH: permission('QUEUE_MANAGEMENT', 'RECORD_TRIAGE_VITALS', 'CLINICAL_CONSULTATION')
  },
  '/api/vitals': {
    GET: roles(CLINICAL_RECORD_READERS),
    POST: permission('RECORD_TRIAGE_VITALS')
  },
  '/api/encounters': {
    GET: roles(CLINICAL_RECORD_READERS),
    POST: permission('CLINICAL_CONSULTATION')
  },
  '/api/beds': {
    GET: roles([...EXECUTIVE, ...CLINICAL, ...FRONT_DESK]),
    PATCH: permission('MANAGE_BEDS', 'BED_ASSIGNMENT', 'TRANSFER_PATIENT')
  },
  '/api/lab-orders': {
    GET: roles([...CLINICAL_RECORD_READERS, ...DIAGNOSTICS]),
    POST: permission('ORDER_LAB'),
    PATCH: permission('PERFORM_LAB_TESTS', 'SUBMIT_LAB_RESULTS', 'VERIFY_LAB_RESULTS')
  },
  '/api/lab-catalogue': {
    GET: authenticated,
    POST: permission('CONFIGURE_SYSTEM', 'MANAGE_FACILITY_CONFIG')
  },
  '/api/radiology': {
    GET: roles([...CLINICAL_RECORD_READERS, ...DIAGNOSTICS]),
    POST: permission('ORDER_RADIOLOGY', 'PERFORM_IMAGING', 'UPLOAD_IMAGING_STUDIES', 'WRITE_RADIOLOGY_REPORT')
  },
  '/api/pharmacy': {
    // Drug formulary and stock levels — no patient data.
    GET: roles([...EXECUTIVE, ...CLINICAL, ...PHARMACY, ...STORES]),
    PATCH: permission('MANAGE_PHARMACY_STOCK', 'MANAGE_INVENTORY')
  },
  '/api/pharmacy/dispense': {
    GET: roles([...PHARMACY, 'Hospital Director', 'Hospital Admin', 'System Auditor']),
    POST: permission('DISPENSE_MEDICINE')
  },
  '/api/billing': {
    GET: roles([...FINANCE, 'Hospital Director', 'Hospital Admin', ...FRONT_DESK]),
    POST: permission('COLLECT_PAYMENTS', 'CLINICAL_CONSULTATION', 'REGISTER_PATIENT'),
    PATCH: permission('COLLECT_PAYMENTS', 'ISSUE_RECEIPTS', 'PROCESS_REFUNDS')
  },
  '/api/nhis-claims': {
    GET: roles([...FINANCE, 'Hospital Director', 'Hospital Admin']),
    POST: permission('PREPARE_CLAIMS', 'VERIFY_NHIS', 'CLINICAL_CONSULTATION')
  },
  '/api/inventory': {
    GET: roles([...EXECUTIVE, ...STORES, ...PHARMACY]),
    POST: permission('MANAGE_INVENTORY', 'RECEIVE_STOCK', 'CREATE_PURCHASE_ORDERS')
  },
  '/api/facilities': {
    GET: authenticated,
    POST: permission('MANAGE_HOSPITALS'),
    PATCH: permission('MANAGE_HOSPITALS', 'MANAGE_FACILITY_CONFIG')
  },
  '/api/audit-logs': {
    GET: permission('VIEW_AUDIT_LOGS', 'MANAGE_STAFF', 'VIEW_EXECUTIVE_DASHBOARD'),
    // Any authenticated action may append to the immutable trail; the server
    // stamps the acting identity from the session, never from the request body.
    POST: authenticated
  },
  '/api/ai-assistant': {
    POST: permission('ORDER_PRESCRIPTION', 'CLINICAL_CONSULTATION', 'VERIFY_PRESCRIPTION', 'DISPENSE_MEDICINE')
  }
};

export { ALL_ROLES };
