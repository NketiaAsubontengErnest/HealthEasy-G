import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  console.log('🌱 Seeding PostgreSQL HealthEasy-G database across all tables...');

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  // 1. Seed Facilities
  const facilities = [
    {
      name: 'HealthEasy-G Ridge Regional Hospital',
      code: 'GAR-RIDGE-01',
      hefraLicenseNo: 'HEFRA-GAR-2025-0842',
      hefraExpiryDate: '2026-11-30',
      hefraStatus: 'ACTIVE' as const,
      location: 'Castle Road, Ridge, Accra',
      gpsAddress: 'GA-029-3829',
      phone: '+233 30 222 8311',
      email: 'info@ridgehms.gh'
    },
    {
      name: 'HealthEasy-G Kumasi South Annex',
      code: 'ASH-KUMASI-02',
      hefraLicenseNo: 'HEFRA-ASH-2024-0119',
      hefraExpiryDate: '2026-09-15',
      hefraStatus: 'ACTIVE' as const,
      location: 'Atonsu Agogo, Kumasi',
      gpsAddress: 'AK-192-0041',
      phone: '+233 32 206 1420',
      email: 'kumasi@ridgehms.gh'
    },
    {
      name: 'HealthEasy-G Tamale Teaching Annex',
      code: 'NR-TAMALE-03',
      hefraLicenseNo: 'HEFRA-NR-2025-0401',
      hefraExpiryDate: '2027-02-28',
      hefraStatus: 'ACTIVE' as const,
      location: 'Hospital Road, Tamale',
      gpsAddress: 'NT-011-8890',
      phone: '+233 37 202 2411',
      email: 'tamale@ridgehms.gh'
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

  for (const user of usersData) {
    await prisma.userStaff.upsert({
      where: { staffId: user.staffId },
      update: { role: user.role, passwordHash: user.passwordHash },
      create: user
    });
  }
  console.log(`✅ Seeded 20 User Staff Credentials`);

  // 3. Seed Patients
  const patientsData = [
    {
      mrn: 'HG-2026-0001',
      fullName: 'Kofi Owusu Ansah',
      dob: '1985-04-12',
      gender: 'Male',
      phone: '+233 24 412 3456',
      ghanaCardNo: 'GHA-721098412-4',
      nhisNumber: '39482019',
      nhisStatus: 'Active',
      nhisExpiry: '2027-03-31',
      patientCategory: 'NHIS' as const,
      gpsAddress: 'GA-142-9902',
      residentialAddress: 'House 14, Ring Road Central, Osu, Accra',
      emergencyContact: { name: 'Yaa Ansah', relationship: 'Wife', phone: '+233 20 811 2233' },
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Hypertension'],
      bloodGroup: 'O+',
      registrationDate: '2026-01-10'
    },
    {
      mrn: 'HG-2026-0002',
      fullName: 'Ama Serwaa Akoto',
      dob: '1992-09-25',
      gender: 'Female',
      phone: '+233 55 901 8877',
      ghanaCardNo: 'GHA-009218471-1',
      nhisNumber: '88201942',
      nhisStatus: 'Active',
      nhisExpiry: '2026-12-15',
      patientCategory: 'NHIS' as const,
      gpsAddress: 'GA-088-1200',
      residentialAddress: 'Flat 4B, Cantonments, Accra',
      emergencyContact: { name: 'Dr. Kwame Akoto', relationship: 'Brother', phone: '+233 24 300 1122' },
      allergies: [],
      chronicConditions: ['Asthma'],
      bloodGroup: 'A+',
      registrationDate: '2026-02-14'
    },
    {
      mrn: 'HG-2026-0003',
      fullName: 'Yaw Addo-Danquah',
      dob: '1978-11-03',
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
      registrationDate: '2026-03-01'
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
    { bedNumber: 'Bed MS-01', wardName: 'Male Surgical Ward', bedType: 'General', status: 'OCCUPIED' as const, patientName: 'Yaw Addo-Danquah', mrn: 'HG-2026-0003', admissionDate: '2026-07-29', assignedNurse: 'Nurse Abena Osei', dailyRateGhc: 120.0 },
    { bedNumber: 'Bed MS-02', wardName: 'Male Surgical Ward', bedType: 'General', status: 'AVAILABLE' as const, dailyRateGhc: 120.0 },
    { bedNumber: 'Bed FM-01', wardName: 'Female Medical Ward', bedType: 'General', status: 'CLEANING' as const, dailyRateGhc: 110.0 },
    { bedNumber: 'Bed MAT-01', wardName: 'Maternity Ward', bedType: 'Maternity', status: 'AVAILABLE' as const, dailyRateGhc: 150.0 },
    { bedNumber: 'ICU Bed 01', wardName: 'Intensive Care Unit', bedType: 'ICU', status: 'OCCUPIED' as const, patientName: 'Kwabena Agyemang Badu', mrn: 'HG-2026-0005', admissionDate: '2026-08-01', assignedNurse: 'Nurse Comfort Mensah', dailyRateGhc: 500.0 }
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
    { drugCode: 'AML-10', drugName: 'Amlodipine Besylate 10mg', category: 'Cardiovascular', batchNumber: 'BN-AML-2025-09', expiryDate: '2027-08-31', quantityInStock: 450, reorderLevel: 100, unitCostGhc: 1.2, sellingPriceGhc: 1.5, nhisCovered: true, controlledSubstance: false, supplier: 'Tobbinco Pharmaceuticals' },
    { drugCode: 'PAR-500', drugName: 'Paracetamol 500mg', category: 'Analgesics', batchNumber: 'BN-PAR-2026-02', expiryDate: '2028-01-15', quantityInStock: 1200, reorderLevel: 250, unitCostGhc: 0.5, sellingPriceGhc: 0.8, nhisCovered: true, controlledSubstance: false, supplier: 'Earnest Chemists' },
    { drugCode: 'TRM-50', drugName: 'Tramadol HCl 50mg', category: 'Opioid Analgesic', batchNumber: 'BN-TRM-RESTRICTED', expiryDate: '2026-11-20', quantityInStock: 40, reorderLevel: 50, unitCostGhc: 3.5, sellingPriceGhc: 5.0, nhisCovered: false, controlledSubstance: true, supplier: 'FDA Ghana Certified Importer' },
    { drugCode: 'COA-80', drugName: 'Coartem 80/480mg', category: 'Anti-Malarial', batchNumber: 'BN-COA-2026-05', expiryDate: '2027-12-31', quantityInStock: 320, reorderLevel: 80, unitCostGhc: 6.5, sellingPriceGhc: 8.0, nhisCovered: true, controlledSubstance: false, supplier: 'Novartis Ghana' }
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
  const inventoryItems = [
    { itemCode: 'MED-AML-10', itemName: 'Amlodipine 10mg Tabs', category: 'Pharmaceutical', storeLocation: 'OPD Pharmacy', quantity: 450, unit: 'Tabs', unitPriceGhc: 1.2, reorderPoint: 100, supplier: 'Tobbinco Pharmaceuticals', lastRestocked: '2026-07-15' },
    { itemCode: 'LAB-REAG-FBC', itemName: 'Sysmex FBC Lyse Reagent 5L', category: 'Lab Reagent', storeLocation: 'Lab Store', quantity: 4, unit: 'Container', unitPriceGhc: 850.0, reorderPoint: 5, supplier: 'Sysmex Ghana', lastRestocked: '2026-06-20' },
    { itemCode: 'CON-SYR-5ML', itemName: 'Disposable Syringes 5ml (Box 100)', category: 'Medical Consumable', storeLocation: 'Central Medical Stores', quantity: 120, unit: 'Box', unitPriceGhc: 45.0, reorderPoint: 30, supplier: 'M&G Pharmaceuticals', lastRestocked: '2026-07-01' }
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
