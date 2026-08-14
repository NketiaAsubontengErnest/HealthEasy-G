# HealthEasy-G HMS (Ghana Health Service Standard)

> **Enterprise Hospital Management System (HMS)** tailored for Ghana's healthcare ecosystem, built with Next.js 15 App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM. Fully compliant with **HeFRA**, **GHS**, **NHIS G-DRG**, **DHIMS2 e-Tracker**, and **DPC Ghana Card** standards.

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: Running locally or remotely (configured via `.env`)

### 2. Environment Setup

Create or update `.env` in the root folder:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healtheasy_g?schema=public"
NEXTAUTH_SECRET="healtheasy_g_secret_key_2026"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Migration & Seeding

```bash
# Push schema to PostgreSQL database server
npx prisma db push

# Seed 20 HMS role user accounts & sample data
npx tsx prisma/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** (or **[http://localhost:3000/auth/login](http://localhost:3000/auth/login)**) in your browser.

---

## 🔑 Master User Credentials & Login Details

### **Level 1: System Root Administration**

| Role | Email | Password | Staff ID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@ridgehms.gh` | `Password123!` | `SYS-0001` | Executive IT |

---

### **Level 2: Executive Oversight**

| Role | Email | Password | Staff ID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **System Auditor** | `auditor@ridgehms.gh` | `Password123!` | `AUD-9001` | Compliance & Audit |
| **Hospital Director** | `director@ridgehms.gh` | `Password123!` | `DIR-0001` | Executive Management |

---

### **Level 3: Operations & Clinical Leadership**

| Role | Email | Password | Staff ID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Hospital Admin** | `admin.ops@ridgehms.gh` | `Password123!` | `ADM-1002` | Hospital Administration |
| **Doctor** | `kwame.mensah@ridgehms.gh` | `Password123!` | `DOC-9921` | OPD Consultation |
| **Nurse** | `abena.osei@ridgehms.gh` | `Password123!` | `NUR-4029` | Triage & OPD |
| **Ward Manager** | `ward.manager@ridgehms.gh` | `Password123!` | `WRD-4401` | Inpatient Wards |
| **Theatre Nurse** | `theatre@ridgehms.gh` | `Password123!` | `THR-8812` | Operating Theatre |
| **Pharmacist** | `kojo.appiah@ridgehms.gh` | `Password123!` | `PH-1102` | Main Pharmacy |
| **Laboratory Technician** | `ebenezer.b@ridgehms.gh` | `Password123!` | `LAB-5510` | Hematology Lab |
| **Radiographer** | `radiography@ridgehms.gh` | `Password123!` | `RAD-6601` | Imaging Center |
| **Radiologist** | `radiology.doctor@ridgehms.gh` | `Password123!` | `RAD-0099` | Imaging Center |
| **OPD / Medical Records** | `reception@ridgehms.gh` | `Password123!` | `OPD-8820` | OPD Front Desk |
| **Cashier** | `cashier@ridgehms.gh` | `Password123!` | `CSH-3301` | Revenue & Accounts |

---

### **Level 4: Administrative & Support Officers**

| Role | Email | Password | Staff ID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **HR Officer** | `hr@ridgehms.gh` | `Password123!` | `HR-1005` | Human Resources |
| **Finance Officer** | `finance@ridgehms.gh` | `Password123!` | `FIN-3390` | Finance & Accounting |
| **Claims Officer** | `claims@ridgehms.gh` | `Password123!` | `CLM-7701` | NHIS Claims Engine |
| **Procurement Officer** | `procurement@ridgehms.gh` | `Password123!` | `PRO-1109` | Procurement |
| **Store Keeper** | `stores@ridgehms.gh` | `Password123!` | `STR-2201` | Central Medical Store |

---

## 🌳 Standardized Organizational Hierarchy

```
Super Admin - manage hospitals
│
├── Hospital Director - manage a hospital
│   │
│   ├── Hospital Admin - Manage a hospital
│   │   │
│   │   ├── HR Officer 
│   │   ├── Finance Officer
│   │   ├── Claims Officer
│   │   ├── Procurement Officer
│   │   └── Store Keeper
│   │
│   ├── OPD / Medical Records
│   ├── Cashier
│   ├── Nurse
│   ├── Ward Manager
│   ├── Doctor
│   ├── Laboratory Technician
│   ├── Radiographer
│   ├── Radiologist
│   ├── Pharmacist
│   └── Theatre Nurse
│
└── System Auditor
```

---

## 🏥 Key Feature Modules

1. **Patient Administration & MPI**: Ghana Card (NIA) verification, NHIS card validation, appointment scheduling, and patient routing.
2. **Clinical Care (EMR)**: Triage vitals (GCS, BP, SpO2), ICD-10 coding, clinical consultations, e-Prescriptions, and LIS/PACS ordering.
3. **Inpatient & Wards**: Ward bed management, admission/discharge/transfer (ADT) workflows, fluid charts, and nursing notes.
4. **Diagnostics & Pharmacy**: FEFO inventory tracking, drug interaction checks, lab sample tracking, and PACS radiology image upload.
5. **Billing & Insurance**: Cashier shift management, MoMo/Cash payments, NHIS G-DRG claims processing, and CLAIM-it batch exports.
6. **Governance & Compliance**: HeFRA facility licensing audit, DHIMS2 e-Tracker exports, and immutable DPC security audit logs.
