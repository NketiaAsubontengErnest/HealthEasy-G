import { uniqueId } from 'lodash';
import { UserRole } from '@/lib/types/rbac';

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
  allowedRoles?: UserRole[];
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
  allowedRoles?: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  'Super Admin',
  'Hospital Director',
  'Hospital Admin',
  'HR Officer',
  'Finance Officer',
  'Claims Officer',
  'Procurement Officer',
  'Store Keeper',
  'OPD / Medical Records',
  'Cashier',
  'Nurse',
  'Ward Manager',
  'Doctor',
  'Laboratory Technician',
  'Radiographer',
  'Radiologist',
  'Pharmacist',
  'Theatre Nurse',
  'System Auditor'
];

const SidebarContent: MenuItem[] = [
  {
    heading: 'Overview',
    children: [
      {
        name: 'HMS Operational Dashboard',
        icon: 'solar:widget-add-line-duotone',
        id: uniqueId(),
        url: '/dashboard',
        isPro: false,
        allowedRoles: ALL_ROLES
      },
    ],
  },
  {
    heading: 'Patient Administration',
    children: [
      {
        name: 'Master Patient Index (MPI)',
        icon: 'solar:users-group-two-rounded-line-duotone',
        id: uniqueId(),
        url: '/patient-registration',
        isPro: false,
        allowedRoles: ['Hospital Admin', 'OPD / Medical Records', 'Hospital Director']
      },
      {
        name: 'Patient Flow & Queues',
        icon: 'solar:sort-by-time-line-duotone',
        id: uniqueId(),
        url: '/patient-flow',
        isPro: false,
        allowedRoles: [
          'Hospital Admin',
          'OPD / Medical Records',
          'Nurse',
          'Doctor',
          'Laboratory Technician',
          'Pharmacist',
          'Cashier',
          'Claims Officer',
          'Radiographer',
          'Radiologist',
          'Ward Manager',
          'Theatre Nurse',
          'Hospital Director'
        ]
      },
    ],
  },
  {
    heading: 'Clinical Care & Wards',
    children: [
      {
        name: 'Triage & Nursing Vitals',
        icon: 'solar:heart-pulse-line-duotone',
        id: uniqueId(),
        url: '/triage',
        isPro: false,
        allowedRoles: ['Nurse', 'Ward Manager', 'Theatre Nurse', 'Hospital Director']
      },
      {
        name: 'EMR & Consultation',
        icon: 'solar:notes-minimalistic-line-duotone',
        id: uniqueId(),
        url: '/emr-consultation',
        isPro: false,
        allowedRoles: ['Doctor', 'Hospital Director']
      },
      {
        name: 'Emergency Department',
        icon: 'solar:siren-line-duotone',
        id: uniqueId(),
        url: '/emergency',
        isPro: false,
        allowedRoles: ['Nurse', 'Doctor', 'Theatre Nurse', 'Hospital Director']
      },
      {
        name: 'Inpatient, Wards & Beds',
        icon: 'solar:bed-line-duotone',
        id: uniqueId(),
        url: '/wards-beds',
        isPro: false,
        allowedRoles: ['Nurse', 'Doctor', 'Ward Manager', 'Theatre Nurse', 'Hospital Director']
      },
    ],
  },
  {
    heading: 'Diagnostics & Pharmacy',
    children: [
      {
        name: 'Laboratory (LIS)',
        icon: 'solar:test-tube-line-duotone',
        id: uniqueId(),
        url: '/laboratory',
        isPro: false,
        allowedRoles: ['Laboratory Technician', 'Hospital Director']
      },
      {
        name: 'Radiology & Imaging',
        icon: 'solar:scanner-line-duotone',
        id: uniqueId(),
        url: '/radiology',
        isPro: false,
        allowedRoles: ['Radiographer', 'Radiologist', 'Hospital Director']
      },
      {
        name: 'Pharmacy & FEFO Stock',
        icon: 'solar:medical-kit-line-duotone',
        id: uniqueId(),
        url: '/pharmacy',
        isPro: false,
        allowedRoles: ['Pharmacist', 'Store Keeper', 'Hospital Director']
      },
    ],
  },
  {
    heading: 'Finance & Insurance',
    children: [
      {
        name: 'Billing & Cashier',
        icon: 'solar:bill-list-line-duotone',
        id: uniqueId(),
        url: '/billing-cashier',
        isPro: false,
        allowedRoles: ['Hospital Admin', 'OPD / Medical Records', 'Cashier', 'Claims Officer', 'Finance Officer', 'Hospital Director']
      },
      {
        name: 'NHIS & Claims Engine',
        icon: 'solar:card-recive-line-duotone',
        id: uniqueId(),
        url: '/nhis-claims',
        isPro: false,
        allowedRoles: ['Claims Officer', 'Finance Officer', 'Hospital Director']
      },
    ],
  },
  {
    heading: 'Operations & Compliance',
    children: [
      {
        name: 'Hospitals & Multi-Tenancy',
        icon: 'solar:hospital-line-duotone',
        id: uniqueId(),
        url: '/hospitals-management',
        isPro: false,
        allowedRoles: ['Super Admin', 'Hospital Director', 'Hospital Admin']
      },
      {
        name: 'Inventory & Stores',
        icon: 'solar:box-minimalistic-line-duotone',
        id: uniqueId(),
        url: '/inventory-procurement',
        isPro: false,
        allowedRoles: ['Super Admin', 'Hospital Admin', 'Pharmacist', 'Store Keeper', 'Procurement Officer', 'Hospital Director']
      },
      {
        name: 'Facility & HeFRA Config',
        icon: 'solar:settings-minimalistic-line-duotone',
        id: uniqueId(),
        url: '/facility-config',
        isPro: false,
        allowedRoles: ['Super Admin', 'Hospital Admin', 'HR Officer', 'Hospital Director']
      },
      {
        name: 'DHIMS2 & GHS Reports',
        icon: 'solar:chart-2-line-duotone',
        id: uniqueId(),
        url: '/dhims2-reports',
        isPro: false,
        allowedRoles: ['Super Admin', 'Hospital Admin', 'Finance Officer', 'Hospital Director', 'System Auditor']
      },
      {
        name: 'Security, Audit & DPC',
        icon: 'solar:shield-check-line-duotone',
        id: uniqueId(),
        url: '/security-audit',
        isPro: false,
        allowedRoles: ['Super Admin', 'System Auditor', 'Hospital Director']
      },
    ],
  },
];

export default SidebarContent;
