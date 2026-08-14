export type UserRole =
  | 'Super Admin'
  | 'Hospital Director'
  | 'Hospital Admin'
  | 'HR Officer'
  | 'Finance Officer'
  | 'Claims Officer'
  | 'Procurement Officer'
  | 'Store Keeper'
  | 'OPD / Medical Records'
  | 'Cashier'
  | 'Nurse'
  | 'Ward Manager'
  | 'Doctor'
  | 'Laboratory Technician'
  | 'Radiographer'
  | 'Radiologist'
  | 'Pharmacist'
  | 'Theatre Nurse'
  | 'System Auditor';

export type Permission =
  // System & Facility Admin
  | 'MANAGE_HOSPITALS'
  | 'CONFIGURE_SYSTEM'
  | 'MANAGE_USERS'
  | 'MANAGE_ROLES'
  | 'VIEW_AUDIT_LOGS'
  | 'BACKUP_RESTORE'
  | 'EMERGENCY_OVERRIDE'
  | 'MANAGE_STAFF'
  | 'MANAGE_FACILITY_CONFIG'
  // Patient Admin & OPD
  | 'REGISTER_PATIENT'
  | 'UPDATE_PATIENT_DEMOGRAPHICS'
  | 'MANAGE_APPOINTMENTS'
  | 'QUEUE_MANAGEMENT'
  | 'MERGE_PATIENTS'
  | 'RETRIEVE_RECORDS'
  | 'SCAN_ARCHIVE_DOCUMENTS'
  // Nursing
  | 'RECORD_TRIAGE_VITALS'
  | 'NURSING_NOTES'
  | 'MEDICATION_ADMINISTRATION'
  | 'FLUID_CHARTS'
  | 'PATIENT_MONITORING'
  | 'CHECKLIST_DISCHARGE'
  // Doctor & Clinical Care
  | 'CLINICAL_CONSULTATION'
  | 'ICD10_DIAGNOSIS'
  | 'ORDER_LAB'
  | 'ORDER_RADIOLOGY'
  | 'ORDER_PRESCRIPTION'
  | 'DISCHARGE_SUMMARY'
  | 'SICK_LEAVE_CERTIFICATE'
  // Inpatient & Ward
  | 'MANAGE_BEDS'
  | 'BED_ASSIGNMENT'
  | 'TRANSFER_PATIENT'
  | 'INPATIENT_CARE'
  // LIS Laboratory
  | 'RECEIVE_LAB_SAMPLES'
  | 'PERFORM_LAB_TESTS'
  | 'VERIFY_LAB_RESULTS'
  | 'SUBMIT_LAB_RESULTS'
  // PACS Radiology
  | 'PERFORM_IMAGING'
  | 'UPLOAD_IMAGING_STUDIES'
  | 'WRITE_RADIOLOGY_REPORT'
  | 'SIGN_RADIOLOGY_REPORT'
  // Pharmacy
  | 'VIEW_PRESCRIPTIONS'
  | 'VERIFY_PRESCRIPTION'
  | 'DISPENSE_MEDICINE'
  | 'DRUG_SUBSTITUTION'
  | 'MANAGE_PHARMACY_STOCK'
  // Billing & Cashier
  | 'COLLECT_PAYMENTS'
  | 'ISSUE_RECEIPTS'
  | 'CLOSE_CASHIER_SHIFT'
  | 'PROCESS_REFUNDS'
  // Insurance & NHIS
  | 'VERIFY_NHIS'
  | 'PREPARE_CLAIMS'
  | 'SUBMIT_CLAIMS'
  | 'RECONCILE_CLAIMS'
  // Inventory & Stores
  | 'MANAGE_INVENTORY'
  | 'CREATE_PURCHASE_ORDERS'
  | 'RECEIVE_STOCK'
  | 'ISSUE_STOCK_TRANSFERS'
  | 'APPROVE_PURCHASES'
  // Reports & Analytics
  | 'VIEW_EXECUTIVE_DASHBOARD'
  | 'VIEW_REVENUE_REPORTS'
  | 'VIEW_DHIMS2_REPORTS'
  | 'MANAGE_HR_RECORDS'
  | 'MANAGE_SHIFT_SCHEDULES';

export interface RoleDefinition {
  name: UserRole;
  level: 1 | 2 | 3 | 4;
  parentRole: UserRole | null;
  subordinateRoles: UserRole[];
  reportsTo: string;
  category: 'Executive' | 'Administration' | 'Clinical' | 'Diagnostics' | 'Pharmacy' | 'Finance' | 'Operations';
  description: string;
  allowedRoutes: string[];
  permissions: Permission[];
  cannot: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  'Super Admin': {
    name: 'Super Admin',
    level: 1,
    parentRole: null,
    subordinateRoles: ['System Auditor', 'Hospital Director'],
    reportsTo: 'None (Root Administration)',
    category: 'Executive',
    description: 'Level 1: System-wide administrator. Manages multi-hospital setups, system configurations, master user accounts, global tariffs, security audit trails, and data backups.',
    allowedRoutes: [
      '/dashboard',
      '/hospitals-management',
      '/facility-config',
      '/inventory-procurement',
      '/dhims2-reports',
      '/security-audit'
    ],
    permissions: [
      'MANAGE_HOSPITALS',
      'CONFIGURE_SYSTEM',
      'MANAGE_USERS',
      'MANAGE_ROLES',
      'VIEW_AUDIT_LOGS',
      'BACKUP_RESTORE',
      'EMERGENCY_OVERRIDE',
      'MANAGE_FACILITY_CONFIG',
      'VIEW_REVENUE_REPORTS',
      'VIEW_EXECUTIVE_DASHBOARD',
      'VIEW_DHIMS2_REPORTS'
    ],
    cannot: [
      'Restricted by Data Protection Commission (DPC) privacy rules: Super Admin cannot access patient clinical records, medical histories, consultation notes, or individual patient index data.'
    ]
  },
  'System Auditor': {
    name: 'System Auditor',
    level: 2,
    parentRole: 'Super Admin',
    subordinateRoles: [],
    reportsTo: 'Super Admin',
    category: 'Administration',
    description: 'Level 2: Monitors system compliance, inspects immutable audit logs, tracks data privacy compliance, and generates security reports.',
    allowedRoutes: ['/dashboard', '/security-audit', '/dhims2-reports'],
    permissions: [
      'VIEW_AUDIT_LOGS'
    ],
    cannot: [
      'Cannot modify clinical or patient demographic data.',
      'Cannot process patient payments or financial transactions.'
    ]
  },
  'Hospital Director': {
    name: 'Hospital Director',
    level: 2,
    parentRole: 'Super Admin',
    subordinateRoles: [
      'Hospital Admin',
      'OPD / Medical Records',
      'Cashier',
      'Nurse',
      'Ward Manager',
      'Doctor',
      'Laboratory Technician',
      'Radiographer',
      'Radiologist',
      'Pharmacist',
      'Theatre Nurse'
    ],
    reportsTo: 'Super Admin',
    category: 'Executive',
    description: 'Level 2: Manages daily clinical and operational performance of a specific hospital branch. Full executive reporting and approval oversight.',
    allowedRoutes: [
      '/dashboard',
      '/patient-flow',
      '/emr-consultation',
      '/emergency',
      '/wards-beds',
      '/laboratory',
      '/radiology',
      '/pharmacy',
      '/billing-cashier',
      '/nhis-claims',
      '/inventory-procurement',
      '/hospitals-management',
      '/facility-config',
      '/dhims2-reports',
      '/security-audit'
    ],
    permissions: [
      'VIEW_EXECUTIVE_DASHBOARD',
      'VIEW_REVENUE_REPORTS',
      'VIEW_DHIMS2_REPORTS',
      'APPROVE_PURCHASES'
    ],
    cannot: [
      'Cannot edit clinical consultation notes.',
      'Cannot dispense medicines.',
      'Cannot perform operational routine tasks assigned to clinical/technical staff.'
    ]
  },
  'Hospital Admin': {
    name: 'Hospital Admin',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [
      'HR Officer',
      'Finance Officer',
      'Claims Officer',
      'Procurement Officer',
      'Store Keeper'
    ],
    reportsTo: 'Hospital Director',
    category: 'Administration',
    description: 'Level 3: Manages a hospital branch. Oversees administrative officers, staff scheduling, facility operations, and billing approvals.',
    allowedRoutes: [
      '/dashboard',
      '/patient-registration',
      '/patient-flow',
      '/facility-config',
      '/hospitals-management',
      '/billing-cashier',
      '/inventory-procurement',
      '/dhims2-reports',
      '/security-audit'
    ],
    permissions: [
      'MANAGE_STAFF',
      'MANAGE_FACILITY_CONFIG',
      'PROCESS_REFUNDS',
      'APPROVE_PURCHASES',
      'VIEW_REVENUE_REPORTS',
      'VIEW_EXECUTIVE_DASHBOARD',
      'VIEW_DHIMS2_REPORTS'
    ],
    cannot: [
      'Cannot diagnose patients.',
      'Cannot dispense medicines.',
      'Cannot enter or submit laboratory results.'
    ]
  },
  'HR Officer': {
    name: 'HR Officer',
    level: 4,
    parentRole: 'Hospital Admin',
    subordinateRoles: [],
    reportsTo: 'Hospital Admin',
    category: 'Administration',
    description: 'Level 4: Manages staff profiles, contracts, MDC/NMC/Pharmacy Council licensing verification, shift rosters, and leave.',
    allowedRoutes: ['/dashboard', '/facility-config', '/security-audit'],
    permissions: [
      'MANAGE_STAFF',
      'MANAGE_HR_RECORDS',
      'MANAGE_SHIFT_SCHEDULES'
    ],
    cannot: [
      'Cannot access patient medical records.',
      'Cannot modify billing or financial information.'
    ]
  },
  'Finance Officer': {
    name: 'Finance Officer',
    level: 4,
    parentRole: 'Hospital Admin',
    subordinateRoles: [],
    reportsTo: 'Hospital Admin',
    category: 'Finance',
    description: 'Level 4: Financial management, revenue analysis, department budgeting, P&L, and accounting reports.',
    allowedRoutes: ['/dashboard', '/billing-cashier', '/nhis-claims', '/dhims2-reports'],
    permissions: [
      'VIEW_REVENUE_REPORTS',
      'VIEW_EXECUTIVE_DASHBOARD',
      'RECONCILE_CLAIMS'
    ],
    cannot: [
      'Cannot view confidential patient clinical notes.',
      'Cannot dispense medicines.',
      'Cannot modify patient medical records.'
    ]
  },
  'Claims Officer': {
    name: 'Claims Officer',
    level: 4,
    parentRole: 'Hospital Admin',
    subordinateRoles: [],
    reportsTo: 'Hospital Admin',
    category: 'Finance',
    description: 'Level 4: Validates NHIS eligibility, prepares claim batches, verifies ICD/tariff codes, and manages insurance submissions.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/nhis-claims', '/billing-cashier'],
    permissions: [
      'VERIFY_NHIS',
      'PREPARE_CLAIMS',
      'SUBMIT_CLAIMS',
      'RECONCILE_CLAIMS'
    ],
    cannot: [
      'Cannot edit clinical consultation notes.',
      'Cannot prescribe medications.',
      'Cannot alter doctor diagnoses.'
    ]
  },
  'Procurement Officer': {
    name: 'Procurement Officer',
    level: 4,
    parentRole: 'Hospital Admin',
    subordinateRoles: [],
    reportsTo: 'Hospital Admin',
    category: 'Operations',
    description: 'Level 4: Creates purchase requests, supplier quotations, purchase orders, and supplier relationship management.',
    allowedRoutes: ['/dashboard', '/inventory-procurement'],
    permissions: [
      'CREATE_PURCHASE_ORDERS',
      'MANAGE_INVENTORY'
    ],
    cannot: [
      'Cannot dispense pharmacy medicines.',
      'Cannot modify inventory stock counts directly without receipt.',
      'Cannot approve invoice payments independently.'
    ]
  },
  'Store Keeper': {
    name: 'Store Keeper',
    level: 4,
    parentRole: 'Hospital Admin',
    subordinateRoles: [],
    reportsTo: 'Hospital Admin',
    category: 'Operations',
    description: 'Level 4: Maintains central and departmental inventory, stock receipts, transfers, batch tracking, and physical audits.',
    allowedRoutes: ['/dashboard', '/inventory-procurement', '/pharmacy'],
    permissions: [
      'MANAGE_INVENTORY',
      'RECEIVE_STOCK',
      'ISSUE_STOCK_TRANSFERS'
    ],
    cannot: [
      'Cannot issue purchase orders.',
      'Cannot approve stock write-off adjustments.',
      'Cannot dispense patient medications directly.'
    ]
  },
  'OPD / Medical Records': {
    name: 'OPD / Medical Records',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director',
    category: 'Administration',
    description: 'Level 3: Patient registration, MPI lookup, Ghana Card & NHIS capture, document scanning, record merging, and queue routing.',
    allowedRoutes: ['/dashboard', '/patient-registration', '/patient-flow', '/billing-cashier', '/security-audit'],
    permissions: [
      'REGISTER_PATIENT',
      'UPDATE_PATIENT_DEMOGRAPHICS',
      'MANAGE_APPOINTMENTS',
      'QUEUE_MANAGEMENT',
      'MERGE_PATIENTS',
      'RETRIEVE_RECORDS',
      'SCAN_ARCHIVE_DOCUMENTS'
    ],
    cannot: [
      'Cannot diagnose patients.',
      'Cannot prescribe drugs or clinical orders.',
      'Cannot view confidential doctor clinical notes.'
    ]
  },
  'Cashier': {
    name: 'Cashier',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Finance Head',
    category: 'Finance',
    description: 'Level 3: Collects cash, MoMo, and card payments for consultation, lab, pharmacy, and admissions, and issues receipts.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/billing-cashier'],
    permissions: [
      'COLLECT_PAYMENTS',
      'ISSUE_RECEIPTS',
      'CLOSE_CASHIER_SHIFT'
    ],
    cannot: [
      'Cannot edit patient clinical records.',
      'Cannot modify consultation or service fee structures.',
      'Cannot dispense medications.',
      'Cannot approve refunds without Admin authorization.'
    ]
  },
  'Nurse': {
    name: 'Nurse',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Nursing Director',
    category: 'Clinical',
    description: 'Level 3: Triage assessment, vitals capture, nursing notes, inpatient care, and medication administration.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/triage', '/wards-beds', '/emergency'],
    permissions: [
      'RECORD_TRIAGE_VITALS',
      'NURSING_NOTES',
      'MEDICATION_ADMINISTRATION',
      'FLUID_CHARTS',
      'PATIENT_MONITORING',
      'CHECKLIST_DISCHARGE',
      'RETRIEVE_RECORDS'
    ],
    cannot: [
      'Cannot make medical diagnoses.',
      'Cannot prescribe new medications or orders.',
      'Cannot approve official laboratory or radiology results.'
    ]
  },
  'Ward Manager': {
    name: 'Ward Manager',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Nursing Director',
    category: 'Clinical',
    description: 'Level 3: Manages ward bed allocations, admission/discharge/transfer (ADT) workflows, nursing shift rosters, and ward supplies.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/wards-beds', '/emergency', '/triage'],
    permissions: [
      'MANAGE_BEDS',
      'BED_ASSIGNMENT',
      'TRANSFER_PATIENT',
      'INPATIENT_CARE',
      'RECORD_TRIAGE_VITALS',
      'NURSING_NOTES'
    ],
    cannot: [
      'Cannot write clinical consultation notes for doctors.',
      'Cannot alter doctor medication orders.'
    ]
  },
  'Doctor': {
    name: 'Doctor',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Medical Director',
    category: 'Clinical',
    description: 'Level 3: Conducts clinical consultations, records chief complaints, assigns ICD-10 diagnoses, orders labs/radiology, and prescribes medications.',
    allowedRoutes: [
      '/dashboard',
      '/patient-flow',
      '/emr-consultation',
      '/emergency',
      '/wards-beds'
    ],
    permissions: [
      'CLINICAL_CONSULTATION',
      'ICD10_DIAGNOSIS',
      'ORDER_LAB',
      'ORDER_RADIOLOGY',
      'ORDER_PRESCRIPTION',
      'DISCHARGE_SUMMARY',
      'SICK_LEAVE_CERTIFICATE',
      'RETRIEVE_RECORDS'
    ],
    cannot: [
      'Cannot access Triage, LIS Laboratory, or PACS Radiology pages.',
      'Cannot add or modify ward bed setups / bed assignments.',
      'Cannot register emergency intake patients.'
    ]
  },
  'Laboratory Technician': {
    name: 'Laboratory Technician',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Lab Manager',
    category: 'Diagnostics',
    description: 'Level 3: Receives and labels samples, runs lab tests, records quality control, and submits test results.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/laboratory'],
    permissions: [
      'RECEIVE_LAB_SAMPLES',
      'PERFORM_LAB_TESTS',
      'SUBMIT_LAB_RESULTS'
    ],
    cannot: [
      'Cannot order laboratory tests independently.',
      'Cannot prescribe medications.',
      'Cannot modify patient diagnoses.'
    ]
  },
  'Radiographer': {
    name: 'Radiographer',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Radiology Head',
    category: 'Diagnostics',
    description: 'Level 3: Schedules and performs X-Ray, Ultrasound, CT, and MRI imaging procedures and uploads PACS studies.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/radiology'],
    permissions: [
      'PERFORM_IMAGING',
      'UPLOAD_IMAGING_STUDIES'
    ],
    cannot: [
      'Cannot issue diagnostic imaging interpretation reports.',
      'Cannot alter doctor radiology requests.',
      'Cannot prescribe medications.'
    ]
  },
  'Radiologist': {
    name: 'Radiologist',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Medical Director',
    category: 'Diagnostics',
    description: 'Level 3: Interprets diagnostic images (X-Ray, CT, MRI, Ultrasound), writes radiology reports, and signs off findings.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/radiology'],
    permissions: [
      'WRITE_RADIOLOGY_REPORT',
      'SIGN_RADIOLOGY_REPORT'
    ],
    cannot: [
      'Cannot register new patients.',
      'Cannot dispense medicines.',
      'Cannot manage pharmacy/lab inventory.'
    ]
  },
  'Pharmacist': {
    name: 'Pharmacist',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Pharmacy Head',
    category: 'Pharmacy',
    description: 'Level 3: Prescription verification, medicine dispensing, patient counseling, FEFO drug batch tracking, and stock control.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/pharmacy', '/inventory-procurement'],
    permissions: [
      'VIEW_PRESCRIPTIONS',
      'VERIFY_PRESCRIPTION',
      'DISPENSE_MEDICINE',
      'DRUG_SUBSTITUTION',
      'MANAGE_PHARMACY_STOCK',
      'MANAGE_INVENTORY'
    ],
    cannot: [
      'Cannot diagnose patients.',
      'Cannot request laboratory tests.',
      'Cannot change doctor prescriptions without authorization.'
    ]
  },
  'Theatre Nurse': {
    name: 'Theatre Nurse',
    level: 3,
    parentRole: 'Hospital Director',
    subordinateRoles: [],
    reportsTo: 'Hospital Director / Surgical Head',
    category: 'Clinical',
    description: 'Level 3: Prepares operating theatres, manages sterile fields, tracks surgical instruments/consumables, and recovery monitoring.',
    allowedRoutes: ['/dashboard', '/patient-flow', '/emergency', '/wards-beds'],
    permissions: [
      'RECORD_TRIAGE_VITALS',
      'NURSING_NOTES',
      'MEDICATION_ADMINISTRATION',
      'PATIENT_MONITORING'
    ],
    cannot: [
      'Cannot perform surgical procedures independently.',
      'Cannot approve procurement orders.'
    ]
  }
};
