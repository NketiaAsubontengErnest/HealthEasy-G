---
title: "User Manual and System Administration Guide"
subtitle: "HealthEasy-G Hospital Management System"
author: "Group: Architects — CSCD602 Advance Software Development, University of Ghana"
date: "August 2026"
---

# User Manual and System Administration Guide

**Project:** HealthEasy — HealthEasy-G Hospital Management System
**Group:** Architects
**Live system:** <https://healtheasy-g.vercel.app>
**Document version:** 1.0

---

# Part I — Getting Started

# 1. What This System Is For

HealthEasy-G keeps one record per patient and carries it through every department of the
hospital. When the front desk registers a patient, the triage nurse sees them. When the
doctor orders a test, the laboratory sees the request and the cashier sees the charge. Nobody
retypes a name, and nobody has to find a paper folder.

Your view of the system depends on the role your account holds. A nurse sees triage and
wards; a cashier sees billing. This is deliberate — you see the work that is yours.

# 2. Signing In

1. Open <https://healtheasy-g.vercel.app> in a web browser.
2. Select **Staff sign in** at the top right.
3. Enter your hospital email address and password.
4. Select **Sign In to Hospital Portal**.

You will arrive at the dashboard for your role.

**If sign-in fails.** The message *"Invalid user credentials"* means the email address or the
password is wrong. It appears for both, deliberately, so that nobody can discover which
addresses are registered. If you see *"This staff account is not active"*, contact HR — your
account has been suspended. After ten failed attempts the system pauses sign-in from your
location for fifteen minutes.

**If you are redirected to sign-in unexpectedly**, your session has expired. Sessions last one
eight-hour shift. Sign in again.

# 3. Finding Your Way Around

| Area | Where | What it does |
| :--- | :--- | :--- |
| Sidebar | Left | Lists only the modules your role may open |
| Facility selector | Top | Shows which hospital branch you are working in |
| Search | Top | Finds patients by name or MRN |
| Role badge | Top right | Shows the role your account holds |
| Theme toggle | Top right (☾ / ☀) | Switches between light and dark; your choice is remembered |
| Notifications | Top right | Alerts needing attention |
| Profile | Top right | Your details and **Sign out** |

# 4. Two Things That Are Not Faults

**Some modules are missing from your sidebar.** You only see what your role may use. If you
need a module that is not there, your role does not have that authority — speak to your
supervisor rather than trying another route.

**A red "Access Denied" screen.** If you reach a page your role may not open, the system
explains which role you hold and which authority is missing. This is the system protecting
patient data, not a malfunction.

---

# Part II — Working by Role

# 5. OPD / Medical Records Officer

## 5.1 Registering a New Patient

1. Open **Patient Registration**.
2. Select **Register New Patient**.
3. Complete the form:
   - **Full name, date of birth, gender, telephone** — required.
   - **Ghana Card number** — required. This is how the system knows one patient from another.
   - **NHIS number, status and expiry** — if the patient is insured.
   - **Patient category** — Cash, NHIS, Corporate, Private Insurance or Exempted.
   - **Digital (GPS) address and residential address.**
   - **Next of kin** — name, relationship and telephone.
   - **Allergies and chronic conditions** — separate multiple entries with commas. Take care
     here: this is what warns a prescriber later.
   - **Blood group.**
4. Select **Register Patient**.

The system allocates a Medical Record Number (for example `HG-2026-0006`) and places the
patient in the triage queue automatically.

> **If the Ghana Card is already registered**, the system refuses and tells you who holds it
> and under which MRN. Do not create a second record. Retrieve the existing one. Two folders
> for one person is the problem this system exists to prevent.

## 5.2 Finding an Existing Patient

Open **Patient Registration** and type a name, MRN or Ghana Card number into the search box.
Results filter as you type.

## 5.3 Emergency Registration

For an unconscious or unidentified patient, use the fast-track option on the **Emergency**
screen. It creates a record with a placeholder identifier so that care can begin at once.
Complete the identification later.

## 5.4 Routing a Patient

From **Patient Flow & Queues**, select the patient and choose the destination department. The
system issues a ticket numbered for that department — `TRG-004` for triage, `OPD-012` for
consultation.

# 6. Nurse — Triage and Wards

## 6.1 Recording Observations

1. Open **Triage**.
2. Select the patient from the waiting list.
3. Check the banner: **allergies and chronic conditions are shown before you begin**.
4. Record blood pressure, pulse, temperature, respiratory rate, oxygen saturation, weight,
   height, blood glucose and pain score.
5. Choose the **ESI acuity level**:

   | Level | Meaning | Action |
   | :--- | :--- | :--- |
   | ESI-1 | Resuscitation | Immediate |
   | ESI-2 | Emergency | Within minutes |
   | ESI-3 | Urgent | Standard OPD |
   | ESI-4 | Less urgent | Routine |
   | ESI-5 | Non-urgent | Routine |

6. Add nursing notes.
7. Select **Save and route**.

The system computes the BMI and raises abnormality alerts itself — hypertensive crisis, low
oxygen saturation, fever, tachycardia and others — against Ghana Health Service triage
thresholds. You do not need to work these out; check that they match what you see in front of
you.

Your name is recorded against the observations automatically, from your sign-in. You cannot
record observations in someone else's name.

## 6.2 Ward Duties

**Bed board.** Open **Inpatient, Wards & Beds** to see every bed and its state: Available,
Occupied, Reserved, Cleaning, Maintenance or Isolation.

**Admitting.** Select an available bed and assign the patient. If the bed is already occupied
by someone else, the system refuses and names the current occupant.

**Medication administration.** The chart lists doses due. For each:

- **Administered** — records your name and the time automatically.
- **Omitted** or **Refused** — you must give a reason. The system will not accept a blank one,
  because an unexplained missed dose is the thing an audit will ask about.

# 7. Doctor — Consultation

## 7.1 Conducting a Consultation

1. Open **EMR & Consultation**. Your waiting list appears.
2. Select a patient. Before writing anything, review what is already there:
   - Demographics, **allergies** and chronic conditions
   - The triage observations just recorded, with any alerts
   - Previous encounters, with their diagnoses and plans
   - Any laboratory or imaging results
3. Record presenting complaint, history, past medical history and examination findings.
4. Assign **ICD-10 diagnoses** — one or more.
5. Raise orders as required:
   - **Laboratory** — select from the hospital test catalogue
   - **Radiology** — modality and body part
   - **Prescription** — from pharmacy stock
   - **Admission** — to a ward
   - **Procedure**
6. Record the treatment plan.
7. Issue a sick-leave certificate if needed.
8. Select **Sign and complete**.

Signing does several things at once: the note is filed under your name, each order becomes a
work item in the receiving department, each chargeable item becomes a billing line, and for an
insured patient an NHIS claim line is prepared from the diagnosis you coded. You do not
notify the laboratory, the pharmacy or the cashier separately.

## 7.2 Using the Clinical Assistant

Within the prescription section, select **Suggest medicines**. The assistant reads the
patient's diagnoses, observations, allergies, chronic conditions, recent results and history,
and proposes medicines.

Three things to understand about it:

1. **It can only suggest what the pharmacy actually holds.** Suggestions are filtered against
   live stock.
2. **Allergy conflicts are flagged in red**, and that check is performed by the system
   itself, not taken on the assistant's word.
3. **It is advice, not a prescription.** Nothing is prescribed until you prescribe it. The
   decision and the responsibility remain yours.

If the assistant is unavailable, the system falls back to a rule engine based on the Ghana
Standard Treatment Guidelines. The response indicates which produced it.

# 8. Laboratory Technician

1. Open **Laboratory**. The worklist shows orders awaiting action.
2. **Receive the specimen** — match the barcode on the container to the order.
3. Set the status to **Specimen Collected**, then **In Analysis**.
4. Enter each result parameter with its value, unit and reference range, marking abnormal or
   critical values.
5. **Verify** to release the result.

> Verifying is a separate authority from recording. When you verify, your name and the time
> are stamped on the result and it becomes visible on the clinical record. If your role may
> record but not verify, the system will say so — a Laboratory Scientist must release it.

# 9. Radiographer and Radiologist

**Radiographer.** Open **Radiology**, select a scheduled study, confirm pregnancy screening
where relevant, perform the study, upload the images and add technical notes. You cannot
write the interpretation — the system will refuse, and this is correct.

**Radiologist.** Select a completed study, review the images, write the report, mark any
critical findings and sign. Your name and the time are recorded on the report.

# 10. Pharmacist

## 10.1 Dispensing

1. Open **Pharmacy**. Prescriptions awaiting dispensing are listed.
2. Select a prescription and review it against the patient's allergies.
3. Choose a batch. **Stock is listed with the earliest expiry first** — dispense from the top
   unless there is a reason not to.
4. Enter the quantity.
5. Add counselling notes.
6. Select **Dispense**.

The dispense record and the stock deduction happen together. If either cannot complete,
neither does — you will never have handed out medicine the ledger does not know about.

**The system will refuse to dispense** more than the batch holds (it tells you how many
remain) or from an expired batch (it tells you the expiry date). If two counters dispense the
same batch at the same instant, one is asked to retry rather than the stock going negative.

Controlled substances are marked. Handle them under the usual restrictions.

## 10.2 Stock

The stock list shows quantity, reorder level and expiry. Items at or below their reorder level
are flagged Low Stock; items expiring within 90 days are flagged Near Expiry.

# 11. Cashier

1. Open **Billing & Cashier**.
2. Find the patient's invoice. Line items show what was charged, what NHIS covers and what the
   patient owes.
3. Take payment: cash, MTN MoMo, Telecel Cash, bank card, NHIS claim, private insurance or
   corporate account.
4. Enter the amount and select **Record payment**.
5. Issue the receipt.

The invoice total is calculated by the system from the line items — it cannot be edited to
disagree with what was actually charged. Overpayment is refused, and the system states both
figures.

> **Refunds.** Reducing an amount already paid is a refund and requires Hospital Admin
> authorisation. The system will tell you this rather than allowing it silently.

# 12. Claims Officer

1. Open **NHIS Claims**. Claim lines generated from consultations are listed.
2. Review any **audit flags** — a missing NHIS number, an expired card, or no diagnosis code.
   Flagged claims are held as Draft. Resolve the flag before proceeding, because these are
   the conditions NHIA rejects claims for.
3. Select **Prepare batch** for the month. The system gathers every validated, unbatched claim
   and computes the count and total from the claims themselves.
4. Move the batch through **Exported → Submitted → Reconciled** as you deal with NHIA.
   Reconciling marks every claim in the batch as paid.

A claim cannot appear in two batches — the system stamps them as it batches.

# 13. Ward Manager, Store Keeper, Procurement, HR and Finance

**Ward Manager** — bed allocation, admissions, discharges and transfers, plus the ward roster.

**Store Keeper** — **Inventory & Procurement**: receive stock, record batch and expiry,
transfer between stores. Status (In Stock, Low Stock, Near Expiry, Expired) is worked out by
the system from quantity and expiry.

**Procurement Officer** — purchase requests and supplier records. Approval rests with Hospital
Admin or the Director.

**HR Officer** — **Facility Configuration**: staff records and professional licences. Licences
expiring within 90 days are flagged automatically. HR has no access to patient records.

**Finance Officer** — revenue reports and claim reconciliation. No access to clinical notes.

# 14. Hospital Director and Hospital Admin

**Director** — the dashboard gives occupancy, attendance, revenue and claim position across
the facility, plus DHIMS2 returns and HeFRA licence status. The Director oversees rather than
performs clinical work.

**Hospital Admin** — staffing, facility configuration, refund authorisation and purchase
approval.

# 15. System Auditor

Open **Security Audit** to review the trail. Every entry records who acted, in what role, what
they did, to which patient, when, and from what address. Entries cannot be edited or deleted
by anyone, including the administrator.

Filter by user, action, date or patient to investigate a specific question.

---

# Part III — System Administration

# 16. Administrator Responsibilities

The Super Admin manages the system, not the clinical record.

| Task | Where |
| :--- | :--- |
| Register and configure facilities | Hospitals Management |
| HeFRA licence tracking | Facility Configuration |
| Staff accounts and roles | Facility Configuration |
| Security audit review | Security Audit |
| Aggregate operational statistics | Dashboard |

> **The administrator cannot open patient records, observations or consultation notes.** This
> is enforced by the server, and it is intentional: section 20 of the Data Protection Act,
> 2012 (Act 843) limits access to personal health data to those with a care or administrative
> need. A technical administrator has neither. Operational oversight is provided instead by
> aggregate figures that contain no patient identifiers.

# 17. Installation

**Requirements:** Node.js 20 or later; PostgreSQL 14 or later.

```bash
git clone https://github.com/NketiaAsubontengErnest/HealthEasy-G.git
cd HealthEasy-G
cp .env.example .env
npm install
```

Edit `.env`:

```env
DATABASE_TARGET="cloud"          # or "local"
DATABASE_URL_LOCAL="postgresql://postgres:password@localhost:5432/healtheasy_g?schema=public"
DATABASE_URL_CLOUD="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
SESSION_SECRET="a-long-random-value-of-at-least-32-characters"
SESSION_MAX_AGE_SECONDS="28800"
```

Generate the session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Create and populate the database:

```bash
npm run db:setup:cloud     # online database
npm run db:setup:local     # offline database
```

Start:

```bash
npm run dev      # development
npm run build && npm start   # production
```

# 18. Running Online and Offline

The system runs against a local PostgreSQL when the facility has no internet, and against the
managed cloud database when it has. The schema and the seed are identical.

To switch, change `DATABASE_TARGET` in `.env` to `local` or `cloud` and restart.

| Command | Effect |
| :--- | :--- |
| `npm run db:setup:local` | Create and seed the offline database |
| `npm run db:setup:cloud` | Create and seed the online database |
| `npm run db:studio` | Open a database browser on the current target |
| `npx tsx scripts/db-inspect.mjs` | Print row counts and column types |

Set both up once, and you can then work either way by changing one line.

> Records created offline stay in the local database. Synchronising the two is planned but not
> implemented (see the Maintenance and Evolution plan).

# 19. Managing Staff Accounts

Accounts are created in **Facility Configuration**. Each requires a name, hospital email
address, staff ID, department and role. The role determines everything the account may do.

**Passwords.** Set a strong initial password of at least twelve characters and require the
holder to change it. Passwords are stored only as bcrypt hashes — nobody, including the
administrator, can read an existing password.

**Suspending an account.** Change its status from Active. Sign-in is refused immediately and
the attempt is recorded.

**Never share accounts.** The audit trail attributes every action to the account that
performed it. A shared account makes the trail worthless.

# 20. Routine Maintenance

| Task | Frequency | How |
| :--- | :--- | :--- |
| Verify backups | Daily | Confirm the provider's automated backup completed |
| Review audit trail | Weekly | Security Audit — look for unusual access patterns |
| Review licence expiry | Monthly | Facility Configuration — staff and HeFRA |
| Apply dependency updates | Monthly | `npm outdated`, then update and run `npm test` |
| Apply security patches | As released | Immediately for anything rated High or Critical |
| Rotate the session secret | Quarterly | Change `SESSION_SECRET`; all sessions end and users sign in again |
| Verify a restore | Quarterly | Restore a backup to a scratch database and confirm |

# 21. Backup and Recovery

**Backup.** The managed database provider takes automated daily backups with point-in-time
recovery. For a local database, schedule:

```bash
pg_dump "$DATABASE_URL_LOCAL" > healtheasy_g_$(date +%F).sql
```

Keep backups off the machine that runs the database.

**Recovery.**

```bash
psql "$DATABASE_URL_LOCAL" < healtheasy_g_2026-08-14.sql
npx tsx scripts/db-inspect.mjs   # confirm row counts
```

After any restore, verify that the audit trail is intact — it is the record of what happened
before the failure.

# 22. Troubleshooting

| Symptom | Likely cause | Action |
| :--- | :--- | :--- |
| All users redirected to sign-in | `SESSION_SECRET` changed or unset | Restore the secret, or have users sign in again |
| "Cannot reach the authentication server" | Application or network down | Check the deployment; check connectivity |
| Screens show no data but the system responds | Role has no access to those collections | Confirm the role is correct — this may be expected |
| A save reports failure | Validation, authorisation or database error | The message states which; act accordingly |
| Sign-in refused for a valid password | Account not Active, or rate limit reached | Check status in Facility Configuration; wait fifteen minutes |
| Slow responses | Cold start, or database in a distant region | Expected on first request after idle; see the maintenance plan |
| "This staff account is not active" | Account suspended | HR reactivates it |
| Build fails after a schema change | Prisma client not regenerated | `npx prisma generate` |

# 23. Getting Help

Report a problem with: what you were doing, what you expected, what happened, your role, and
the time. The time matters — it lets the administrator find the corresponding audit entry.

**Never include a password in a problem report.** No member of the support team will ask for
one.

---

**End of User Manual and System Administration Guide**
