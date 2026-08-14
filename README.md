# HealthEasy-G HMS (Ghana Health Service Standard)

> **Enterprise Hospital Management System (HMS)** tailored for Ghana's healthcare ecosystem, built with Next.js 15 App Router, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM. Fully compliant with **HeFRA**, **GHS**, **NHIS G-DRG**, **DHIMS2 e-Tracker**, and **DPC Ghana Card** standards.

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: a local server, a managed cloud instance, or both

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your own values. The application runs
against **either a local PostgreSQL (offline) or a managed cloud PostgreSQL
(online)** — same schema, same seed, selected by one variable:

```env
DATABASE_TARGET="cloud"          # or "local"

DATABASE_URL_LOCAL="postgresql://postgres:postgres@localhost:5432/healtheasy_g?schema=public"
DATABASE_URL_CLOUD="postgresql://user:password@your-host.neon.tech/neondb?sslmode=require"

# Signs staff session cookies. Generate your own:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
SESSION_SECRET="a-long-random-value-of-at-least-32-characters"
```

`.env` is git-ignored — never commit real credentials.

### 3. Create and Seed the Database

```bash
npm install                # generates the Prisma client automatically

npm run db:setup:cloud     # schema + seed on the online database
npm run db:setup:local     # schema + seed on the offline database
```

Run both once and you can then work online or offline by flipping
`DATABASE_TARGET`. Individual steps are also available — `db:push`, `db:seed`,
`db:studio` (each honours `DATABASE_TARGET`), plus `:local` / `:cloud` variants
that override it.

### 4. Run Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you will be redirected
to the login portal. Every page and every API route requires a signed-in staff
session.

### 5. Checks

```bash
npm run typecheck    # TypeScript, no emit
npm test             # session, RBAC policy, adapters, datasource
npm run build        # production build
```

CI runs the same three steps against a throwaway PostgreSQL on every push and
pull request — see `.github/workflows/ci.yml`.

---

## 🔒 Security Model

Authentication and authorisation are enforced **on the server**. The browser is
never trusted to report who it is or what role it holds.

| Layer | File | Responsibility |
| :--- | :--- | :--- |
| Session | `src/lib/session.ts` | HMAC-SHA256 signed token in an `httpOnly` cookie; forged, re-signed or expired tokens are rejected |
| Perimeter | `src/middleware.ts` | Rejects unauthenticated traffic before any page or route handler runs; enforces each role's `allowedRoutes` |
| Policy | `src/lib/api-policy.ts` | Declares who may call each endpoint and method — **fails closed** for anything unlisted |
| Enforcement | `src/lib/api-guard.ts` | `withAuth()` wraps every route handler and applies the policy |

Consequences worth knowing:

- The acting identity on every write — audit entries, vitals, consultation
  notes, dispensing, payments — is taken from the session, never from the
  request body, so records cannot be filed under someone else's name.
- The **DPC constraint on Super Admin is enforced, not merely documented**: the
  system administrator cannot read `/api/patients`, `/api/vitals` or
  `/api/encounters`. Executive dashboards read `/api/stats`, which returns
  aggregate counts containing no patient identifiers.
- Changing the role displayed in the browser grants nothing; the server reads
  the role from the signed cookie.

---

## 🗄️ Where the Data Comes From

Every clinical, financial and administrative screen reads live PostgreSQL rows
through the API. There is **no fallback sample data in the application** — if a
table is empty, the screen shows an empty state rather than fabricated records.

`src/lib/adapters.ts` is the single translation point between Prisma rows and
the client-facing types, so storage-oriented names and `SCREAMING_SNAKE` enums
(`IN_CONSULTATION`, `bedType`, `totalClaimGhc`) become what the UI renders
(`In Consultation`, `type`, `totalClaimAmountGhc`).

DHIMS2 figures are **computed live** from encounters, patients, admissions and
claims. Only the two figures the system has no other source for — deaths and
maternal deliveries — are entered by the records officer and stored in
`DhimsMonthlyReturn`, exactly as on the paper return.

Dates are real `DATE` and `TIMESTAMP` columns. They were previously stored as
text, which made every comparison lexical — `"2026-9-1"` sorted after
`"2026-10-01"`, and an empty string was indistinguishable from a real value.
`prisma/migrations/001-dates-to-timestamps.sql` converts existing rows in
place; `parseDate`/`formatDate` in `src/lib/adapters.ts` are the only places
the conversion to and from the UI's `YYYY-MM-DD` happens.

---

## 🎨 Appearance

**Light is the default theme** across the public site and the staff portal.
Users can switch to dark from the toggle in the dashboard header or the public
site's navigation; the choice is stored under `hms_theme` and shared by both.

A small blocking script in `src/app/layout.tsx` applies the saved theme before
the first paint, so dark-mode users never see a flash of light content on
navigation.

The public site uses Newsreader for display headings against Manrope for text,
and its scroll animations are driven by `src/app/components/home/Reveal.tsx` —
which honours `prefers-reduced-motion` and falls back to showing content if the
IntersectionObserver never fires.

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
