'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  FacilityBranch,
  StaffCredential,
  PatientRecord,
  QueueItem,
  VitalSigns,
  EMREncounter,
  InpatientBed,
  MedicationAdministrationRecord,
  LabOrderRecord,
  RadiologyOrderRecord,
  PharmacyBatchItem,
  PrescriptionDispenseRecord,
  BillingInvoice,
  NHISClaimLine,
  NHISClaimBatch,
  InventoryStoreItem,
  DHIMSReportSummary,
  AuditLogEntry,
  ClinicalOrder
} from '@/lib/types/hms';
import { UserRole, Permission, ROLE_DEFINITIONS, RoleDefinition } from '@/lib/types/rbac';

// Mock Initial Data for Ghana HMS Setup
const INITIAL_FACILITIES: FacilityBranch[] = [
  {
    id: 'fac-1',
    name: 'HealthEasy-G Ridge Regional Hospital',
    code: 'GAR-RIDGE-01',
    hefraLicenseNo: 'HEFRA-GAR-2025-0842',
    hefraExpiryDate: '2026-11-30',
    hefraStatus: 'Active',
    location: 'Castle Road, Ridge, Accra',
    gpsAddress: 'GA-029-3829',
    phone: '+233 30 222 8311',
    email: 'info@ridgehms.gh',
    region: 'Greater Accra',
    facilityType: 'Regional',
    status: 'Active',
    adminName: 'Dr. Emmanuel Quaye',
    adminEmail: 'director.ridge@ridgehms.gh',
    bedCapacity: 450,
    createdDate: '2025-01-15'
  },
  {
    id: 'fac-2',
    name: 'HealthEasy-G Kumasi South Annex',
    code: 'ASH-KUMASI-02',
    hefraLicenseNo: 'HEFRA-ASH-2024-0119',
    hefraExpiryDate: '2026-09-15',
    hefraStatus: 'Active',
    location: 'Atonsu Agogo, Kumasi',
    gpsAddress: 'AK-192-0041',
    phone: '+233 32 206 1420',
    email: 'kumasi@ridgehms.gh',
    region: 'Ashanti',
    facilityType: 'District',
    status: 'Active',
    adminName: 'Dr. Akosua Boakye',
    adminEmail: 'admin.kumasi@ridgehms.gh',
    bedCapacity: 180,
    createdDate: '2025-03-20'
  },
  {
    id: 'fac-3',
    name: 'HealthEasy-G Tamale Teaching Annex',
    code: 'NR-TAMALE-03',
    hefraLicenseNo: 'HEFRA-NR-2025-0401',
    hefraExpiryDate: '2027-02-28',
    hefraStatus: 'Active',
    location: 'Hospital Road, Tamale',
    gpsAddress: 'NT-011-8890',
    phone: '+233 37 202 2411',
    email: 'tamale@ridgehms.gh',
    region: 'Northern',
    facilityType: 'Teaching/Tertiary',
    status: 'Active',
    adminName: 'Dr. Fuseini Haruna',
    adminEmail: 'director.tamale@ridgehms.gh',
    bedCapacity: 600,
    createdDate: '2025-06-10'
  }
];

const INITIAL_STAFF: StaffCredential[] = [
  {
    id: 'st-1',
    name: 'Dr. Kwame Mensah',
    role: 'Doctor',
    staffId: 'DOC-9921',
    email: 'kwame.mensah@ridgehms.gh',
    licenseNumber: 'MDC/RN/18492',
    licensingBody: 'MDC',
    licenseExpiry: '2027-01-31',
    status: 'Active',
    department: 'OPD Consultation'
  },
  {
    id: 'st-2',
    name: 'Nurse Abena Osei',
    role: 'Nurse',
    staffId: 'NUR-4029',
    email: 'abena.osei@ridgehms.gh',
    licenseNumber: 'NMC/GR/48201',
    licensingBody: 'NMC',
    licenseExpiry: '2026-08-15',
    status: 'Expiring Soon',
    department: 'Triage & OPD'
  },
  {
    id: 'st-3',
    name: 'Pharm. Kojo Appiah',
    role: 'Pharmacist',
    staffId: 'PH-1102',
    email: 'kojo.appiah@ridgehms.gh',
    licenseNumber: 'PC/GAR/9021',
    licensingBody: 'Pharmacy Council',
    licenseExpiry: '2027-04-12',
    status: 'Active',
    department: 'Main Pharmacy'
  },
  {
    id: 'st-4',
    name: 'Ebenezer Boateng',
    role: 'Laboratory Technician',
    staffId: 'LAB-5510',
    email: 'e.boateng@ridgehms.gh',
    licenseNumber: 'AHPC/LS/3920',
    licensingBody: 'AHPC',
    licenseExpiry: '2026-10-01',
    status: 'Active',
    department: 'Hematology Lab'
  },
  {
    id: 'st-5',
    name: 'Akosua Frimpong',
    role: 'Cashier',
    staffId: 'CSH-0034',
    email: 'a.frimpong@ridgehms.gh',
    licenseNumber: 'N/A',
    licensingBody: 'Other',
    licenseExpiry: '2099-12-31',
    status: 'Active',
    department: 'Accounts & Billing'
  },
  {
    id: 'st-6',
    name: 'Dr. Grace Asantewaa',
    role: 'Doctor',
    staffId: 'DOC-1104',
    email: 'grace.asantewaa@ridgehms.gh',
    licenseNumber: 'MDC/RN/22091',
    licensingBody: 'MDC',
    licenseExpiry: '2027-06-30',
    status: 'Active',
    department: 'Emergency & Acute Care'
  },
  {
    id: 'st-7',
    name: 'Samuel Addo',
    role: 'Radiographer',
    staffId: 'RAD-3011',
    email: 's.addo@ridgehms.gh',
    licenseNumber: 'AHPC/RAD/1029',
    licensingBody: 'AHPC',
    licenseExpiry: '2026-11-15',
    status: 'Active',
    department: 'Radiology & Imaging'
  },
  {
    id: 'st-8',
    name: 'Nurse Joyce Tetteh',
    role: 'Nurse',
    staffId: 'NUR-8802',
    email: 'joyce.tetteh@ridgehms.gh',
    licenseNumber: 'NMC/GR/39011',
    licensingBody: 'NMC',
    licenseExpiry: '2027-03-20',
    status: 'Active',
    department: 'Male Surgical Ward'
  },
  {
    id: 'st-9',
    name: 'Dr. S. K. Boateng',
    role: 'Radiologist',
    staffId: 'RAD-DOC-01',
    email: 'sk.boateng@ridgehms.gh',
    licenseNumber: 'MDC/RN/09281',
    licensingBody: 'MDC',
    licenseExpiry: '2027-10-31',
    status: 'Active',
    department: 'Radiology PACS'
  },
  {
    id: 'st-10',
    name: 'Emmanuel Owusu',
    role: 'OPD / Medical Records',
    staffId: 'REC-0012',
    email: 'records@ridgehms.gh',
    licenseNumber: 'N/A',
    licensingBody: 'Other',
    licenseExpiry: '2099-12-31',
    status: 'Active',
    department: 'Master Patient Index'
  }
];

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-1',
    mrn: 'HG-2026-0001',
    fullName: 'Kofi Owusu Ansah',
    dob: '1985-04-12',
    gender: 'Male',
    phone: '+233 24 412 3456',
    ghanaCardNo: 'GHA-721098412-4',
    nhisNumber: '39482019',
    nhisStatus: 'Active',
    nhisExpiry: '2027-03-31',
    patientCategory: 'NHIS',
    gpsAddress: 'GA-142-9902',
    residentialAddress: 'House 14, Ring Road Central, Osu, Accra',
    emergencyContact: {
      name: 'Yaa Ansah',
      relationship: 'Wife',
      phone: '+233 20 811 2233'
    },
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['Hypertension'],
    bloodGroup: 'O+',
    registrationDate: '2026-01-10',
    consentSigned: true
  },
  {
    id: 'pat-2',
    mrn: 'HG-2026-0002',
    fullName: 'Ama Serwaa Akoto',
    dob: '1992-09-25',
    gender: 'Female',
    phone: '+233 55 901 8877',
    ghanaCardNo: 'GHA-009218471-1',
    nhisNumber: '88201942',
    nhisStatus: 'Active',
    nhisExpiry: '2026-12-15',
    patientCategory: 'NHIS',
    gpsAddress: 'GA-088-1200',
    residentialAddress: 'Flat 4B, Cantonments, Accra',
    emergencyContact: {
      name: 'Dr. Kwame Akoto',
      relationship: 'Brother',
      phone: '+233 24 300 1122'
    },
    allergies: [],
    chronicConditions: ['Asthma'],
    bloodGroup: 'A+',
    registrationDate: '2026-02-14',
    consentSigned: true
  },
  {
    id: 'pat-3',
    mrn: 'HG-2026-0003',
    fullName: 'Yaw Addo-Danquah',
    dob: '1978-11-03',
    gender: 'Male',
    phone: '+233 27 765 4321',
    ghanaCardNo: 'GHA-994810293-8',
    patientCategory: 'Private Insurance',
    gpsAddress: 'GA-301-4455',
    residentialAddress: 'Airport Residential Area, Accra',
    emergencyContact: {
      name: 'Grace Addo',
      relationship: 'Sister',
      phone: '+233 50 111 4455'
    },
    allergies: ['NSAIDs'],
    chronicConditions: ['Type 2 Diabetes'],
    bloodGroup: 'B+',
    registrationDate: '2026-03-01',
    consentSigned: true
  },
  {
    id: 'pat-4',
    mrn: 'HG-2026-0004',
    fullName: 'Efua Mansa Quaye',
    dob: '1998-06-18',
    gender: 'Female',
    phone: '+233 24 990 1122',
    ghanaCardNo: 'GHA-551029381-0',
    nhisNumber: '90124810',
    nhisStatus: 'Active',
    nhisExpiry: '2027-01-20',
    patientCategory: 'NHIS',
    gpsAddress: 'GA-510-2201',
    residentialAddress: 'House 88, Dansoman, Accra',
    emergencyContact: {
      name: 'Joseph Quaye',
      relationship: 'Father',
      phone: '+233 20 440 9988'
    },
    allergies: ['Aspirin'],
    chronicConditions: [],
    bloodGroup: 'O-',
    registrationDate: '2026-04-05',
    consentSigned: true
  },
  {
    id: 'pat-5',
    mrn: 'HG-2026-0005',
    fullName: 'Kwabena Agyemang Badu',
    dob: '1965-02-28',
    gender: 'Male',
    phone: '+233 20 334 5566',
    ghanaCardNo: 'GHA-881920391-7',
    patientCategory: 'Cash',
    gpsAddress: 'AK-092-4410',
    residentialAddress: 'Plot 12, Asokwa, Kumasi',
    emergencyContact: {
      name: 'Akosua Badu',
      relationship: 'Daughter',
      phone: '+233 24 555 7788'
    },
    allergies: [],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    bloodGroup: 'AB+',
    registrationDate: '2026-05-12',
    consentSigned: true
  },
  {
    id: 'pat-6',
    mrn: 'HG-2026-0006',
    fullName: 'Abena Pokuaa Mensah',
    dob: '2001-12-05',
    gender: 'Female',
    phone: '+233 54 881 9900',
    ghanaCardNo: 'GHA-110293847-5',
    nhisNumber: '10928374',
    nhisStatus: 'Active',
    nhisExpiry: '2026-11-30',
    patientCategory: 'NHIS',
    gpsAddress: 'GA-204-1188',
    residentialAddress: 'Block C, Madina, Accra',
    emergencyContact: {
      name: 'Kojo Mensah',
      relationship: 'Husband',
      phone: '+233 27 222 3344'
    },
    allergies: ['Penicillin'],
    chronicConditions: [],
    bloodGroup: 'A-',
    registrationDate: '2026-06-01',
    consentSigned: true
  }
];

const INITIAL_QUEUES: QueueItem[] = [
  {
    id: 'q-1',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    patientName: 'Kofi Owusu Ansah',
    patientCategory: 'NHIS',
    department: 'OPD Consultation',
    servicePoint: 'Consulting Room 2',
    queueNumber: 'OPD-014',
    arrivalTime: '08:15 AM',
    waitingMinutes: 25,
    priority: 'Normal',
    status: 'Waiting',
    currentLocation: 'OPD Waiting Lounge'
  },
  {
    id: 'q-2',
    patientId: 'pat-2',
    mrn: 'HG-2026-0002',
    patientName: 'Ama Serwaa Akoto',
    patientCategory: 'NHIS',
    department: 'Laboratory',
    servicePoint: 'Phlebotomy Bay A',
    queueNumber: 'LAB-008',
    arrivalTime: '08:40 AM',
    waitingMinutes: 12,
    priority: 'Normal',
    status: 'In Consultation',
    currentLocation: 'Main Lab Reception'
  },
  {
    id: 'q-3',
    patientId: 'pat-3',
    mrn: 'HG-2026-0003',
    patientName: 'Yaw Addo-Danquah',
    patientCategory: 'Private Insurance',
    department: 'Triage',
    servicePoint: 'Triage Station 1',
    queueNumber: 'TRG-021',
    arrivalTime: '09:00 AM',
    waitingMinutes: 5,
    priority: 'Urgent',
    status: 'Waiting',
    currentLocation: 'Triage Bay'
  },
  {
    id: 'q-4',
    patientId: 'pat-4',
    mrn: 'HG-2026-0004',
    patientName: 'Efua Mansa Quaye',
    patientCategory: 'NHIS',
    department: 'Pharmacy',
    servicePoint: 'Dispensing Window 3',
    queueNumber: 'PHM-045',
    arrivalTime: '09:15 AM',
    waitingMinutes: 18,
    priority: 'Normal',
    status: 'Waiting',
    currentLocation: 'Pharmacy Waiting Area'
  },
  {
    id: 'q-5',
    patientId: 'pat-5',
    mrn: 'HG-2026-0005',
    patientName: 'Kwabena Agyemang Badu',
    patientCategory: 'Cash',
    department: 'Emergency',
    servicePoint: 'Resuscitation Bay 1',
    queueNumber: 'EMG-003',
    arrivalTime: '09:30 AM',
    waitingMinutes: 2,
    priority: 'Emergency',
    status: 'In Consultation',
    currentLocation: 'Emergency Department'
  },
  {
    id: 'q-6',
    patientId: 'pat-6',
    mrn: 'HG-2026-0006',
    patientName: 'Abena Pokuaa Mensah',
    patientCategory: 'NHIS',
    department: 'Radiology',
    servicePoint: 'X-Ray Suite 1',
    queueNumber: 'RAD-012',
    arrivalTime: '09:45 AM',
    waitingMinutes: 10,
    priority: 'Normal',
    status: 'Waiting',
    currentLocation: 'Radiology Waiting Lounge'
  }
];

const INITIAL_VITALS: VitalSigns[] = [
  {
    id: 'vit-1',
    patientId: 'pat-1',
    encounterId: 'enc-1',
    timestamp: '2026-08-01 08:30 AM',
    systolicBp: 145,
    diastolicBp: 92,
    pulseRate: 84,
    temperature: 37.2,
    respiratoryRate: 18,
    oxygenSaturation: 98,
    weightKg: 78,
    heightCm: 175,
    bmi: 25.5,
    bloodGlucoseMmoles: 6.4,
    painScore: 2,
    esiSeverity: 'ESI-3 Urgent',
    nursingNotes: 'Patient complains of mild persistent headache for 2 days. Elevated BP noted.',
    abnormalAlerts: ['Elevated Systolic BP (>140)', 'Elevated Diastolic BP (>90)'],
    recordedBy: 'Nurse Abena Osei'
  },
  {
    id: 'vit-2',
    patientId: 'pat-2',
    encounterId: 'enc-2',
    timestamp: '2026-08-01 08:45 AM',
    systolicBp: 118,
    diastolicBp: 76,
    pulseRate: 92,
    temperature: 38.6,
    respiratoryRate: 20,
    oxygenSaturation: 97,
    weightKg: 62,
    heightCm: 165,
    bmi: 22.8,
    bloodGlucoseMmoles: 5.1,
    painScore: 4,
    esiSeverity: 'ESI-3 Urgent',
    nursingNotes: 'Patient presenting with high fever, chills, and body aches x 3 days. Triage fever protocol initiated.',
    abnormalAlerts: ['Pyrexia / Fever (>38.0°C)'],
    recordedBy: 'Nurse Abena Osei'
  },
  {
    id: 'vit-3',
    patientId: 'pat-5',
    encounterId: 'enc-3',
    timestamp: '2026-08-01 09:32 AM',
    systolicBp: 175,
    diastolicBp: 105,
    pulseRate: 110,
    temperature: 36.8,
    respiratoryRate: 24,
    oxygenSaturation: 94,
    weightKg: 85,
    heightCm: 170,
    bmi: 29.4,
    bloodGlucoseMmoles: 14.8,
    painScore: 7,
    esiSeverity: 'ESI-2 Emergency',
    nursingNotes: 'Emergency arrival via ambulance. Severe crushing chest heaviness and shortness of breath.',
    abnormalAlerts: ['Severe Hypertension (>160/100)', 'Hyperglycemia (>11.1 mmol/L)', 'Tachycardia (>100 bpm)'],
    recordedBy: 'Nurse Joyce Tetteh'
  }
];

const INITIAL_ENCOUNTERS: EMREncounter[] = [
  {
    id: 'enc-1',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    patientName: 'Kofi Owusu Ansah',
    encounterType: 'OPD',
    clinicianName: 'Dr. Kwame Mensah',
    timestamp: '2026-08-01 08:45 AM',
    presentingComplaints: 'Occipital headache and occasional dizziness for 48 hours.',
    historyOfPresentingComplaint: 'No fever, no vision changes. History of non-compliance with anti-hypertensives.',
    pastMedicalHistory: 'Known hypertensive x 4 years.',
    physicalExamination: 'Alert, afebrile. Chest clear. BP 145/92 mmHg. Heart sounds S1 S2 present.',
    icdDiagnoses: [
      { code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' },
      { code: 'R51', name: 'Headache', category: 'Neurological' }
    ],
    clinicalNotes: 'Initiated lifestyle counseling and adjusted anti-hypertensive regimen. Requested FBC and Lipid Profile.',
    treatmentPlan: 'Take Amlodipine 10mg daily. Review lab results in 3 days.',
    sickLeaveDays: 2,
    orders: [
      {
        id: 'ord-1',
        encounterId: 'enc-1',
        patientId: 'pat-1',
        type: 'Laboratory',
        code: 'LAB-FBC',
        description: 'Full Blood Count (FBC)',
        costGhc: 45.0,
        nhisCovered: true,
        status: 'Completed',
        orderedBy: 'Dr. Kwame Mensah',
        orderTimestamp: '2026-08-01 08:50 AM'
      },
      {
        id: 'ord-2',
        encounterId: 'enc-1',
        patientId: 'pat-1',
        type: 'Prescription',
        code: 'AML-10',
        description: 'Tab Amlodipine 10mg Daily x 30 Days',
        costGhc: 35.0,
        nhisCovered: true,
        status: 'Completed',
        orderedBy: 'Dr. Kwame Mensah',
        orderTimestamp: '2026-08-01 08:52 AM'
      }
    ],
    dischargeDecision: 'Discharged',
    signed: true
  },
  {
    id: 'enc-2',
    patientId: 'pat-2',
    mrn: 'HG-2026-0002',
    patientName: 'Ama Serwaa Akoto',
    encounterType: 'OPD',
    clinicianName: 'Dr. Kwame Mensah',
    timestamp: '2026-08-01 09:10 AM',
    presentingComplaints: 'High fever, rigors, joint pains, and severe fatigue x 3 days.',
    historyOfPresentingComplaint: 'No cough, no diarrhea. History of recent travel to rural Volta Region.',
    pastMedicalHistory: 'Asthma (infrequent exacerbations).',
    physicalExamination: 'Febrile (38.6°C), mild pallor. Abdomen soft, non-tender. Spleen not palpable.',
    icdDiagnoses: [
      { code: 'B50.9', name: 'Plasmodium falciparum malaria, unspecified', category: 'Infectious' },
      { code: 'R50.9', name: 'Fever, unspecified', category: 'General' }
    ],
    clinicalNotes: 'Confirmed uncomplicated malaria on blood film / RDT. Prescribed Artemether-Lumefantrine (Coartem).',
    treatmentPlan: 'Complete 3-day course of Coartem. Paracetamol for fever. Increase oral fluids.',
    sickLeaveDays: 3,
    orders: [
      {
        id: 'ord-3',
        encounterId: 'enc-2',
        patientId: 'pat-2',
        type: 'Laboratory',
        code: 'LAB-MAL-RDT',
        description: 'Malaria Parasitemia & RDT',
        costGhc: 25.0,
        nhisCovered: true,
        status: 'Completed',
        orderedBy: 'Dr. Kwame Mensah',
        orderTimestamp: '2026-08-01 09:15 AM'
      },
      {
        id: 'ord-4',
        encounterId: 'enc-2',
        patientId: 'pat-2',
        type: 'Prescription',
        code: 'COA-80',
        description: 'Tab Coartem 80/480mg (Artemether/Lumefantrine) 1 tab BD x 3 days',
        costGhc: 40.0,
        nhisCovered: true,
        status: 'Pending',
        orderedBy: 'Dr. Kwame Mensah',
        orderTimestamp: '2026-08-01 09:20 AM'
      }
    ],
    dischargeDecision: 'Discharged',
    signed: true
  },
  {
    id: 'enc-3',
    patientId: 'pat-5',
    mrn: 'HG-2026-0005',
    patientName: 'Kwabena Agyemang Badu',
    encounterType: 'Emergency',
    clinicianName: 'Dr. Grace Asantewaa',
    timestamp: '2026-08-01 09:40 AM',
    presentingComplaints: 'Sudden onset substernal chest pain radiating to left arm with profuse sweating.',
    historyOfPresentingComplaint: 'Duration 1 hour. Associated with nausea and shortness of breath.',
    pastMedicalHistory: 'Hypertension and Type 2 Diabetes x 10 years.',
    physicalExamination: 'Distressed, diaphoretic. BP 175/105 mmHg, Pulse 110 bpm. ECG shows ST-segment elevation in V2-V5.',
    icdDiagnoses: [
      { code: 'I21.0', name: 'Acute transmural myocardial infarction of anterior wall', category: 'Cardiovascular' },
      { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' }
    ],
    clinicalNotes: 'Acute STEMI protocol activated. Oxygen, Aspirin 300mg, Clopidogrel 300mg, Sublingual Nitroglycerin given. Admitted to ICU Bed 01.',
    treatmentPlan: 'Emergency Thrombolysis / Transfer for PCI. Urgent ICU admission.',
    orders: [
      {
        id: 'ord-5',
        encounterId: 'enc-3',
        patientId: 'pat-5',
        type: 'Admission',
        code: 'ADM-ICU',
        description: 'Emergency ICU Admission (Bed ICU-01)',
        costGhc: 500.0,
        nhisCovered: false,
        status: 'In-Progress',
        orderedBy: 'Dr. Grace Asantewaa',
        orderTimestamp: '2026-08-01 09:45 AM'
      }
    ],
    dischargeDecision: 'Admitted',
    signed: true
  }
];

const INITIAL_BEDS: InpatientBed[] = [
  { id: 'bed-101', wardName: 'Male Surgical Ward', bedNumber: 'Bed MS-01', type: 'General', status: 'Occupied', currentPatientId: 'pat-3', currentPatientName: 'Yaw Addo-Danquah', currentMrn: 'HG-2026-0003', admissionDate: '2026-07-29', assignedNurse: 'Nurse Abena Osei', dailyRateGhc: 120.0 },
  { id: 'bed-102', wardName: 'Male Surgical Ward', bedNumber: 'Bed MS-02', type: 'General', status: 'Available', dailyRateGhc: 120.0 },
  { id: 'bed-103', wardName: 'Female Medical Ward', bedNumber: 'Bed FM-01', type: 'General', status: 'Cleaning', dailyRateGhc: 110.0 },
  { id: 'bed-104', wardName: 'Maternity Ward', bedNumber: 'Bed MAT-01', type: 'Maternity', status: 'Available', dailyRateGhc: 150.0 },
  { id: 'bed-105', wardName: 'Intensive Care Unit', bedNumber: 'ICU Bed 01', type: 'ICU', status: 'Occupied', currentPatientId: 'pat-5', currentPatientName: 'Kwabena Agyemang Badu', currentMrn: 'HG-2026-0005', admissionDate: '2026-08-01', assignedNurse: 'Nurse Joyce Tetteh', dailyRateGhc: 500.0 },
  { id: 'bed-106', wardName: 'Isolation Unit', bedNumber: 'ISO Bed 01', type: 'Isolation', status: 'Reserved', dailyRateGhc: 300.0 },
  { id: 'bed-107', wardName: 'Pediatric Ward', bedNumber: 'PED Bed 01', type: 'Pediatric', status: 'Available', dailyRateGhc: 100.0 }
];

const INITIAL_MAR: MedicationAdministrationRecord[] = [
  {
    id: 'mar-1',
    encounterId: 'enc-inpatient-1',
    patientId: 'pat-3',
    patientName: 'Yaw Addo-Danquah',
    bedNumber: 'Bed MS-01',
    drugName: 'Inj Ceftriaxone 1g IV',
    dosage: '1g IV 12 hourly',
    route: 'Intravenous',
    dueTime: '08:00 AM',
    administeredTime: '08:05 AM',
    status: 'Administered',
    administeredBy: 'Nurse Abena Osei'
  },
  {
    id: 'mar-2',
    encounterId: 'enc-inpatient-1',
    patientId: 'pat-3',
    patientName: 'Yaw Addo-Danquah',
    bedNumber: 'Bed MS-01',
    drugName: 'Tab Paracetamol 1g PO',
    dosage: '1g PO 8 hourly',
    route: 'Oral',
    dueTime: '02:00 PM',
    status: 'Scheduled'
  },
  {
    id: 'mar-3',
    encounterId: 'enc-3',
    patientId: 'pat-5',
    patientName: 'Kwabena Agyemang Badu',
    bedNumber: 'ICU Bed 01',
    drugName: 'Inj Morphine 5mg IV',
    dosage: '5mg IV stat',
    route: 'Intravenous',
    dueTime: '09:50 AM',
    administeredTime: '09:52 AM',
    status: 'Administered',
    administeredBy: 'Nurse Joyce Tetteh'
  }
];

const INITIAL_LAB_ORDERS: LabOrderRecord[] = [
  {
    id: 'lab-ord-1',
    orderId: 'ord-1',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    patientName: 'Kofi Owusu Ansah',
    testName: 'Full Blood Count (FBC)',
    testCategory: 'Hematology',
    specimenType: 'EDTA Whole Blood',
    specimenBarcode: 'BC-9948201',
    collectedAt: '2026-08-01 09:05 AM',
    receivedAt: '2026-08-01 09:12 AM',
    status: 'Completed',
    results: [
      { parameter: 'Hemoglobin (Hb)', value: 14.2, unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: false, isCritical: false },
      { parameter: 'White Blood Cells (WBC)', value: 6.8, unit: 'x10^9/L', referenceRange: '4.0 - 11.0', isAbnormal: false, isCritical: false },
      { parameter: 'Platelets', value: 245, unit: 'x10^9/L', referenceRange: '150 - 450', isAbnormal: false, isCritical: false }
    ],
    technicianName: 'Ebenezer Boateng',
    verifiedBy: 'Ebenezer Boateng',
    verificationTimestamp: '2026-08-01 09:40 AM',
    criticalAlertAcknowledged: true
  },
  {
    id: 'lab-ord-2',
    orderId: 'ord-3',
    patientId: 'pat-2',
    mrn: 'HG-2026-0002',
    patientName: 'Ama Serwaa Akoto',
    testName: 'Malaria Parasitemia & RDT',
    testCategory: 'Parasitology',
    specimenType: 'Capillary Whole Blood',
    specimenBarcode: 'BC-8810293',
    collectedAt: '2026-08-01 09:18 AM',
    receivedAt: '2026-08-01 09:22 AM',
    status: 'Completed',
    results: [
      { parameter: 'Malaria RDT (P. falciparum)', value: 'POSITIVE (3+)', unit: 'Result', referenceRange: 'NEGATIVE', isAbnormal: true, isCritical: false },
      { parameter: 'Parasite Density Count', value: 14500, unit: 'trophozoites/µL', referenceRange: '0', isAbnormal: true, isCritical: false }
    ],
    technicianName: 'Ebenezer Boateng',
    verifiedBy: 'Ebenezer Boateng',
    verificationTimestamp: '2026-08-01 09:35 AM',
    criticalAlertAcknowledged: true
  }
];

const INITIAL_RADIOLOGY_ORDERS: RadiologyOrderRecord[] = [
  {
    id: 'rad-ord-1',
    orderId: 'ord-rad-99',
    patientId: 'pat-3',
    mrn: 'HG-2026-0003',
    patientName: 'Yaw Addo-Danquah',
    modality: 'X-Ray',
    bodyPart: 'Chest PA View',
    clinicalIndication: 'Pre-operative assessment & mild chronic cough',
    pregnancyScreened: true,
    status: 'Report Verified',
    radiographerNotes: 'PA view taken in erect position. Full inspiration achieved.',
    radiologistReport: 'Lungs are clear bilaterally. No focal infiltrate or consolidation. Heart size normal.',
    verifiedBy: 'Dr. S. K. Boateng (Consultant Radiologist)',
    verificationTimestamp: '2026-07-30 02:15 PM'
  },
  {
    id: 'rad-ord-2',
    orderId: 'ord-rad-102',
    patientId: 'pat-6',
    mrn: 'HG-2026-0006',
    patientName: 'Abena Pokuaa Mensah',
    modality: 'Ultrasound',
    bodyPart: 'Pelvic / Obstetric Scan',
    clinicalIndication: 'Lower abdominal cramps & amenorrhea x 8 weeks',
    pregnancyScreened: true,
    status: 'Scheduled',
    radiographerNotes: 'Patient prepared with full urinary bladder.',
    verifiedBy: 'Samuel Addo',
    verificationTimestamp: '2026-08-01 10:00 AM'
  }
];

const INITIAL_PHARMACY_BATCHES: PharmacyBatchItem[] = [
  { id: 'pb-1', drugCode: 'AML-10', genericName: 'Amlodipine Besylate', brandName: 'Norvasc', dosageForm: 'Tablet', strength: '10mg', batchNumber: 'BN-AML-2025-09', expiryDate: '2027-08-31', quantityInStock: 450, reorderLevel: 100, unitPriceGhc: 1.2, supplier: 'Tobbinco Pharmaceuticals', isControlled: false },
  { id: 'pb-2', drugCode: 'PAR-500', genericName: 'Paracetamol', brandName: 'Panadol', dosageForm: 'Tablet', strength: '500mg', batchNumber: 'BN-PAR-2026-02', expiryDate: '2028-01-15', quantityInStock: 1200, reorderLevel: 250, unitPriceGhc: 0.5, supplier: 'Earnest Chemists', isControlled: false },
  { id: 'pb-3', drugCode: 'TRM-50', genericName: 'Tramadol Hydrochloride', brandName: 'Ultram', dosageForm: 'Capsule', strength: '50mg', batchNumber: 'BN-TRM-RESTRICTED', expiryDate: '2026-11-20', quantityInStock: 40, reorderLevel: 50, unitPriceGhc: 3.5, supplier: 'FDA Ghana Certified Importer', isControlled: true },
  { id: 'pb-4', drugCode: 'AMX-500', genericName: 'Amoxicillin Trihydrate', brandName: 'Amoxil', dosageForm: 'Capsule', strength: '500mg', batchNumber: 'BN-AMX-2025-01', expiryDate: '2026-08-25', quantityInStock: 85, reorderLevel: 150, unitPriceGhc: 2.0, supplier: 'M&G Pharmaceuticals', isControlled: false },
  { id: 'pb-5', drugCode: 'COA-80', genericName: 'Artemether / Lumefantrine', brandName: 'Coartem', dosageForm: 'Tablet', strength: '80/480mg', batchNumber: 'BN-COA-2026-05', expiryDate: '2027-12-31', quantityInStock: 320, reorderLevel: 80, unitPriceGhc: 6.5, supplier: 'Novartis Ghana', isControlled: false },
  { id: 'pb-6', drugCode: 'MET-500', genericName: 'Metformin Hydrochloride', brandName: 'Glucophage', dosageForm: 'Tablet', strength: '500mg', batchNumber: 'BN-MET-2025-11', expiryDate: '2027-09-30', quantityInStock: 600, reorderLevel: 120, unitPriceGhc: 0.8, supplier: 'Tobbinco Pharmaceuticals', isControlled: false }
];

const INITIAL_DISPENSING: PrescriptionDispenseRecord[] = [
  {
    id: 'disp-1',
    prescriptionId: 'ord-2',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    patientName: 'Kofi Owusu Ansah',
    drugName: 'Amlodipine 10mg',
    dosageInstructions: 'Take 1 tab daily with water',
    quantityPrescribed: 30,
    quantityDispensed: 30,
    batchNumber: 'BN-AML-2025-09',
    dispensedBy: 'Pharm. Kojo Appiah',
    dispenseTimestamp: '2026-08-01 09:55 AM',
    status: 'Dispensed',
    counselingNotes: 'Advised patient on importance of taking medication daily in the morning.'
  }
];

const INITIAL_INVOICES: BillingInvoice[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-2026-0081',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    patientName: 'Kofi Owusu Ansah',
    patientCategory: 'NHIS',
    lineItems: [
      { description: 'OPD Consultation Fee (GHS Tariff)', category: 'Consultation', amountGhc: 35.0, nhisCoveredGhc: 35.0, patientPayableGhc: 0.0 },
      { description: 'Full Blood Count (FBC)', category: 'Lab', amountGhc: 45.0, nhisCoveredGhc: 45.0, patientPayableGhc: 0.0 },
      { description: 'Tab Amlodipine 10mg x 30', category: 'Pharmacy', amountGhc: 36.0, nhisCoveredGhc: 36.0, patientPayableGhc: 0.0 }
    ],
    totalAmountGhc: 116.0,
    totalNhisCoveredGhc: 116.0,
    totalPatientPayableGhc: 0.0,
    amountPaidGhc: 0.0,
    balanceDueGhc: 0.0,
    paymentStatus: 'Paid',
    paymentMethod: 'NHIS Claim',
    timestamp: '2026-08-01 09:58 AM'
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-2026-0082',
    patientId: 'pat-2',
    mrn: 'HG-2026-0002',
    patientName: 'Ama Serwaa Akoto',
    patientCategory: 'NHIS',
    lineItems: [
      { description: 'OPD Consultation Fee', category: 'Consultation', amountGhc: 35.0, nhisCoveredGhc: 35.0, patientPayableGhc: 0.0 },
      { description: 'Malaria RDT / Parasitemia Test', category: 'Lab', amountGhc: 25.0, nhisCoveredGhc: 25.0, patientPayableGhc: 0.0 },
      { description: 'Tab Coartem 80/480mg x 6', category: 'Pharmacy', amountGhc: 40.0, nhisCoveredGhc: 40.0, patientPayableGhc: 0.0 }
    ],
    totalAmountGhc: 100.0,
    totalNhisCoveredGhc: 100.0,
    totalPatientPayableGhc: 0.0,
    amountPaidGhc: 0.0,
    balanceDueGhc: 0.0,
    paymentStatus: 'Paid',
    paymentMethod: 'NHIS Claim',
    timestamp: '2026-08-01 10:15 AM'
  }
];

const INITIAL_NHIS_CLAIMS: NHISClaimLine[] = [
  {
    id: 'clm-1',
    claimId: 'NHIS-CLM-2026-001',
    patientId: 'pat-1',
    mrn: 'HG-2026-0001',
    nhisNumber: '39482019',
    attendanceDate: '2026-08-01',
    verificationRef: 'NIA-VER-20260801-9921',
    diagnosisCode: 'I10',
    diagnosisName: 'Essential (primary) hypertension',
    tariffServiceCode: 'GHS-OPD-CON-02',
    tariffServiceAmountGhc: 35.0,
    tariffMedicineCode: 'GHS-MED-AML10',
    tariffMedicineAmountGhc: 36.0,
    totalClaimAmountGhc: 71.0,
    status: 'Batched'
  },
  {
    id: 'clm-2',
    claimId: 'NHIS-CLM-2026-002',
    patientId: 'pat-2',
    mrn: 'HG-2026-0002',
    nhisNumber: '88201942',
    attendanceDate: '2026-08-01',
    verificationRef: 'NIA-VER-20260801-4401',
    diagnosisCode: 'B50.9',
    diagnosisName: 'Plasmodium falciparum malaria, unspecified',
    tariffServiceCode: 'GHS-OPD-CON-01',
    tariffServiceAmountGhc: 35.0,
    tariffMedicineCode: 'GHS-MED-COA80',
    tariffMedicineAmountGhc: 40.0,
    totalClaimAmountGhc: 75.0,
    status: 'Validated'
  }
];

const INITIAL_NHIS_BATCHES: NHISClaimBatch[] = [
  {
    id: 'batch-1',
    batchNo: 'NHIA-GAR-2026-07-B1',
    monthYear: '2026-07',
    facilityCode: 'GAR-RIDGE-01',
    claimCount: 1420,
    totalAmountGhc: 184500.0,
    status: 'Exported CLAIM-it',
    createdDate: '2026-07-31'
  }
];

const INITIAL_INVENTORY: InventoryStoreItem[] = [
  { id: 'inv-st-1', itemCode: 'MED-AML-10', itemName: 'Amlodipine 10mg Tabs', category: 'Pharmaceutical', storeLocation: 'OPD Pharmacy', batchNo: 'BN-AML-2025-09', expiryDate: '2027-08-31', quantityOnHand: 450, reorderPoint: 100, unitCostGhc: 1.2, status: 'In Stock' },
  { id: 'inv-st-2', itemCode: 'LAB-REAG-FBC', itemName: 'Sysmex FBC Lyse Reagent 5L', category: 'Lab Reagent', storeLocation: 'Lab Store', batchNo: 'SYS-2026-01', expiryDate: '2026-09-30', quantityOnHand: 4, reorderPoint: 5, unitCostGhc: 850.0, status: 'Low Stock' },
  { id: 'inv-st-3', itemCode: 'CON-SYR-5ML', itemName: 'Disposable Syringes 5ml (Box 100)', category: 'Medical Consumable', storeLocation: 'Central Store', batchNo: 'BN-SYR-901', expiryDate: '2028-05-31', quantityOnHand: 120, reorderPoint: 30, unitCostGhc: 45.0, status: 'In Stock' }
];

const INITIAL_DHIMS: DHIMSReportSummary = {
  monthYear: '2026-07',
  totalOpdAttendance: 3420,
  opdUnder5Male: 280,
  opdUnder5Female: 310,
  opdAbove5Male: 1350,
  opdAbove5Female: 1480,
  topDiagnoses: [
    { disease: 'Malaria (Uncomplicated)', cases: 820 },
    { disease: 'Essential Hypertension', cases: 640 },
    { disease: 'Upper Respiratory Tract Infection', cases: 490 },
    { disease: 'Type 2 Diabetes Mellitus', cases: 310 },
    { disease: 'Gastroenteritis', cases: 215 }
  ],
  totalAdmissions: 245,
  totalDischarges: 230,
  totalDeaths: 4,
  maternalDeliveries: 92,
  nhisClaimsSubmittedGhc: 184500.0
};

const INITIAL_AUDIT: AuditLogEntry[] = [
  { id: 'aud-1', timestamp: '2026-08-01 08:15:02', userName: 'Nurse Abena Osei', role: 'Nurse', action: 'CREATE_VITAL_SIGNS', patientId: 'pat-1', mrn: 'HG-2026-0001', details: 'Recorded vital signs for Kofi Owusu Ansah. ESI-3 assigned.', ipAddress: '192.168.1.45' },
  { id: 'aud-2', timestamp: '2026-08-01 08:45:18', userName: 'Dr. Kwame Mensah', role: 'Doctor', action: 'CREATE_EMR_ENCOUNTER', patientId: 'pat-1', mrn: 'HG-2026-0001', details: 'Signed OPD consultation note for Kofi Owusu Ansah. ICD-10 I10 assigned.', ipAddress: '192.168.1.12' },
  { id: 'aud-3', timestamp: '2026-08-01 09:55:40', userName: 'Pharm. Kojo Appiah', role: 'Pharmacist', action: 'DISPENSE_MEDICATION', patientId: 'pat-1', mrn: 'HG-2026-0001', details: 'Dispensed 30 tabs Amlodipine 10mg. Batch BN-AML-2025-09 deducted.', ipAddress: '192.168.1.88' }
];

interface HMSContextType {
  facilities: FacilityBranch[];
  staff: StaffCredential[];
  patients: PatientRecord[];
  queues: QueueItem[];
  vitals: VitalSigns[];
  encounters: EMREncounter[];
  beds: InpatientBed[];
  mar: MedicationAdministrationRecord[];
  labOrders: LabOrderRecord[];
  radiologyOrders: RadiologyOrderRecord[];
  pharmacyBatches: PharmacyBatchItem[];
  dispenseRecords: PrescriptionDispenseRecord[];
  invoices: BillingInvoice[];
  nhisClaims: NHISClaimLine[];
  nhisBatches: NHISClaimBatch[];
  inventory: InventoryStoreItem[];
  dhimsReport: DHIMSReportSummary;
  auditLogs: AuditLogEntry[];
  
  // Auth & Session State
  currentUser: any | null;
  isAuthenticated: boolean;
  loginUser: (userData: any) => void;
  logout: () => void;

  // RBAC State & Helpers
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
  canAccessRoute: (routePath: string) => boolean;

  // Multi-Facility State & Switcher
  activeFacilityId: string;
  setActiveFacilityId: (id: string) => void;
  addFacility: (facilityData: Omit<FacilityBranch, 'id' | 'createdDate'>) => FacilityBranch;
  updateFacilityStatus: (id: string, status: FacilityBranch['status']) => void;

  // Actions
  registerPatient: (patient: Omit<PatientRecord, 'id' | 'mrn' | 'registrationDate'>) => PatientRecord;
  addQueueItem: (item: Omit<QueueItem, 'id' | 'waitingMinutes'>) => void;
  updateQueueStatus: (id: string, status: QueueItem['status'], location: string) => void;
  recordVitals: (vital: Omit<VitalSigns, 'id' | 'timestamp'>) => void;
  createEncounter: (encounter: Omit<EMREncounter, 'id' | 'timestamp'>) => void;
  updateBedStatus: (bedId: string, status: InpatientBed['status'], patientId?: string, patientName?: string, mrn?: string) => void;
  recordLabResult: (labOrderId: string, results: LabOrderRecord['results'], techName: string) => void;
  dispenseMedication: (prescriptionId: string, patientId: string, mrn: string, patientName: string, drugName: string, qty: number, batchNo: string, pharmacist: string) => void;
  addAuditLog: (action: string, userName: string, role: string, details: string, mrn?: string, patientId?: string) => void;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

export const HMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');

  // Load session from localStorage on client side mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('hms_user');
      const savedAuth = localStorage.getItem('hms_auth');
      if (savedUser && savedAuth === 'true') {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
        if (parsed.role) {
          setCurrentRole(parsed.role as UserRole);
        }
      }
    } catch (e) {
      console.error('Error restoring HMS session from localStorage:', e);
    }
  }, []);

  // Fetch real PostgreSQL database data on mount across all modules
  useEffect(() => {
    async function loadDatabaseRecords() {
      try {
        const [
          patRes,
          facRes,
          qRes,
          vitRes,
          encRes,
          labRes,
          pharmRes,
          bedRes,
          radRes,
          billRes,
          nhisRes,
          invRes,
          auditRes,
          dispRes
        ] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/facilities'),
          fetch('/api/queues'),
          fetch('/api/vitals'),
          fetch('/api/encounters'),
          fetch('/api/lab-orders'),
          fetch('/api/pharmacy'),
          fetch('/api/beds'),
          fetch('/api/radiology'),
          fetch('/api/billing'),
          fetch('/api/nhis-claims'),
          fetch('/api/inventory'),
          fetch('/api/audit-logs'),
          fetch('/api/pharmacy/dispense')
        ]);

        if (patRes.ok) {
          const d = await patRes.json();
          if (d.data && d.data.length > 0) setPatients(d.data);
        }
        if (facRes.ok) {
          const d = await facRes.json();
          if (d.data && d.data.length > 0) setFacilities(d.data);
        }
        if (qRes.ok) {
          const d = await qRes.json();
          if (d.data && d.data.length > 0) setQueues(d.data);
        }
        if (vitRes.ok) {
          const d = await vitRes.json();
          if (d.data && d.data.length > 0) setVitals(d.data);
        }
        if (encRes.ok) {
          const d = await encRes.json();
          if (d.data && d.data.length > 0) setEncounters(d.data);
        }
        if (labRes.ok) {
          const d = await labRes.json();
          if (d.data && d.data.length > 0) setLabOrders(d.data);
        }
        if (pharmRes.ok) {
          const d = await pharmRes.json();
          if (d.data && d.data.length > 0) setPharmacyBatches(d.data);
        }
        if (bedRes.ok) {
          const d = await bedRes.json();
          if (d.data && d.data.length > 0) setBeds(d.data);
        }
        if (radRes.ok) {
          const d = await radRes.json();
          if (d.data && d.data.length > 0) setRadiologyOrders(d.data);
        }
        if (billRes.ok) {
          const d = await billRes.json();
          if (d.data && d.data.length > 0) setInvoices(d.data);
        }
        if (nhisRes.ok) {
          const d = await nhisRes.json();
          if (d.data && d.data.length > 0) setNhisClaims(d.data);
        }
        if (invRes.ok) {
          const d = await invRes.json();
          if (d.data && d.data.length > 0) setInventory(d.data);
        }
        if (auditRes.ok) {
          const d = await auditRes.json();
          if (d.data && d.data.length > 0) setAuditLogs(d.data);
        }
        if (dispRes.ok) {
          const d = await dispRes.json();
          if (d.data && d.data.length > 0) setDispenseRecords(d.data);
        }
      } catch (err) {
        console.error('Error fetching records from PostgreSQL database:', err);
      }
    }

    loadDatabaseRecords();
  }, []);

  const loginUser = (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    if (userData.role) {
      setCurrentRole(userData.role as UserRole);
    }
    try {
      localStorage.setItem('hms_user', JSON.stringify(userData));
      localStorage.setItem('hms_auth', 'true');
    } catch (e) {
      console.error('Error saving HMS session to localStorage:', e);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('hms_user');
      localStorage.removeItem('hms_auth');
    } catch (e) {
      console.error('Error clearing HMS session from localStorage:', e);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };
  const [activeFacilityId, setActiveFacilityId] = useState<string>('fac-1');
  const [facilities, setFacilities] = useState<FacilityBranch[]>(INITIAL_FACILITIES);

  const addFacility = (facilityData: Omit<FacilityBranch, 'id' | 'createdDate'>): FacilityBranch => {
    const newFacility: FacilityBranch = {
      ...facilityData,
      id: `fac-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setFacilities((prev) => [newFacility, ...prev]);
    addAuditLog(
      'CREATE_FACILITY',
      currentUser?.name || 'Super Admin',
      currentRole,
      `Registered new hospital: ${newFacility.name} (${newFacility.code}) in ${newFacility.region}`
    );

    // Persist facility to PostgreSQL
    fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facilityData)
    }).catch((err) => console.error('Error saving facility to DB:', err));

    return newFacility;
  };

  const updateFacilityStatus = (id: string, status: FacilityBranch['status']) => {
    setFacilities((prev) =>
      prev.map((fac) => (fac.id === id ? { ...fac, status } : fac))
    );
    const target = facilities.find((f) => f.id === id);
    addAuditLog(
      'UPDATE_FACILITY_STATUS',
      currentUser?.name || 'Super Admin',
      currentRole,
      `Changed status for hospital ${target?.name || id} to ${status}`
    );

    // Persist status change to PostgreSQL
    fetch('/api/facilities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, hefraStatus: status === 'Active' ? 'ACTIVE' : (status as string) === 'Pending Renewal' ? 'PENDING_RENEWAL' : 'EXPIRED' })
    }).catch((err) => console.error('Error updating facility status in DB:', err));
  };
  const [staff, setStaff] = useState<StaffCredential[]>(INITIAL_STAFF);
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL_QUEUES);
  const [vitals, setVitals] = useState<VitalSigns[]>(INITIAL_VITALS);
  const [encounters, setEncounters] = useState<EMREncounter[]>(INITIAL_ENCOUNTERS);
  const [beds, setBeds] = useState<InpatientBed[]>(INITIAL_BEDS);
  const [mar, setMar] = useState<MedicationAdministrationRecord[]>(INITIAL_MAR);
  const [labOrders, setLabOrders] = useState<LabOrderRecord[]>(INITIAL_LAB_ORDERS);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrderRecord[]>(INITIAL_RADIOLOGY_ORDERS);
  const [pharmacyBatches, setPharmacyBatches] = useState<PharmacyBatchItem[]>(INITIAL_PHARMACY_BATCHES);
  const [dispenseRecords, setDispenseRecords] = useState<PrescriptionDispenseRecord[]>(INITIAL_DISPENSING);
  const [invoices, setInvoices] = useState<BillingInvoice[]>(INITIAL_INVOICES);
  const [nhisClaims, setNhisClaims] = useState<NHISClaimLine[]>(INITIAL_NHIS_CLAIMS);
  const [nhisBatches, setNhisBatches] = useState<NHISClaimBatch[]>(INITIAL_NHIS_BATCHES);
  const [inventory, setInventory] = useState<InventoryStoreItem[]>(INITIAL_INVENTORY);
  const [dhimsReport, setDhimsReport] = useState<DHIMSReportSummary>(INITIAL_DHIMS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT);

  const hasPermission = (permission: Permission): boolean => {
    const roleDef = ROLE_DEFINITIONS[currentRole];
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission);
  };

  const canAccessRoute = (routePath: string): boolean => {
    const roleDef = ROLE_DEFINITIONS[currentRole];
    if (!roleDef) return false;
    return roleDef.allowedRoutes.some((allowed) => {
      if (allowed === '/') return routePath === '/' || routePath === '';
      return routePath.startsWith(allowed);
    });
  };

  const addAuditLog = (action: string, userName: string, role: string, details: string, mrn?: string, patientId?: string) => {
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName,
      role,
      action,
      patientId,
      mrn,
      details,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Persist audit log to PostgreSQL
    fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.id, userName, role, action, patientId, mrn, details })
    }).catch((err) => console.error('Error saving audit log to DB:', err));
  };

  const registerPatient = (patientData: Omit<PatientRecord, 'id' | 'mrn' | 'registrationDate'>) => {
    const nextMrnNo = patients.length + 1;
    const mrn = `HG-2026-${String(nextMrnNo).padStart(4, '0')}`;
    const newPatient: PatientRecord = {
      ...patientData,
      id: `pat-${Date.now()}`,
      mrn,
      facilityId: patientData.facilityId || activeFacilityId || 'fac-1',
      registrationDate: new Date().toISOString().split('T')[0]
    };
    setPatients((prev) => [newPatient, ...prev]);
    
    addAuditLog('REGISTER_PATIENT', 'Records Officer', 'Records Officer', `Registered new patient ${newPatient.fullName} (${mrn}) at Hospital ${newPatient.facilityId}`, mrn, newPatient.id);
    
    // Automatically add to Triage Queue
    const newQueue: QueueItem = {
      id: `q-${Date.now()}`,
      patientId: newPatient.id,
      mrn: newPatient.mrn,
      patientName: newPatient.fullName,
      patientCategory: newPatient.patientCategory,
      department: 'Triage',
      servicePoint: 'Triage Station 1',
      queueNumber: `TRG-${String(queues.length + 1).padStart(3, '0')}`,
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waitingMinutes: 0,
      priority: 'Normal',
      status: 'Waiting',
      currentLocation: 'Triage Waiting Bay'
    };
    setQueues((prev) => [newQueue, ...prev]);

    // Persist patient to PostgreSQL database with facilityId tag
    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patientData, facilityId: newPatient.facilityId })
    }).catch((err) => console.error('Error saving patient to database:', err));

    return newPatient;
  };

  const addQueueItem = (item: Omit<QueueItem, 'id' | 'waitingMinutes'>) => {
    const newItem: QueueItem = {
      ...item,
      id: `q-${Date.now()}`,
      waitingMinutes: 0
    };
    setQueues((prev) => [newItem, ...prev]);

    // Persist queue to PostgreSQL database
    fetch('/api/queues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch((err) => console.error('Error saving queue to database:', err));
  };

  const updateQueueStatus = (id: string, status: QueueItem['status'], location: string) => {
    setQueues((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status, currentLocation: location } : q))
    );

    // Persist queue update to PostgreSQL
    fetch('/api/queues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: (status as string) === 'In Consultation' || (status as string) === 'In-Consultation' ? 'IN_CONSULTATION' : status === 'Completed' ? 'COMPLETED' : status === 'Transferred' ? 'TRANSFERRED' : 'WAITING', currentLocation: location })
    }).catch((err) => console.error('Error updating queue status in DB:', err));
  };

  const recordVitals = (vitalData: Omit<VitalSigns, 'id' | 'timestamp'>) => {
    const newVital: VitalSigns = {
      ...vitalData,
      id: `vit-${Date.now()}`,
      timestamp: new Date().toLocaleString()
    };
    setVitals((prev) => [newVital, ...prev]);
    addAuditLog('RECORD_VITALS', vitalData.recordedBy, 'Nurse', `Recorded vitals for patient ID ${vitalData.patientId}. BP: ${vitalData.systolicBp}/${vitalData.diastolicBp}`);

    // Persist vitals to PostgreSQL database
    fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitalData)
    }).catch((err) => console.error('Error saving vitals to database:', err));
  };

  const createEncounter = (encounterData: Omit<EMREncounter, 'id' | 'timestamp'>) => {
    const newEncounter: EMREncounter = {
      ...encounterData,
      id: `enc-${Date.now()}`,
      timestamp: new Date().toLocaleString()
    };
    setEncounters((prev) => [newEncounter, ...prev]);
    addAuditLog('CREATE_ENCOUNTER', encounterData.clinicianName, 'Doctor', `Created OPD clinical consultation note for ${encounterData.patientName} (${encounterData.mrn})`, encounterData.mrn, encounterData.patientId);

    // Persist encounter to PostgreSQL database
    fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encounterData)
    }).catch((err) => console.error('Error saving encounter to database:', err));

    // Single Clinical Action Integration: Process Orders automatically into Lab, Pharmacy, and Billing!
    encounterData.orders.forEach((order) => {
      if (order.type === 'Laboratory') {
        const newLab: LabOrderRecord = {
          id: `lab-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          orderId: order.id,
          patientId: encounterData.patientId,
          mrn: encounterData.mrn,
          patientName: encounterData.patientName,
          testName: order.description,
          testCategory: 'General Pathology',
          specimenType: 'Blood / Plasma',
          specimenBarcode: `BC-${Math.floor(1000000 + Math.random() * 9000000)}`,
          status: 'Ordered',
          results: []
        };
        setLabOrders((prev) => [newLab, ...prev]);

        // Persist lab order to PostgreSQL
        fetch('/api/lab-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: encounterData.patientId,
            mrn: encounterData.mrn,
            patientName: encounterData.patientName,
            testName: order.description,
            orderedBy: encounterData.clinicianName
          })
        }).catch((err) => console.error('Error saving lab order to DB:', err));
      }

      // Automatically create Bill Charge line
      const pat = patients.find(p => p.id === encounterData.patientId);
      const isNhis = pat?.patientCategory === 'NHIS';
      
      const newInvoice: BillingInvoice = {
        id: `inv-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        patientId: encounterData.patientId,
        mrn: encounterData.mrn,
        patientName: encounterData.patientName,
        patientCategory: pat?.patientCategory || 'Cash',
        lineItems: [
          {
            description: order.description,
            category: order.type === 'Laboratory' ? 'Lab' : order.type === 'Prescription' ? 'Pharmacy' : 'Procedure',
            amountGhc: order.costGhc,
            nhisCoveredGhc: isNhis && order.nhisCovered ? order.costGhc : 0,
            patientPayableGhc: isNhis && order.nhisCovered ? 0 : order.costGhc
          }
        ],
        totalAmountGhc: order.costGhc,
        totalNhisCoveredGhc: isNhis && order.nhisCovered ? order.costGhc : 0,
        totalPatientPayableGhc: isNhis && order.nhisCovered ? 0 : order.costGhc,
        amountPaidGhc: isNhis && order.nhisCovered ? order.costGhc : 0,
        balanceDueGhc: isNhis && order.nhisCovered ? 0 : order.costGhc,
        paymentStatus: isNhis && order.nhisCovered ? 'Paid' : 'Unpaid',
        paymentMethod: isNhis && order.nhisCovered ? 'NHIS Claim' : undefined,
        timestamp: new Date().toLocaleString()
      };
      setInvoices((prev) => [newInvoice, ...prev]);

      // Persist billing invoice to PostgreSQL
      fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: encounterData.patientId,
          mrn: encounterData.mrn,
          patientName: encounterData.patientName,
          patientCategory: pat?.patientCategory || 'CASH',
          subtotalGhc: order.costGhc,
          totalAmountGhc: order.costGhc,
          paidAmountGhc: isNhis && order.nhisCovered ? order.costGhc : 0,
          balanceGhc: isNhis && order.nhisCovered ? 0 : order.costGhc,
          status: isNhis && order.nhisCovered ? 'Paid' : 'Unpaid',
          paymentMethod: isNhis && order.nhisCovered ? 'NHIS Claim' : null,
          lineItems: newInvoice.lineItems
        })
      }).catch((err) => console.error('Error saving invoice to DB:', err));

      // If NHIS, prep NHIS Claim Line
      if (isNhis && pat?.nhisNumber) {
        const claimLine: NHISClaimLine = {
          id: `clm-${Date.now()}`,
          claimId: `CLM-${Date.now().toString().slice(-5)}`,
          patientId: pat.id,
          mrn: pat.mrn,
          nhisNumber: pat.nhisNumber,
          attendanceDate: new Date().toISOString().split('T')[0],
          verificationRef: `VER-NHIA-${Math.floor(10000 + Math.random()*90000)}`,
          diagnosisCode: encounterData.icdDiagnoses[0]?.code || 'Z00.0',
          diagnosisName: encounterData.icdDiagnoses[0]?.name || 'General Examination',
          tariffServiceCode: order.code,
          tariffServiceAmountGhc: order.costGhc,
          tariffMedicineCode: order.type === 'Prescription' ? order.code : 'N/A',
          tariffMedicineAmountGhc: order.type === 'Prescription' ? order.costGhc : 0,
          totalClaimAmountGhc: order.costGhc,
          status: 'Validated'
        };
        setNhisClaims((prev) => [claimLine, ...prev]);

        // Persist NHIS claim line to PostgreSQL
        fetch('/api/nhis-claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: pat.id,
            mrn: pat.mrn,
            patientName: pat.fullName,
            nhisNumber: pat.nhisNumber,
            icdCode: claimLine.diagnosisCode,
            icdDescription: claimLine.diagnosisName,
            gdrgCode: claimLine.tariffServiceCode,
            gdrgTariffGhc: order.costGhc,
            totalClaimGhc: order.costGhc
          })
        }).catch((err) => console.error('Error saving NHIS claim to DB:', err));
      }
    });
  };

  const updateBedStatus = (bedId: string, status: InpatientBed['status'], patientId?: string, patientName?: string, mrn?: string) => {
    setBeds((prev) =>
      prev.map((bed) => {
        if (bed.id === bedId) {
          return {
            ...bed,
            status,
            currentPatientId: patientId,
            currentPatientName: patientName,
            currentMrn: mrn,
            admissionDate: patientId ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return bed;
      })
    );
    addAuditLog('UPDATE_BED_STATUS', 'Ward Nurse', 'Nurse', `Updated Bed ${bedId} status to ${status}. Patient: ${patientName || 'None'}`);

    // Persist bed status update to PostgreSQL
    fetch('/api/beds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bedId, status, currentPatientId: patientId, patientName, mrn })
    }).catch((err) => console.error('Error updating bed status in DB:', err));
  };

  const recordLabResult = (labOrderId: string, results: LabOrderRecord['results'], techName: string) => {
    setLabOrders((prev) =>
      prev.map((order) => {
        if (order.id === labOrderId) {
          const hasCritical = results.some(r => r.isCritical);
          return {
            ...order,
            status: 'Verified',
            results,
            verifiedBy: techName,
            verificationTimestamp: new Date().toLocaleString(),
            criticalAlertAcknowledged: !hasCritical
          };
        }
        return order;
      })
    );
    addAuditLog('VERIFY_LAB_RESULT', techName, 'Lab Scientist', `Verified lab results for order ${labOrderId}`);

    // Persist lab result verification to PostgreSQL
    fetch('/api/lab-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: labOrderId, status: 'Verified', results, verifiedByName: techName })
    }).catch((err) => console.error('Error updating lab order in DB:', err));
  };

  const dispenseMedication = (
    prescriptionId: string,
    patientId: string,
    mrn: string,
    patientName: string,
    drugName: string,
    qty: number,
    batchNo: string,
    pharmacist: string
  ) => {
    // Deduct stock FEFO
    setPharmacyBatches((prev) =>
      prev.map((batch) => {
        if (batch.batchNumber === batchNo) {
          return { ...batch, quantityInStock: Math.max(0, batch.quantityInStock - qty) };
        }
        return batch;
      })
    );

    const dispenseRec: PrescriptionDispenseRecord = {
      id: `disp-${Date.now()}`,
      prescriptionId,
      patientId,
      mrn,
      patientName,
      drugName,
      dosageInstructions: 'Dispensed per clinician orders',
      quantityPrescribed: qty,
      quantityDispensed: qty,
      batchNumber: batchNo,
      dispensedBy: pharmacist,
      dispenseTimestamp: new Date().toLocaleString(),
      status: 'Dispensed',
      counselingNotes: 'Patient advised on dosage timing and compliance.'
    };
    setDispenseRecords((prev) => [dispenseRec, ...prev]);

    addAuditLog('DISPENSE_MEDICATION', pharmacist, 'Pharmacist', `Dispensed ${qty} units of ${drugName} (Batch: ${batchNo}) for ${patientName}`, mrn, patientId);

    // Persist medication dispense & stock deduction to PostgreSQL
    fetch('/api/pharmacy/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prescriptionId,
        patientId,
        mrn,
        patientName,
        drugName,
        quantityPrescribed: qty,
        quantityDispensed: qty,
        batchNumber: batchNo,
        dispensedByName: pharmacist
      })
    }).catch((err) => console.error('Error saving dispense record to DB:', err));
  };

  return (
    <HMSContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loginUser,
        logout,
        currentRole,
        setCurrentRole,
        hasPermission,
        canAccessRoute,
        activeFacilityId,
        setActiveFacilityId,
        addFacility,
        updateFacilityStatus,
        facilities,
        staff,
        patients,
        queues,
        vitals,
        encounters,
        beds,
        mar,
        labOrders,
        radiologyOrders,
        pharmacyBatches,
        dispenseRecords,
        invoices,
        nhisClaims,
        nhisBatches,
        inventory,
        dhimsReport,
        auditLogs,
        registerPatient,
        addQueueItem,
        updateQueueStatus,
        recordVitals,
        createEncounter,
        updateBedStatus,
        recordLabResult,
        dispenseMedication,
        addAuditLog
      }}
    >
      {children}
    </HMSContext.Provider>
  );
};

export const useHMS = () => {
  const context = useContext(HMSContext);
  if (!context) {
    throw new Error('useHMS must be used within an HMSProvider');
  }
  return context;
};
