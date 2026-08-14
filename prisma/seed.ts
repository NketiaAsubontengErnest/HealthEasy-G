import { LicensingBody, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resolveDatasource } from './resolve-datasource';

// Resolves local-vs-cloud the same way the application does, so running the
// seed directly (`npx tsx prisma/seed.ts`) targets the same database as
// `npm run db:seed` rather than failing on a missing DATABASE_URL.
const prisma = new PrismaClient({
  datasources: { db: { url: resolveDatasource().url } }
});
const DEFAULT_PASSWORD = 'Password123!';

/** Date columns are real DATE values now — midnight UTC keeps them stable
 *  regardless of the timezone the seed happens to run in. */
const d = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  console.log('🌱 Seeding PostgreSQL HealthEasy-G database across all tables...');

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  // 1. Seed Facilities
  const facilities = [
    {
      name: 'HealthEasy-G Ridge Regional Hospital',
      code: 'GAR-RIDGE-01',
      hefraLicenseNo: 'HEFRA-GAR-2025-0842',
      hefraExpiryDate: d('2026-11-30'),
      hefraStatus: 'ACTIVE' as const,
      location: 'Castle Road, Ridge, Accra',
      gpsAddress: 'GA-029-3829',
      phone: '+233 30 222 8311',
      email: 'info@ridgehms.gh',
      region: 'Greater Accra',
      facilityType: 'Regional',
      status: 'Active',
      adminName: 'Dr. Emmanuel Quaye',
      adminEmail: 'director.ridge@ridgehms.gh',
      bedCapacity: 450
    },
    {
      name: 'HealthEasy-G Kumasi South Annex',
      code: 'ASH-KUMASI-02',
      hefraLicenseNo: 'HEFRA-ASH-2024-0119',
      hefraExpiryDate: d('2026-09-15'),
      hefraStatus: 'PENDING_RENEWAL' as const,
      location: 'Atonsu Agogo, Kumasi',
      gpsAddress: 'AK-192-0041',
      phone: '+233 32 206 1420',
      email: 'kumasi@ridgehms.gh',
      region: 'Ashanti',
      facilityType: 'District',
      status: 'Active',
      adminName: 'Dr. Akosua Boakye',
      adminEmail: 'admin.kumasi@ridgehms.gh',
      bedCapacity: 180
    },
    {
      name: 'HealthEasy-G Tamale Teaching Annex',
      code: 'NR-TAMALE-03',
      hefraLicenseNo: 'HEFRA-NR-2025-0401',
      hefraExpiryDate: d('2027-02-28'),
      hefraStatus: 'ACTIVE' as const,
      location: 'Hospital Road, Tamale',
      gpsAddress: 'NT-011-8890',
      phone: '+233 37 202 2411',
      email: 'tamale@ridgehms.gh',
      region: 'Northern',
      facilityType: 'Teaching/Tertiary',
      status: 'Active',
      adminName: 'Dr. Fuseini Haruna',
      adminEmail: 'director.tamale@ridgehms.gh',
      bedCapacity: 600
    }
  ];

  for (const fac of facilities) {
    await prisma.facilityBranch.upsert({
      where: { code: fac.code },
      update: fac,
      create: fac
    });
  }
  console.log('✅ Seeded 3 Facility Branches');

  // 2. Seed 20 Staff Accounts
  //
  // Professional licence details are seeded so the compliance widgets reflect
  // real records rather than a hard-coded list in the browser. NUR-4029 and
  // RAD-6601 expire inside 90 days on purpose, to exercise the "Expiring Soon"
  // path end to end.
  const licences: Record<string, { licenseNumber: string; licensingBody: LicensingBody; licenseExpiry: Date }> = {
    'DOC-9921': { licenseNumber: 'MDC/RN/18492', licensingBody: 'MDC', licenseExpiry: d('2027-01-31') },
    'DIR-0001': { licenseNumber: 'MDC/RN/10022', licensingBody: 'MDC', licenseExpiry: d('2027-05-31') },
    'RAD-0099': { licenseNumber: 'MDC/RN/09281', licensingBody: 'MDC', licenseExpiry: d('2027-10-31') },
    'NUR-4029': { licenseNumber: 'NMC/GR/48201', licensingBody: 'NMC', licenseExpiry: d('2026-09-15') },
    'WRD-4401': { licenseNumber: 'NMC/GR/39011', licensingBody: 'NMC', licenseExpiry: d('2027-03-20') },
    'THR-8812': { licenseNumber: 'NMC/GR/55120', licensingBody: 'NMC', licenseExpiry: d('2027-07-01') },
    'PH-1102': { licenseNumber: 'PC/GAR/9021', licensingBody: 'PHARMACY_COUNCIL', licenseExpiry: d('2027-04-12') },
    'LAB-5510': { licenseNumber: 'AHPC/LS/3920', licensingBody: 'AHPC', licenseExpiry: d('2026-12-01') },
    'RAD-6601': { licenseNumber: 'AHPC/RAD/1029', licensingBody: 'AHPC', licenseExpiry: d('2026-10-15') }
  };

  const usersData = [
    { name: 'System Root Admin', role: 'Super Admin', hierarchyLevel: 1, staffId: 'SYS-0001', email: 'admin@ridgehms.gh', department: 'Executive IT', passwordHash },
    { name: 'Inspector Kofi Mensah', role: 'System Auditor', hierarchyLevel: 2, staffId: 'AUD-9001', email: 'auditor@ridgehms.gh', department: 'Compliance & Audit', passwordHash },
    { name: 'Dr. Kwaku Frempong', role: 'Hospital Director', hierarchyLevel: 2, staffId: 'DIR-0001', email: 'director@ridgehms.gh', department: 'Executive Management', passwordHash },
    { name: 'Mrs. Janet Boateng', role: 'Hospital Admin', hierarchyLevel: 3, staffId: 'ADM-1002', email: 'admin.ops@ridgehms.gh', department: 'Hospital Administration', passwordHash },
    { name: 'Dr. Kwame Mensah', role: 'Doctor', hierarchyLevel: 3, staffId: 'DOC-9921', email: 'kwame.mensah@ridgehms.gh', department: 'OPD Consultation', passwordHash },
    { name: 'Nurse Abena Osei', role: 'Nurse', hierarchyLevel: 3, staffId: 'NUR-4029', email: 'abena.osei@ridgehms.gh', department: 'Triage & OPD', passwordHash },
    { name: 'Pharm. Kojo Appiah', role: 'Pharmacist', hierarchyLevel: 3, staffId: 'PH-1102', email: 'kojo.appiah@ridgehms.gh', department: 'Main Pharmacy', passwordHash },
    { name: 'Ebenezer Boateng', role: 'Laboratory Technician', hierarchyLevel: 3, staffId: 'LAB-5510', email: 'ebenezer.b@ridgehms.gh', department: 'Hematology Lab', passwordHash },
    { name: 'Grace Adjei', role: 'OPD / Medical Records', hierarchyLevel: 3, staffId: 'OPD-8820', email: 'reception@ridgehms.gh', department: 'OPD Front Desk', passwordHash },
    { name: 'Yaw Sarpong', role: 'Cashier', hierarchyLevel: 3, staffId: 'CSH-3301', email: 'cashier@ridgehms.gh', department: 'Revenue & Accounts', passwordHash },
    { name: 'Kwaku Duah', role: 'Claims Officer', hierarchyLevel: 4, staffId: 'CLM-7701', email: 'claims@ridgehms.gh', department: 'NHIS Claims Engine', passwordHash },
    { name: 'Akua Gyasi', role: 'Store Keeper', hierarchyLevel: 4, staffId: 'STR-2201', email: 'stores@ridgehms.gh', department: 'Central Medical Store', passwordHash },
    { name: 'Benjamin Donkor', role: 'Procurement Officer', hierarchyLevel: 4, staffId: 'PRO-1109', email: 'procurement@ridgehms.gh', department: 'Procurement', passwordHash },
    { name: 'Samuel Owusu', role: 'Radiographer', hierarchyLevel: 3, staffId: 'RAD-6601', email: 'radiography@ridgehms.gh', department: 'Imaging Center', passwordHash },
    { name: 'Dr. Elizabeth Tagoe', role: 'Radiologist', hierarchyLevel: 3, staffId: 'RAD-0099', email: 'radiology.doctor@ridgehms.gh', department: 'Imaging Center', passwordHash },
    { name: 'Josephine Agyei', role: 'OPD / Medical Records', hierarchyLevel: 3, staffId: 'REC-5511', email: 'records@ridgehms.gh', department: 'Medical Records', passwordHash },
    { name: 'Sister Mary Ansah', role: 'Ward Manager', hierarchyLevel: 3, staffId: 'WRD-4401', email: 'ward.manager@ridgehms.gh', department: 'Inpatient Wards', passwordHash },
    { name: 'Nurse Comfort Mensah', role: 'Theatre Nurse', hierarchyLevel: 3, staffId: 'THR-8812', email: 'theatre@ridgehms.gh', department: 'Operating Theatre', passwordHash },
    { name: 'Samuel Addo', role: 'Finance Officer', hierarchyLevel: 4, staffId: 'FIN-3390', email: 'finance@ridgehms.gh', department: 'Finance & Accounting', passwordHash },
    { name: 'Patricia Ofori', role: 'HR Officer', hierarchyLevel: 4, staffId: 'HR-1005', email: 'hr@ridgehms.gh', department: 'Human Resources', passwordHash }
  ];

  // Reporting lines mirror the published hierarchy in ROLE_DEFINITIONS.
  const reportsToByLevel: Record<number, string | null> = {
    1: null,
    2: 'SYS-0001',
    3: 'DIR-0001',
    4: 'ADM-1002'
  };

  for (const user of usersData) {
    const record = {
      ...user,
      ...(licences[user.staffId] ?? {}),
      reportsTo: reportsToByLevel[user.hierarchyLevel] ?? null
    };

    await prisma.userStaff.upsert({
      where: { staffId: user.staffId },
      // Re-seeding must not silently downgrade a role or reset a password that
      // was changed after go-live, so only these managed fields are refreshed.
      update: {
        role: record.role,
        passwordHash: record.passwordHash,
        licenseNumber: record.licenseNumber,
        licensingBody: record.licensingBody,
        licenseExpiry: record.licenseExpiry,
        reportsTo: record.reportsTo
      },
      create: record
    });
  }
  console.log(`✅ Seeded ${usersData.length} User Staff Credentials`);

  // 3. Seed Patients
  const patientsData = [
    {
      mrn: 'HG-2026-0001',
      fullName: 'Kofi Owusu Ansah',
      dob: d('1985-04-12'),
      gender: 'Male',
      phone: '+233 24 412 3456',
      ghanaCardNo: 'GHA-721098412-4',
      nhisNumber: '39482019',
      nhisStatus: 'Active',
      nhisExpiry: d('2027-03-31'),
      patientCategory: 'NHIS' as const,
      gpsAddress: 'GA-142-9902',
      residentialAddress: 'House 14, Ring Road Central, Osu, Accra',
      emergencyContact: { name: 'Yaa Ansah', relationship: 'Wife', phone: '+233 20 811 2233' },
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Hypertension'],
      bloodGroup: 'O+',
      registrationDate: d('2026-01-10')
    },
    {
      mrn: 'HG-2026-0002',
      fullName: 'Ama Serwaa Akoto',
      dob: d('1992-09-25'),
      gender: 'Female',
      phone: '+233 55 901 8877',
      ghanaCardNo: 'GHA-009218471-1',
      nhisNumber: '88201942',
      nhisStatus: 'Active',
      nhisExpiry: d('2026-12-15'),
      patientCategory: 'NHIS' as const,
      gpsAddress: 'GA-088-1200',
      residentialAddress: 'Flat 4B, Cantonments, Accra',
      emergencyContact: { name: 'Dr. Kwame Akoto', relationship: 'Brother', phone: '+233 24 300 1122' },
      allergies: [],
      chronicConditions: ['Asthma'],
      bloodGroup: 'A+',
      registrationDate: d('2026-02-14')
    },
    {
      mrn: 'HG-2026-0003',
      fullName: 'Yaw Addo-Danquah',
      dob: d('1978-11-03'),
      gender: 'Male',
      phone: '+233 27 765 4321',
      ghanaCardNo: 'GHA-994810293-8',
      patientCategory: 'PRIVATE_INSURANCE' as const,
      gpsAddress: 'GA-301-4455',
      residentialAddress: 'Airport Residential Area, Accra',
      emergencyContact: { name: 'Grace Addo', relationship: 'Sister', phone: '+233 50 111 4455' },
      allergies: ['NSAIDs'],
      chronicConditions: ['Type 2 Diabetes'],
      bloodGroup: 'B+',
      registrationDate: d('2026-03-01')
    },
    {
      mrn: 'HG-2026-0004',
      fullName: 'Adjoa Nyarko',
      dob: d('1999-06-18'),
      gender: 'Female',
      phone: '+233 26 330 7788',
      ghanaCardNo: 'GHA-556201883-2',
      nhisNumber: '55120934',
      nhisStatus: 'Expired',
      nhisExpiry: d('2026-05-31'),
      patientCategory: 'CASH' as const,
      gpsAddress: 'GA-217-8811',
      residentialAddress: 'Madina Estates, Accra',
      emergencyContact: { name: 'Kwesi Nyarko', relationship: 'Father', phone: '+233 24 887 6655' },
      allergies: [],
      chronicConditions: [],
      bloodGroup: 'O-',
      registrationDate: d('2026-06-22')
    },
    {
      // Referenced by the ICU bed below — previously the bed pointed at an MRN
      // that had no patient record anywhere in the database.
      mrn: 'HG-2026-0005',
      fullName: 'Kwabena Agyemang Badu',
      dob: d('1962-02-09'),
      gender: 'Male',
      phone: '+233 20 554 9900',
      ghanaCardNo: 'GHA-330219476-5',
      nhisNumber: '77410238',
      nhisStatus: 'Active',
      nhisExpiry: d('2027-01-31'),
      patientCategory: 'NHIS' as const,
      gpsAddress: 'GA-455-2019',
      residentialAddress: 'Dansoman High Street, Accra',
      emergencyContact: { name: 'Akosua Badu', relationship: 'Daughter', phone: '+233 55 220 1188' },
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension', 'Chronic Kidney Disease'],
      bloodGroup: 'AB+',
      registrationDate: d('2026-07-30')
    }
  ];

  for (const pat of patientsData) {
    await prisma.patient.upsert({
      where: { mrn: pat.mrn },
      update: pat,
      create: pat
    });
  }
  console.log('✅ Seeded Patients');

  // 4. Seed Beds
  const bedsData = [
    { bedNumber: 'Bed MS-01', wardName: 'Male Surgical Ward', bedType: 'General', status: 'OCCUPIED' as const, patientName: 'Yaw Addo-Danquah', mrn: 'HG-2026-0003', admissionDate: d('2026-07-29'), assignedNurse: 'Nurse Abena Osei', dailyRateGhc: 120.0 },
    { bedNumber: 'Bed MS-02', wardName: 'Male Surgical Ward', bedType: 'General', status: 'AVAILABLE' as const, dailyRateGhc: 120.0 },
    { bedNumber: 'Bed FM-01', wardName: 'Female Medical Ward', bedType: 'General', status: 'CLEANING' as const, dailyRateGhc: 110.0 },
    { bedNumber: 'Bed MAT-01', wardName: 'Maternity Ward', bedType: 'Maternity', status: 'AVAILABLE' as const, dailyRateGhc: 150.0 },
    { bedNumber: 'ICU Bed 01', wardName: 'Intensive Care Unit', bedType: 'ICU', status: 'OCCUPIED' as const, patientName: 'Kwabena Agyemang Badu', mrn: 'HG-2026-0005', admissionDate: d('2026-08-01'), assignedNurse: 'Nurse Comfort Mensah', dailyRateGhc: 500.0 }
  ];

  for (const bed of bedsData) {
    await prisma.inpatientBed.upsert({
      where: { bedNumber: bed.bedNumber },
      update: bed,
      create: bed
    });
  }
  console.log('✅ Seeded Inpatient Beds');

  // 5. Seed Pharmacy Batches
  const pharmacyBatches = [
    { drugCode: 'AML-10', drugName: 'Amlodipine', brandName: 'Norvasc', dosageForm: 'Tablet', strength: '10mg', category: 'Cardiovascular', batchNumber: 'BN-AML-2025-09', expiryDate: d('2027-08-31'), quantityInStock: 450, reorderLevel: 100, unitCostGhc: 1.2, sellingPriceGhc: 1.5, nhisCovered: true, controlledSubstance: false, supplier: 'Tobbinco Pharmaceuticals' },
    { drugCode: 'PAR-500', drugName: 'Paracetamol', brandName: 'Panadol', dosageForm: 'Tablet', strength: '500mg', category: 'Analgesics', batchNumber: 'BN-PAR-2026-02', expiryDate: d('2028-01-15'), quantityInStock: 1200, reorderLevel: 250, unitCostGhc: 0.5, sellingPriceGhc: 0.8, nhisCovered: true, controlledSubstance: false, supplier: 'Earnest Chemists' },
    { drugCode: 'TRM-50', drugName: 'Tramadol HCl', brandName: 'Tramal', dosageForm: 'Capsule', strength: '50mg', category: 'Opioid Analgesic', batchNumber: 'BN-TRM-RESTRICTED', expiryDate: d('2026-11-20'), quantityInStock: 40, reorderLevel: 50, unitCostGhc: 3.5, sellingPriceGhc: 5.0, nhisCovered: false, controlledSubstance: true, supplier: 'FDA Ghana Certified Importer' },
    { drugCode: 'COA-80', drugName: 'Artemether/Lumefantrine', brandName: 'Coartem', dosageForm: 'Tablet', strength: '80/480mg', category: 'Anti-Malarial', batchNumber: 'BN-COA-2026-05', expiryDate: d('2027-12-31'), quantityInStock: 320, reorderLevel: 80, unitCostGhc: 6.5, sellingPriceGhc: 8.0, nhisCovered: true, controlledSubstance: false, supplier: 'Novartis Ghana' },
    { drugCode: 'MET-500', drugName: 'Metformin', brandName: 'Glucophage', dosageForm: 'Tablet', strength: '500mg', category: 'Antidiabetic', batchNumber: 'BN-MET-2026-03', expiryDate: d('2028-03-31'), quantityInStock: 640, reorderLevel: 150, unitCostGhc: 0.9, sellingPriceGhc: 1.4, nhisCovered: true, controlledSubstance: false, supplier: 'Danadams Pharmaceuticals' },
    { drugCode: 'CEF-1G', drugName: 'Ceftriaxone', brandName: 'Rocephin', dosageForm: 'Injection', strength: '1g', category: 'Antibiotic', batchNumber: 'BN-CEF-2026-01', expiryDate: d('2027-06-30'), quantityInStock: 85, reorderLevel: 40, unitCostGhc: 12.0, sellingPriceGhc: 18.0, nhisCovered: true, controlledSubstance: false, supplier: 'Kinapharma Ltd' }
  ];

  for (const batch of pharmacyBatches) {
    await prisma.pharmacyBatch.upsert({
      where: { batchNumber: batch.batchNumber },
      update: batch,
      create: batch
    });
  }
  console.log('✅ Seeded Pharmacy Stock Batches');

  // 6. Seed Inventory Stores
  // `storeLocation` values must match the union the UI renders, so
  // "Central Medical Stores" becomes "Central Store".
  const inventoryItems = [
    { itemCode: 'MED-AML-10', itemName: 'Amlodipine 10mg Tabs', category: 'Pharmaceutical', storeLocation: 'OPD Pharmacy', batchNo: 'BN-AML-2025-09', expiryDate: d('2027-08-31'), quantity: 450, unit: 'Tabs', unitPriceGhc: 1.2, reorderPoint: 100, supplier: 'Tobbinco Pharmaceuticals', lastRestocked: d('2026-07-15') },
    { itemCode: 'LAB-REAG-FBC', itemName: 'Sysmex FBC Lyse Reagent 5L', category: 'Lab Reagent', storeLocation: 'Lab Store', batchNo: 'SYS-2026-01', expiryDate: d('2026-09-30'), quantity: 4, unit: 'Container', unitPriceGhc: 850.0, reorderPoint: 5, supplier: 'Sysmex Ghana', lastRestocked: d('2026-06-20') },
    { itemCode: 'CON-SYR-5ML', itemName: 'Disposable Syringes 5ml (Box 100)', category: 'Medical Consumable', storeLocation: 'Central Store', batchNo: 'BN-SYR-901', expiryDate: d('2028-05-31'), quantity: 120, unit: 'Box', unitPriceGhc: 45.0, reorderPoint: 30, supplier: 'M&G Pharmaceuticals', lastRestocked: d('2026-07-01') },
    { itemCode: 'CON-GLV-M', itemName: 'Examination Gloves Medium (Box 100)', category: 'Medical Consumable', storeLocation: 'Ward Stock', batchNo: 'BN-GLV-2026-04', expiryDate: d('2029-01-31'), quantity: 18, unit: 'Box', unitPriceGhc: 38.0, reorderPoint: 25, supplier: 'M&G Pharmaceuticals', lastRestocked: d('2026-07-20') },
    { itemCode: 'GEN-PPR-A4', itemName: 'A4 Printing Paper (Ream)', category: 'General Supply', storeLocation: 'Central Store', batchNo: 'N/A', expiryDate: null, quantity: 60, unit: 'Ream', unitPriceGhc: 55.0, reorderPoint: 20, supplier: 'Accra Stationers Ltd', lastRestocked: d('2026-08-02') }
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryStoreItem.upsert({
      where: { itemCode: item.itemCode },
      update: item,
      create: item
    });
  }
  // 7. Seed Laboratory Test Catalogue
  const labCatalogue = [
    { code: 'LAB-FBC', name: 'Full Blood Count (FBC)', category: 'Hematology', specimenType: 'Whole Blood (EDTA)', costGhc: 45.0, nhisCovered: true },
    { code: 'LAB-MAL-RDT', name: 'Malaria RDT / Parasitemia Density', category: 'Parasitology', specimenType: 'Capillary Blood', costGhc: 30.0, nhisCovered: true },
    { code: 'LAB-FBS', name: 'Fasting Blood Glucose (FBS)', category: 'Chemical Pathology', specimenType: 'Fluoride Plasma', costGhc: 25.0, nhisCovered: true },
    { code: 'LAB-LIPID', name: 'Lipid Profile (Cholesterol, HDL, Triglycerides)', category: 'Chemical Pathology', specimenType: 'Serum', costGhc: 75.0, nhisCovered: false },
    { code: 'LAB-RFT', name: 'Renal Function Test / Electrolytes (BUN, Creatinine)', category: 'Chemical Pathology', specimenType: 'Serum', costGhc: 85.0, nhisCovered: true },
    { code: 'LAB-LFT', name: 'Liver Function Test (LFT: ALT, AST, Bilirubin)', category: 'Chemical Pathology', specimenType: 'Serum', costGhc: 90.0, nhisCovered: false },
    { code: 'LAB-WIDAL', name: 'Typhoid Widal / Blood Culture Test', category: 'Microbiology', specimenType: 'Serum / Whole Blood', costGhc: 40.0, nhisCovered: true },
    { code: 'LAB-TB-GX', name: 'Sputum GeneXpert (Tuberculosis Screening)', category: 'Microbiology', specimenType: 'Sputum', costGhc: 60.0, nhisCovered: true },
    { code: 'LAB-URINE', name: 'Urinalysis & Urine Microscopy', category: 'Clinical Chemistry', specimenType: 'Midstream Urine', costGhc: 20.0, nhisCovered: true },
    { code: 'LAB-HEPB', name: 'Hepatitis B Surface Antigen (HBsAg) Screening', category: 'Serology', specimenType: 'Serum', costGhc: 35.0, nhisCovered: true }
  ];

  for (const test of labCatalogue) {
    await prisma.labTestCatalogue.upsert({
      where: { code: test.code },
      update: test,
      create: test
    });
  }
  console.log('✅ Seeded 10 Hospital Laboratory Catalogue Tests');

  // ------------------------------------------------------------------
  // 8. Seed the transactional tables
  //
  // These were all empty, which is why every clinical screen fell back to the
  // fabricated arrays that used to live in HMSContext. Seeding them means the
  // queue, triage, EMR, laboratory, pharmacy, billing and claims modules all
  // render live database rows from a clean install.
  // ------------------------------------------------------------------

  const patientByMrn = Object.fromEntries(
    (await prisma.patient.findMany({ select: { id: true, mrn: true, fullName: true } })).map((p) => [p.mrn, p])
  );

  const staffByStaffId = Object.fromEntries(
    (await prisma.userStaff.findMany({ select: { id: true, staffId: true, name: true } })).map((s) => [s.staffId, s])
  );

  const doctor = staffByStaffId['DOC-9921'];
  const nurse = staffByStaffId['NUR-4029'];
  const labTech = staffByStaffId['LAB-5510'];
  const pharmacist = staffByStaffId['PH-1102'];

  const today = new Date();
  const thisMonth = new Date().toISOString().slice(0, 7);

  // --- Queue -------------------------------------------------------
  const queueSeed = [
    { mrn: 'HG-2026-0001', department: 'OPD Consultation', servicePoint: 'Consultation Room 2', queueNumber: 'OPD-001', status: 'IN_CONSULTATION' as const, priority: 'NORMAL' as const, location: 'Consultation Room 2' },
    { mrn: 'HG-2026-0002', department: 'Triage', servicePoint: 'Triage Station 1', queueNumber: 'TRG-001', status: 'WAITING' as const, priority: 'URGENT' as const, location: 'Triage Waiting Bay' },
    { mrn: 'HG-2026-0004', department: 'Laboratory', servicePoint: 'Phlebotomy Bay', queueNumber: 'LAB-001', status: 'WAITING' as const, priority: 'NORMAL' as const, location: 'Laboratory Reception' }
  ];

  for (const item of queueSeed) {
    const patient = patientByMrn[item.mrn];
    if (!patient) continue;

    const existing = await prisma.queueItem.findFirst({ where: { queueNumber: item.queueNumber } });
    if (existing) continue;

    await prisma.queueItem.create({
      data: {
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        patientCategory: item.mrn === 'HG-2026-0004' ? 'CASH' : 'NHIS',
        department: item.department,
        servicePoint: item.servicePoint,
        queueNumber: item.queueNumber,
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: item.priority,
        status: item.status,
        currentLocation: item.location
      }
    });
  }
  console.log('✅ Seeded patient flow queue');

  // --- Triage vitals -----------------------------------------------
  const vitalsSeed = [
    { mrn: 'HG-2026-0001', systolicBp: 158, diastolicBp: 96, pulseRate: 88, temperature: 36.9, respiratoryRate: 18, oxygenSaturation: 97, weightKg: 82, heightCm: 174, bloodGlucoseMmoles: 6.1, painScore: 2, esiSeverity: 'ESI_3_URGENT' as const, abnormalAlerts: ['Elevated blood pressure'], nursingNotes: 'Known hypertensive. Reports occasional headaches. Compliant with medication.' },
    { mrn: 'HG-2026-0002', systolicBp: 118, diastolicBp: 76, pulseRate: 102, temperature: 38.4, respiratoryRate: 26, oxygenSaturation: 93, weightKg: 61, heightCm: 165, bloodGlucoseMmoles: 5.2, painScore: 4, esiSeverity: 'ESI_2_EMERGENCY' as const, abnormalAlerts: ['Low oxygen saturation', 'Febrile', 'Tachypnoea'], nursingNotes: 'Known asthmatic with audible wheeze. Nebuliser commenced in triage.' },
    { mrn: 'HG-2026-0005', systolicBp: 172, diastolicBp: 104, pulseRate: 64, temperature: 36.4, respiratoryRate: 20, oxygenSaturation: 95, weightKg: 74, heightCm: 170, bloodGlucoseMmoles: 7.8, painScore: 5, esiSeverity: 'ESI_1_RESUSCITATION' as const, abnormalAlerts: ['Elevated blood pressure'], nursingNotes: 'CKD patient admitted to ICU. Strict fluid balance monitoring in place.' }
  ];

  for (const vital of vitalsSeed) {
    const patient = patientByMrn[vital.mrn];
    if (!patient) continue;

    const existing = await prisma.vitalSigns.findFirst({ where: { patientId: patient.id } });
    if (existing) continue;

    const { mrn, ...measurements } = vital;
    await prisma.vitalSigns.create({
      data: {
        ...measurements,
        patientId: patient.id,
        bmi: Number((vital.weightKg / (vital.heightCm / 100) ** 2).toFixed(1)),
        recordedById: nurse?.id ?? null,
        recordedByName: nurse?.name ?? 'Triage Nurse'
      }
    });
  }
  console.log('✅ Seeded triage vital signs');

  // --- EMR encounters ----------------------------------------------
  const encounterSeed = [
    {
      mrn: 'HG-2026-0001',
      chiefComplaint: 'Routine hypertension review with intermittent headaches',
      historyOfIllness: 'Six-month history of essential hypertension. Reports two episodes of occipital headache this week.',
      pastMedicalHistory: 'Essential hypertension diagnosed 2025. No surgical history.',
      physicalExam: 'Alert, oriented. BP 158/96. Heart sounds normal, no murmurs. Chest clear.',
      icdDiagnoses: [{ code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' }],
      treatmentPlan: 'Continue Amlodipine 10mg daily. Renal function and lipid profile requested. Review in four weeks.',
      clinicalNotes: 'Counselled on salt restriction and adherence.'
    },
    {
      mrn: 'HG-2026-0002',
      chiefComplaint: 'Shortness of breath and fever for two days',
      historyOfIllness: 'Progressive breathlessness with audible wheeze, worse at night. Febrile since yesterday.',
      pastMedicalHistory: 'Bronchial asthma since childhood.',
      physicalExam: 'Tachypnoeic, RR 26. SpO2 93% on room air. Widespread expiratory wheeze.',
      icdDiagnoses: [
        { code: 'J45.9', name: 'Asthma, unspecified', category: 'Respiratory' },
        { code: 'B54', name: 'Unspecified malaria', category: 'Infectious Disease' }
      ],
      treatmentPlan: 'Salbutamol nebulisation, oral prednisolone. Malaria RDT and FBC requested.',
      clinicalNotes: 'Advised to return immediately if breathlessness worsens.'
    }
  ];

  for (const encounter of encounterSeed) {
    const patient = patientByMrn[encounter.mrn];
    if (!patient) continue;

    const existing = await prisma.eMREncounter.findFirst({ where: { patientId: patient.id } });
    if (existing) continue;

    const { mrn, ...clinical } = encounter;
    await prisma.eMREncounter.create({
      data: {
        ...clinical,
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        encounterType: 'OPD',
        orders: [],
        sickLeaveDays: 0,
        signed: true,
        signedById: doctor?.id ?? null,
        clinicianName: doctor?.name ?? 'Medical Officer'
      }
    });
  }
  console.log('✅ Seeded EMR consultation notes');

  // --- Laboratory orders -------------------------------------------
  const labSeed = [
    { mrn: 'HG-2026-0001', code: 'LAB-RFT', barcode: 'BC-4410023', status: 'Verified', results: [
      { parameter: 'Creatinine', value: 118, unit: 'umol/L', referenceRange: '62 - 106', isAbnormal: true, isCritical: false },
      { parameter: 'Urea', value: 6.4, unit: 'mmol/L', referenceRange: '2.5 - 7.1', isAbnormal: false, isCritical: false },
      { parameter: 'Potassium', value: 4.3, unit: 'mmol/L', referenceRange: '3.5 - 5.1', isAbnormal: false, isCritical: false }
    ] },
    { mrn: 'HG-2026-0002', code: 'LAB-MAL-RDT', barcode: 'BC-4410024', status: 'In Analysis', results: [] },
    { mrn: 'HG-2026-0002', code: 'LAB-FBC', barcode: 'BC-4410025', status: 'Ordered', results: [] }
  ];

  for (const order of labSeed) {
    const patient = patientByMrn[order.mrn];
    const test = await prisma.labTestCatalogue.findUnique({ where: { code: order.code } });
    if (!patient || !test) continue;

    const isVerified = order.status === 'Verified';
    await prisma.labOrder.upsert({
      where: { barcodeNo: order.barcode },
      update: {},
      create: {
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        testCode: test.code,
        testName: test.name,
        testCategory: test.category,
        specimenType: test.specimenType,
        barcodeNo: order.barcode,
        orderedBy: doctor?.name ?? 'Medical Officer',
        orderTimestamp: new Date().toISOString(),
        status: order.status,
        results: order.results.length ? order.results : undefined,
        technicianName: order.results.length ? labTech?.name : null,
        verifiedById: isVerified ? labTech?.id ?? null : null,
        verifiedByName: isVerified ? labTech?.name ?? null : null,
        verificationTime: isVerified ? new Date().toISOString() : null
      }
    });
  }
  console.log('✅ Seeded laboratory orders and results');

  // --- Radiology ----------------------------------------------------
  const radiologySeed = [
    { mrn: 'HG-2026-0002', accession: 'ACC-2026-00001', studyType: 'X-Ray', bodyPart: 'Chest (PA)', status: 'Report Verified', report: 'Hyperinflated lung fields consistent with obstructive airway disease. No focal consolidation or effusion.' },
    { mrn: 'HG-2026-0005', accession: 'ACC-2026-00002', studyType: 'Ultrasound', bodyPart: 'Renal Tract', status: 'Ordered', report: null }
  ];

  for (const study of radiologySeed) {
    const patient = patientByMrn[study.mrn];
    if (!patient) continue;

    await prisma.radiologyOrder.upsert({
      where: { pacsAccessionNo: study.accession },
      update: {},
      create: {
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        studyType: study.studyType,
        bodyPart: study.bodyPart,
        clinicalHistory: 'Requested from OPD consultation.',
        pregnancyScreened: true,
        orderedBy: doctor?.name ?? 'Medical Officer',
        orderTimestamp: new Date().toISOString(),
        status: study.status,
        pacsAccessionNo: study.accession,
        imageUrls: [],
        reportContent: study.report,
        radiologistName: study.report ? staffByStaffId['RAD-0099']?.name ?? null : null,
        signedTimestamp: study.report ? new Date().toISOString() : null,
        criticalFindings: false
      }
    });
  }
  console.log('✅ Seeded radiology studies');

  // --- Pharmacy dispensing (with matching stock deduction) ----------
  const existingDispense = await prisma.dispenseRecord.findFirst();
  if (!existingDispense && patientByMrn['HG-2026-0001']) {
    const patient = patientByMrn['HG-2026-0001'];

    await prisma.$transaction([
      prisma.dispenseRecord.create({
        data: {
          prescriptionId: 'rx-seed-0001',
          patientId: patient.id,
          mrn: patient.mrn,
          patientName: patient.fullName,
          drugName: 'Amlodipine 10mg',
          dosageInstructions: '1 tablet orally once daily in the morning',
          quantityPrescribed: 30,
          quantityDispensed: 30,
          batchNumber: 'BN-AML-2025-09',
          dispensedById: pharmacist?.id ?? null,
          dispensedByName: pharmacist?.name ?? 'Pharmacist',
          status: 'Dispensed',
          counselingNotes: 'Advised to take at the same time daily and report ankle swelling.'
        }
      }),
      prisma.pharmacyBatch.update({
        where: { batchNumber: 'BN-AML-2025-09' },
        data: { quantityInStock: { decrement: 30 } }
      })
    ]);
    console.log('✅ Seeded pharmacy dispensing record');
  }

  // --- Billing ------------------------------------------------------
  const invoiceSeed = [
    { mrn: 'HG-2026-0001', invoiceNumber: 'INV-2026-00001', category: 'NHIS' as const, lineItems: [
      { description: 'OPD Consultation', category: 'Consultation', amountGhc: 40, nhisCoveredGhc: 40, patientPayableGhc: 0 },
      { description: 'Renal Function Test', category: 'Lab', amountGhc: 85, nhisCoveredGhc: 85, patientPayableGhc: 0 }
    ], paid: 0 },
    { mrn: 'HG-2026-0004', invoiceNumber: 'INV-2026-00002', category: 'CASH' as const, lineItems: [
      { description: 'OPD Consultation', category: 'Consultation', amountGhc: 40, nhisCoveredGhc: 0, patientPayableGhc: 40 },
      { description: 'Urinalysis & Urine Microscopy', category: 'Lab', amountGhc: 20, nhisCoveredGhc: 0, patientPayableGhc: 20 }
    ], paid: 60 }
  ];

  for (const invoice of invoiceSeed) {
    const patient = patientByMrn[invoice.mrn];
    if (!patient) continue;

    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amountGhc, 0);
    const covered = invoice.lineItems.reduce((sum, item) => sum + item.nhisCoveredGhc, 0);
    const balance = Math.max(0, subtotal - covered - invoice.paid);

    await prisma.billingInvoice.upsert({
      where: { invoiceNumber: invoice.invoiceNumber },
      update: {},
      create: {
        invoiceNumber: invoice.invoiceNumber,
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        patientCategory: invoice.category,
        subtotalGhc: subtotal,
        nhisExemptionGhc: covered,
        totalAmountGhc: subtotal,
        paidAmountGhc: invoice.paid,
        balanceGhc: balance,
        status: balance === 0 ? 'Paid' : invoice.paid > 0 ? 'Partial' : 'Unpaid',
        paymentMethod: invoice.paid > 0 ? 'MTN MoMo' : null,
        cashierName: invoice.paid > 0 ? staffByStaffId['CSH-3301']?.name ?? null : null,
        receiptNumber: invoice.paid > 0 ? 'RCP-2026-00002' : null,
        lineItems: invoice.lineItems
      }
    });
  }
  console.log('✅ Seeded billing invoices');

  // --- NHIS claims --------------------------------------------------
  const claimSeed = [
    { mrn: 'HG-2026-0001', claimNumber: 'CLM-2026-00001', icdCode: 'I10', icdDescription: 'Essential (primary) hypertension', gdrgCode: 'MEDI09A', gdrgTariffGhc: 40, medicineCode: 'AML-10', medicineTariffGhc: 45 },
    { mrn: 'HG-2026-0005', claimNumber: 'CLM-2026-00002', icdCode: 'N18.9', icdDescription: 'Chronic kidney disease, unspecified', gdrgCode: 'MEDI22B', gdrgTariffGhc: 320, medicineCode: 'CEF-1G', medicineTariffGhc: 90 }
  ];

  for (const claim of claimSeed) {
    const patient = await prisma.patient.findUnique({ where: { mrn: claim.mrn } });
    if (!patient) continue;

    await prisma.nHISClaimLine.upsert({
      where: { claimNumber: claim.claimNumber },
      update: {},
      create: {
        claimNumber: claim.claimNumber,
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.fullName,
        nhisNumber: patient.nhisNumber ?? 'N/A',
        gender: patient.gender,
        dob: patient.dob,
        attendanceDate: today,
        verificationRef: `VER-NHIA-${10000 + claimSeed.indexOf(claim)}`,
        icdCode: claim.icdCode,
        icdDescription: claim.icdDescription,
        gdrgCode: claim.gdrgCode,
        gdrgTariffGhc: claim.gdrgTariffGhc,
        medicineCode: claim.medicineCode,
        medicineTariffGhc: claim.medicineTariffGhc,
        totalClaimGhc: claim.gdrgTariffGhc + claim.medicineTariffGhc,
        status: 'Validated',
        auditFlags: []
      }
    });
  }
  console.log('✅ Seeded NHIS claim lines');

  // --- Medication administration chart ------------------------------
  const marSeed = [
    { mrn: 'HG-2026-0003', bedNumber: 'Bed MS-01', drugName: 'Inj Ceftriaxone 1g IV', dosage: '1g IV 12 hourly', route: 'Intravenous', dueTime: '08:00', status: 'Administered' },
    { mrn: 'HG-2026-0003', bedNumber: 'Bed MS-01', drugName: 'Tab Paracetamol 1g PO', dosage: '1g PO 8 hourly', route: 'Oral', dueTime: '14:00', status: 'Scheduled' },
    { mrn: 'HG-2026-0005', bedNumber: 'ICU Bed 01', drugName: 'Inj Furosemide 40mg IV', dosage: '40mg IV once daily', route: 'Intravenous', dueTime: '09:00', status: 'Administered' }
  ];

  for (const dose of marSeed) {
    const patient = patientByMrn[dose.mrn];
    if (!patient) continue;

    const existing = await prisma.medicationAdministrationRecord.findFirst({
      where: { patientId: patient.id, drugName: dose.drugName, dueTime: dose.dueTime }
    });
    if (existing) continue;

    const administered = dose.status === 'Administered';
    await prisma.medicationAdministrationRecord.create({
      data: {
        patientId: patient.id,
        patientName: patient.fullName,
        bedNumber: dose.bedNumber,
        drugName: dose.drugName,
        dosage: dose.dosage,
        route: dose.route,
        dueTime: dose.dueTime,
        status: dose.status,
        administeredById: administered ? nurse?.id ?? null : null,
        administeredBy: administered ? nurse?.name ?? null : null,
        administeredTime: administered ? dose.dueTime : null
      }
    });
  }
  console.log('✅ Seeded medication administration chart');

  // --- DHIMS2 manual return -----------------------------------------
  // Only the figures the system cannot derive; everything else on the DHIMS2
  // return is computed live from the clinical tables.
  await prisma.dhimsMonthlyReturn.upsert({
    where: { monthYear: thisMonth },
    update: {},
    create: {
      monthYear: thisMonth,
      facilityCode: 'GAR-RIDGE-01',
      totalDeaths: 0,
      maternalDeliveries: 0,
      totalDischarges: 0,
      submittedBy: null
    }
  });
  console.log('✅ Seeded DHIMS2 monthly return shell');

  console.log('🎉 PostgreSQL database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
