---
title: "Design Documentation"
subtitle: "HealthEasy-G Hospital Management System"
author: "Group: Architects — CSCD602 Advance Software Development, University of Ghana"
date: "August 2026"
---

# Design Documentation

**Project:** HealthEasy — HealthEasy-G Hospital Management System
**Group:** Architects
**Course:** CSCD602 Advance Software Development, University of Ghana
**Document version:** 1.0

---

# 1. Design Principles

Four principles governed every design decision. They are stated here because the rest of
this document is best read as their consequence.

**1. The server is the only authority.**
Anything the browser sends can be forged. Identity, role and every authorisation decision are
therefore established server-side from a signed session cookie. Client-side guards exist only
to give the user a useful message.

**2. One boundary for each concern.**
Access policy is declared in exactly one file. Storage-to-presentation conversion happens in
exactly one file. Date parsing and formatting happen in exactly one file. This is deliberate:
a rule that exists in one place can be audited; a rule scattered across twenty-four route
handlers cannot.

**3. Fail closed.**
An endpoint with no declared policy is denied, not permitted. An unrecognised enum falls back
to the safest value. A write that cannot complete is reported, never silently dropped.

**4. Derive rather than store.**
Waiting time, stock status, licence expiry status and DHIMS2 attendance figures are computed
from their underlying facts at read time. A stored copy is a copy that can disagree with
reality.

---

# 2. System Architecture

## 2.1 Architectural Style

The system uses a **layered architecture within a serverless deployment model**. Next.js App
Router provides both the presentation layer (React Server and Client Components) and the
application layer (Route Handlers) in one deployable unit, with Prisma as the data-access
layer over PostgreSQL.

A layered style was chosen over microservices because the domain is a single bounded
context — one hospital's operations — with heavily interconnected data. Splitting patient,
clinical, pharmacy and billing into separate services would have introduced distributed
transactions across boundaries that must be atomic (dispensing and stock deduction; claim
batching and claim stamping), for no compensating benefit at this scale.

## 2.2 Layered View

```mermaid
flowchart TB
    subgraph PRES["Presentation Layer"]
        direction LR
        P1["Public site<br/>(landing page)"]
        P2["Staff portal<br/>33 pages"]
        P3["HMSContext<br/>client state"]
    end

    subgraph SEC["Security Perimeter"]
        direction LR
        S1["proxy.ts<br/>session + route guard"]
        S2["api-guard.ts<br/>withAuth()"]
        S3["api-policy.ts<br/>access declarations"]
    end

    subgraph APP["Application Layer — 24 Route Handlers"]
        direction LR
        A1["Patient &<br/>Queue"]
        A2["Clinical &<br/>Diagnostics"]
        A3["Pharmacy &<br/>Inventory"]
        A4["Revenue &<br/>Claims"]
        A5["Reporting &<br/>Governance"]
    end

    subgraph DOM["Domain Services"]
        direction LR
        D1["adapters.ts<br/>shape translation"]
        D2["validation.ts<br/>input rules"]
        D3["sequence.ts<br/>document numbers"]
        D4["session.ts<br/>token signing"]
    end

    subgraph DATA["Data Layer"]
        direction LR
        E1["Prisma Client"]
        E2["PostgreSQL<br/>19 models"]
    end

    EXT["Ollama<br/>clinical assistant"]

    PRES --> SEC
    SEC --> APP
    APP --> DOM
    APP --> EXT
    DOM --> DATA
```

## 2.3 Responsibility of Each Layer

| Layer | Responsibility | Must not |
| :--- | :--- | :--- |
| Presentation | Render state, collect input, explain outcomes | Make authorisation decisions of record |
| Security perimeter | Establish identity; permit or deny | Contain business logic |
| Application | Orchestrate a use case end to end | Bypass the perimeter |
| Domain services | Enforce invariants that outlive any one handler | Depend on HTTP |
| Data | Persist and retrieve | Contain policy |

## 2.4 Request Lifecycle

Every request follows the same path. This is what makes the security model reviewable.

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser
    participant PX as proxy.ts
    participant GD as withAuth()
    participant PO as API_POLICY
    participant H as Route handler
    participant AD as adapters.ts
    participant DB as PostgreSQL

    U->>PX: Request with hms_session cookie
    PX->>PX: verifySessionToken()

    alt No valid session
        PX-->>U: 401 (API) or 307 to /auth/login (page)
    else Valid session
        PX->>PX: Role may access this route?
        alt Route not permitted for role
            PX-->>U: 307 to /dashboard
        else Permitted
            PX->>GD: Forward
            GD->>PO: Rule for (method, path)?
            alt No rule declared
                GD-->>U: 403 — fails closed
            else Rule found
                GD->>GD: Role satisfies rule?
                alt Not satisfied
                    GD-->>U: 403 with reason
                else Satisfied
                    GD->>H: handler(req, session)
                    H->>DB: Prisma query
                    DB-->>H: Rows
                    H->>AD: Convert to client shape
                    AD-->>H: Client records
                    H-->>U: 200 JSON
                end
            end
        end
    end
```

---

# 3. Technology Architecture

## 3.1 Deployment Topology

```mermaid
flowchart LR
    subgraph CLIENT["Client Devices"]
        B1["Desktop browser"]
        B2["Tablet browser"]
    end

    subgraph VERCEL["Vercel Edge + Serverless"]
        CDN["Static assets<br/>CDN"]
        EDGE["Proxy / Middleware<br/>Edge runtime"]
        FN["Route Handlers<br/>Node.js serverless"]
    end

    subgraph DBLAYER["Data"]
        NEON[("Neon<br/>PostgreSQL")]
        LOCAL[("Local PostgreSQL<br/>offline operation")]
    end

    OLL["Ollama host<br/>(optional)"]

    B1 & B2 -->|HTTPS| CDN
    B1 & B2 -->|HTTPS| EDGE
    EDGE --> FN
    FN -->|"DATABASE_TARGET=cloud"| NEON
    FN -.->|"DATABASE_TARGET=local"| LOCAL
    FN -.->|"optional"| OLL
```

## 3.2 Technology Choices and Justification

| Concern | Choice | Justification | Alternative rejected |
| :--- | :--- | :--- | :--- |
| Framework | Next.js 16 App Router | Server and client code in one deployable; server components keep data access off the client; native middleware for a security perimeter | Separate React SPA + Express API — two deployments, duplicated types, and a perimeter that must be re-implemented |
| Language | TypeScript (strict) | Compile-time detection of shape mismatches, which is precisely the class of defect that plagued the early codebase | JavaScript — the storage/presentation mismatch would have remained invisible |
| ORM | Prisma 5 | Generated types keep the schema and code in step; parameterised queries eliminate injection; first-class migrations | Raw SQL — faster but forfeits type safety and migration tracking |
| Database | PostgreSQL | Relational integrity, transactions, native date and enum types, JSON columns for genuinely variable structures (ICD lists, order arrays) | MongoDB — clinical data is highly relational; referential integrity would move into application code |
| Session | HMAC-SHA256 signed cookie via Web Crypto | Stateless, verifiable at the edge, no session store; identical code in Edge and Node runtimes | JWT library — an unnecessary dependency for one signing scheme; server-side sessions — needs a store, defeats edge verification |
| Passwords | bcrypt, 10 rounds | Deliberate slowness; well-understood; widely reviewed | Plain SHA — unusable for passwords |
| Styling | Tailwind CSS 4 | Utility classes keep style local to markup; dark mode by variant rather than a second stylesheet | CSS modules — more files, harder theme consistency |
| Clinical AI | Ollama + rule-engine fallback | No paid API; runs offline; the fallback is deterministic and auditable | Hosted LLM API — cost, and a hard dependency on connectivity |
| Testing | Node built-in test runner + tsx | Zero additional dependencies; runs the TypeScript sources directly | Jest — heavier configuration for no gain at this size |
| Hosting | Vercel | First-class Next.js support, preview deployments, required by the coursework | Self-hosted — no benefit for an assessed project |

---

# 4. Use-Case Model

## 4.1 Use-Case Diagram — Patient Administration and Clinical Care

```mermaid
flowchart TB
    RO(["OPD / Medical<br/>Records Officer"])
    NU(["Nurse"])
    DR(["Doctor"])
    WM(["Ward Manager"])

    subgraph SYS["HealthEasy-G — Clinical Core"]
        U1(["Register patient"])
        U2(["Search patient record"])
        U3(["Route to queue"])
        U4(["Record triage vitals"])
        U5(["Assign ESI acuity"])
        U6(["Conduct consultation"])
        U7(["Assign ICD-10 diagnosis"])
        U8(["Raise clinical order"])
        U9(["Admit to bed"])
        U10(["Administer medication"])
        U11(["Discharge patient"])
    end

    RO --> U1
    RO --> U2
    RO --> U3
    NU --> U4
    NU --> U10
    DR --> U6
    DR --> U11
    WM --> U9

    U1 -.->|"«include»"| U3
    U4 -.->|"«include»"| U5
    U6 -.->|"«include»"| U7
    U6 -.->|"«extend»"| U8
    U8 -.->|"«extend»"| U9
```

## 4.2 Use-Case Diagram — Diagnostics, Pharmacy and Revenue

```mermaid
flowchart TB
    LT(["Laboratory<br/>Technician"])
    RG(["Radiographer"])
    RD(["Radiologist"])
    PH(["Pharmacist"])
    CA(["Cashier"])
    CO(["Claims Officer"])

    subgraph SYS2["HealthEasy-G — Support Services"]
        V1(["Receive specimen"])
        V2(["Record lab result"])
        V3(["Verify and release result"])
        V4(["Perform imaging study"])
        V5(["Issue radiology report"])
        V6(["Verify prescription"])
        V7(["Dispense medicine"])
        V8(["Deduct batch stock"])
        V9(["Collect payment"])
        V10(["Issue receipt"])
        V11(["Prepare NHIS claim"])
        V12(["Batch claims"])
    end

    LT --> V1
    LT --> V2
    LT --> V3
    RG --> V4
    RD --> V5
    PH --> V6
    PH --> V7
    CA --> V9
    CO --> V11
    CO --> V12

    V7 -.->|"«include»"| V8
    V9 -.->|"«include»"| V10
    V11 -.->|"«include»"| V12
```

## 4.3 Use-Case Specification — Conduct Consultation

| Field | Detail |
| :--- | :--- |
| **Identifier** | UC-06 |
| **Actor** | Doctor |
| **Goal** | Record a clinical encounter and raise the orders arising from it |
| **Preconditions** | Doctor is authenticated; patient exists in the MPI; patient is in the doctor's queue |
| **Trigger** | Doctor selects a patient from the consultation queue |
| **Main flow** | 1. System presents the patient's demographics, allergies, chronic conditions, latest vitals and previous encounters.<br/>2. Doctor records presenting complaint, history, examination and plan.<br/>3. Doctor assigns one or more ICD-10 diagnoses.<br/>4. Doctor raises orders (laboratory, radiology, prescription, admission, procedure).<br/>5. Doctor signs the encounter.<br/>6. System persists the encounter attributed to the doctor's session identity.<br/>7. For each order the system creates the departmental work item and a billing line.<br/>8. For an insured patient with covered items the system prepares an NHIS claim line.<br/>9. System advances the queue entry to Completed. |
| **Alternative flows** | 4a. Doctor requests decision support: system returns prescribing suggestions restricted to stocked medicines with allergy conflicts flagged.<br/>7a. A departmental work item fails to create: the encounter is retained and the specific failure is reported to the doctor. |
| **Postconditions** | Encounter is on the patient's record; work items exist in the receiving departments; charges are raised |
| **Requirements** | FR-EMR-01 … FR-EMR-07, FR-AI-01 … FR-AI-06 |

## 4.4 Use-Case Specification — Dispense Medicine

| Field | Detail |
| :--- | :--- |
| **Identifier** | UC-07 |
| **Actor** | Pharmacist |
| **Goal** | Issue prescribed medicine and keep the stock ledger truthful |
| **Preconditions** | Pharmacist is authenticated and holds `DISPENSE_MEDICINE`; a prescription exists |
| **Main flow** | 1. Pharmacist selects the prescription.<br/>2. System presents stock in First-Expiry-First-Out order.<br/>3. Pharmacist selects a batch and quantity.<br/>4. System opens a transaction.<br/>5. System verifies the batch exists, holds sufficient quantity, and has not expired.<br/>6. System writes the dispense record attributed to the pharmacist.<br/>7. System decrements the batch conditionally on sufficient stock still being present.<br/>8. System commits.<br/>9. System writes an audit entry. |
| **Exception flows** | 5a. Batch unknown → 404, no change.<br/>5b. Insufficient stock → 409 stating quantity held and requested.<br/>5c. Batch expired → 409 stating the expiry date.<br/>7a. A concurrent dispense depleted the batch → the conditional update matches nothing, the transaction rolls back, and the pharmacist is asked to retry. |
| **Postconditions** | Either both the dispense record and the stock deduction exist, or neither does |
| **Requirements** | FR-PHM-03 … FR-PHM-06 |

---

# 5. Class Design

## 5.1 Domain Model

```mermaid
classDiagram
    class Patient {
        +String id
        +String mrn
        +String facilityId
        +String fullName
        +Date dob
        +String gender
        +String ghanaCardNo
        +String nhisNumber
        +Date nhisExpiry
        +PatientCategory patientCategory
        +String[] allergies
        +String[] chronicConditions
        +Date registrationDate
    }

    class UserStaff {
        +String id
        +String staffId
        +String name
        +String role
        +Int hierarchyLevel
        +String facilityId
        +String passwordHash
        +Date licenseExpiry
        +Int sessionVersion
        +authenticate(password) Boolean
    }

    class QueueItem {
        +String queueNumber
        +String department
        +PriorityLevel priority
        +QueueStatus status
        +waitingMinutes() Int
    }

    class VitalSigns {
        +Int systolicBp
        +Int diastolicBp
        +Float temperature
        +Int oxygenSaturation
        +Float bmi
        +EmergencySeverity esiSeverity
        +String[] abnormalAlerts
        +String recordedByName
    }

    class EMREncounter {
        +String encounterType
        +String chiefComplaint
        +Json icdDiagnoses
        +Json orders
        +String treatmentPlan
        +Boolean signed
        +String clinicianName
    }

    class LabOrder {
        +String barcodeNo
        +String testCode
        +String status
        +Json results
        +String verifiedByName
        +DateTime verificationTime
    }

    class RadiologyOrder {
        +String pacsAccessionNo
        +String studyType
        +String reportContent
        +Boolean criticalFindings
    }

    class PharmacyBatch {
        +String batchNumber
        +String drugName
        +Date expiryDate
        +Int quantityInStock
        +Int reorderLevel
        +Boolean controlledSubstance
    }

    class DispenseRecord {
        +String prescriptionId
        +Int quantityDispensed
        +String dispensedByName
    }

    class BillingInvoice {
        +String invoiceNumber
        +Float totalAmountGhc
        +Float nhisExemptionGhc
        +Float balanceGhc
        +String status
        +Json lineItems
    }

    class NHISClaimLine {
        +String claimNumber
        +String icdCode
        +String gdrgCode
        +Float totalClaimGhc
        +String status
        +String[] auditFlags
    }

    class NHISClaimBatch {
        +String batchNo
        +String monthYear
        +Int claimCount
        +Float totalAmountGhc
    }

    class InpatientBed {
        +String bedNumber
        +String wardName
        +BedStatus status
        +Float dailyRateGhc
    }

    class AuditLog {
        +DateTime timestamp
        +String userName
        +String action
        +String details
        +String ipAddress
    }

    Patient "1" --> "*" QueueItem
    Patient "1" --> "*" VitalSigns
    Patient "1" --> "*" EMREncounter
    Patient "1" --> "*" LabOrder
    Patient "1" --> "*" RadiologyOrder
    Patient "1" --> "*" DispenseRecord
    Patient "1" --> "*" BillingInvoice
    Patient "1" --> "*" NHISClaimLine
    UserStaff "1" --> "*" VitalSigns : records
    UserStaff "1" --> "*" EMREncounter : signs
    UserStaff "1" --> "*" LabOrder : verifies
    UserStaff "1" --> "*" DispenseRecord : dispenses
    UserStaff "1" --> "*" AuditLog : acts
    PharmacyBatch "1" --> "*" DispenseRecord : source
    NHISClaimBatch "1" --> "*" NHISClaimLine : carries
    InpatientBed "0..1" --> "0..1" Patient : occupied by
```

## 5.2 Security Class Design

```mermaid
classDiagram
    class SessionPayload {
        +String id
        +String name
        +String role
        +Int hierarchyLevel
        +String facilityId
        +Int sessionVersion
        +Int iat
        +Int exp
    }

    class SessionService {
        <<module>>
        +createSessionToken(user) String
        +verifySessionToken(token) SessionPayload
        +sessionCookieOptions() CookieOptions
        -getSecret() String
        -timingSafeEqual(a, b) Boolean
    }

    class AccessRule {
        <<union>>
        authenticated
        roles[]
        permission anyOf[]
    }

    class ApiPolicy {
        <<registry>>
        +API_POLICY Map~path, MethodPolicy~
    }

    class ApiGuard {
        <<module>>
        +withAuth(method, handler) Handler
        +getSession(req) SessionPayload
        +roleHasPermission(role, perm) Boolean
        -satisfies(rule, session) Boolean
    }

    class RoleDefinition {
        +UserRole name
        +Int level
        +UserRole parentRole
        +String[] allowedRoutes
        +Permission[] permissions
        +String[] cannot
    }

    SessionService ..> SessionPayload : creates
    ApiGuard ..> SessionService : verifies via
    ApiGuard ..> ApiPolicy : consults
    ApiPolicy ..> AccessRule : composed of
    ApiGuard ..> RoleDefinition : resolves permissions
```

---

# 6. Sequence Diagrams

## 6.1 Staff Authentication

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff member
    participant L as Login page
    participant API as POST /api/auth/login
    participant RL as rate-limit.ts
    participant DB as PostgreSQL
    participant SS as session.ts

    S->>L: Enter email and password
    L->>API: credentials (same-origin)
    API->>RL: loginAllowed(source)?

    alt Too many recent failures
        RL-->>API: false
        API-->>L: 429 Too Many Requests
    else Allowed
        API->>DB: findUnique(email)
        alt No such account
            API->>DB: Write LOGIN_FAILED audit entry
            API-->>L: 401 "Invalid user credentials"
            Note over API,L: Identical message to a<br/>wrong password — no enumeration
        else Account exists
            API->>API: bcrypt.compare(password, hash)
            alt Password incorrect
                API->>RL: recordFailedLogin(source)
                API->>DB: Write LOGIN_FAILED audit entry
                API-->>L: 401 "Invalid user credentials"
            else Password correct
                alt Account not Active
                    API->>DB: Write LOGIN_BLOCKED audit entry
                    API-->>L: 403 with account status
                else Active
                    API->>RL: clearLoginAttempts(source)
                    API->>DB: Write LOGIN_SUCCESS audit entry
                    API->>SS: createSessionToken(profile)
                    SS-->>API: HMAC-signed token
                    API-->>L: 200 + Set-Cookie httpOnly
                    L->>S: Redirect to dashboard
                end
            end
        end
    end
```

## 6.2 Consultation and Order Fan-Out

This is the sequence that makes the record "follow the patient". One clinical action produces
work items in three other departments.

```mermaid
sequenceDiagram
    autonumber
    actor D as Doctor
    participant UI as Consultation screen
    participant ENC as POST /api/encounters
    participant LAB as POST /api/lab-orders
    participant BIL as POST /api/billing
    participant CLM as POST /api/nhis-claims
    participant DB as PostgreSQL

    D->>UI: Record findings, diagnosis and orders
    UI->>ENC: Encounter with orders[]
    ENC->>ENC: Attribute clinician from session
    ENC->>DB: Create EMREncounter
    ENC->>DB: Write CREATE_ENCOUNTER audit entry
    ENC-->>UI: Saved encounter

    loop For each clinical order
        alt Laboratory order
            UI->>LAB: patient, test code
            LAB->>DB: Look up test catalogue
            LAB->>DB: Create LabOrder with barcode
            LAB-->>UI: Lab order
        end

        UI->>BIL: Line item for the order
        BIL->>BIL: Recompute totals server-side
        BIL->>DB: Create BillingInvoice
        BIL-->>UI: Invoice

        alt Patient is NHIS and item is covered
            UI->>CLM: Diagnosis and tariff
            CLM->>DB: Read patient demographics
            CLM->>CLM: Derive audit flags
            CLM->>DB: Create NHISClaimLine
            CLM-->>UI: Claim line
        end
    end

    Note over UI,D: Any failed step is reported<br/>individually; the encounter is not lost
```

## 6.3 Dispensing with Atomic Stock Deduction

```mermaid
sequenceDiagram
    autonumber
    actor P as Pharmacist
    participant UI as Pharmacy screen
    participant API as POST /api/pharmacy/dispense
    participant TX as Transaction
    participant DB as PostgreSQL

    P->>UI: Select batch and quantity
    UI->>API: prescription, batch, quantity
    API->>API: Validate quantity > 0
    API->>TX: BEGIN
    TX->>DB: Find batch by batchNumber

    alt Batch not found
        TX->>TX: ROLLBACK
        API-->>UI: 404
    else Insufficient stock
        TX->>TX: ROLLBACK
        API-->>UI: 409 held vs requested
    else Batch expired
        TX->>TX: ROLLBACK
        API-->>UI: 409 with expiry date
    else Dispensable
        TX->>DB: Create DispenseRecord
        TX->>DB: UPDATE batch SET qty = qty - n<br/>WHERE qty >= n
        alt Zero rows updated (concurrent dispense)
            TX->>TX: ROLLBACK
            API-->>UI: Retry requested
        else One row updated
            TX->>TX: COMMIT
            API->>DB: Write DISPENSE_MEDICATION audit entry
            API-->>UI: 200 dispense record
        end
    end
```

## 6.4 Access Denial — the DPC Rule in Action

```mermaid
sequenceDiagram
    autonumber
    actor A as Super Admin
    participant PX as proxy.ts
    participant GD as withAuth('GET')
    participant PO as API_POLICY

    A->>PX: GET /api/patients
    PX->>PX: Session valid
    PX->>GD: Forward (API paths skip route check)
    GD->>PO: Rule for GET /api/patients
    PO-->>GD: roles(PATIENT_DATA_READERS)
    GD->>GD: Is "Super Admin" in that list?
    Note over GD: It is deliberately absent —<br/>Data Protection Act, s.20
    GD-->>A: 403 with the reason and the required roles
```

---

# 7. Activity Diagrams

## 7.1 Out-Patient Journey End to End

```mermaid
flowchart TD
    ST([Patient arrives]) --> Q1{Known to<br/>the facility?}
    Q1 -->|No| R1[Register: capture Ghana Card,<br/>NHIS, demographics, allergies]
    Q1 -->|Yes| R2[Retrieve record by<br/>MRN or Ghana Card]
    R1 --> DUP{Ghana Card<br/>already used?}
    DUP -->|Yes| MRG[Reject and offer merge]
    MRG --> R2
    DUP -->|No| MRN[Allocate MRN]
    MRN --> QT
    R2 --> QT[Issue triage queue ticket]

    QT --> TRI[Record vitals and<br/>assign ESI acuity]
    TRI --> ESI{ESI level}
    ESI -->|"1 or 2"| EMG[Route to Emergency]
    ESI -->|"3 to 5"| OPD[Route to OPD queue]

    EMG --> CONS
    OPD --> CONS[Consultation:<br/>history, examination, ICD-10]

    CONS --> ORD{Orders<br/>required?}
    ORD -->|Laboratory| LAB[Specimen barcoded,<br/>tested, verified]
    ORD -->|Radiology| RAD[Study performed,<br/>report signed]
    ORD -->|Prescription| PHM[Verified and dispensed,<br/>stock deducted]
    ORD -->|Admission| ADM[Bed assigned,<br/>MAR opened]
    ORD -->|None| BILL

    LAB --> REV[Clinician reviews results]
    RAD --> REV
    REV --> CONS

    PHM --> BILL[Invoice raised]
    ADM --> BILL
    BILL --> PAY{Patient<br/>category}
    PAY -->|NHIS covered| CLM[Claim line prepared<br/>and batched]
    PAY -->|Cash or other| CASH[Payment collected,<br/>receipt issued]
    CLM --> AUD
    CASH --> AUD[Every step written<br/>to the audit trail]
    AUD --> END([Patient departs])
```

## 7.2 Laboratory Order to Verified Result

```mermaid
flowchart LR
    A([Order raised in<br/>consultation]) --> B[Status: Ordered<br/>barcode allocated]
    B --> C[Specimen collected]
    C --> D[Status: Specimen Collected]
    D --> E[Specimen received<br/>in laboratory]
    E --> F[Status: In Analysis]
    F --> G[Technician enters<br/>result parameters]
    G --> H{Verifier holds<br/>VERIFY_LAB_RESULTS?}
    H -->|No| I[403 — result recorded<br/>but not released]
    H -->|Yes| J[Status: Verified<br/>verifier and time stamped]
    J --> K[Result visible on<br/>the clinical record]
    K --> L([Clinician reviews])
```

## 7.3 NHIS Claim Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Created with audit flags
    [*] --> Validated: Created clean
    Draft --> Validated: Flags resolved
    Validated --> Batched: Included in a monthly batch
    Batched --> Submitted: Batch submitted to NHIA
    Submitted --> Paid: Batch reconciled
    Submitted --> Rejected: NHIA query
    Rejected --> Validated: Corrected and resubmitted
    Paid --> [*]
```

---

# 8. Data Design

## 8.1 Entity-Relationship Diagram

```mermaid
erDiagram
    FACILITY_BRANCH ||--o{ USER_STAFF : employs
    FACILITY_BRANCH ||--o{ PATIENT : registers

    PATIENT ||--o{ QUEUE_ITEM : "queues at"
    PATIENT ||--o{ VITAL_SIGNS : "observed in"
    PATIENT ||--o{ EMR_ENCOUNTER : "attends"
    PATIENT ||--o{ LAB_ORDER : "tested by"
    PATIENT ||--o{ RADIOLOGY_ORDER : "imaged by"
    PATIENT ||--o{ DISPENSE_RECORD : "receives"
    PATIENT ||--o{ BILLING_INVOICE : "billed on"
    PATIENT ||--o{ NHIS_CLAIM_LINE : "claimed for"
    PATIENT ||--o{ MED_ADMIN_RECORD : "charted on"
    PATIENT ||--o{ AUDIT_LOG : "subject of"

    USER_STAFF ||--o{ VITAL_SIGNS : records
    USER_STAFF ||--o{ EMR_ENCOUNTER : signs
    USER_STAFF ||--o{ LAB_ORDER : verifies
    USER_STAFF ||--o{ DISPENSE_RECORD : dispenses
    USER_STAFF ||--o{ AUDIT_LOG : performs

    PHARMACY_BATCH ||--o{ DISPENSE_RECORD : "source of"
    LAB_TEST_CATALOGUE ||--o{ LAB_ORDER : "defines"
    NHIS_CLAIM_BATCH ||--o{ NHIS_CLAIM_LINE : carries

    FACILITY_BRANCH {
        uuid id PK
        string code UK
        string hefraLicenseNo
        date hefraExpiryDate
        enum hefraStatus
        string region
        int bedCapacity
    }

    USER_STAFF {
        uuid id PK
        string staffId UK
        string email UK
        string role
        int hierarchyLevel
        string passwordHash
        date licenseExpiry
        int sessionVersion
        string facilityId FK
    }

    PATIENT {
        uuid id PK
        string mrn UK
        string ghanaCardNo UK
        string fullName
        date dob
        string nhisNumber
        date nhisExpiry
        enum patientCategory
        string_array allergies
        string facilityId FK
    }

    EMR_ENCOUNTER {
        uuid id PK
        uuid patientId FK
        string chiefComplaint
        json icdDiagnoses
        json orders
        boolean signed
        uuid signedById FK
    }

    LAB_ORDER {
        uuid id PK
        uuid patientId FK
        string barcodeNo UK
        string testCode
        string status
        json results
        timestamp verificationTime
    }

    PHARMACY_BATCH {
        uuid id PK
        string batchNumber UK
        date expiryDate
        int quantityInStock
        boolean controlledSubstance
    }

    BILLING_INVOICE {
        uuid id PK
        string invoiceNumber UK
        uuid patientId FK
        float totalAmountGhc
        float balanceGhc
        json lineItems
    }

    NHIS_CLAIM_LINE {
        uuid id PK
        string claimNumber UK
        uuid patientId FK
        string icdCode
        string gdrgCode
        float totalClaimGhc
        string_array auditFlags
    }

    AUDIT_LOG {
        uuid id PK
        timestamp timestamp
        uuid userId FK
        string action
        string details
        string ipAddress
    }
```

## 8.2 Database Design Decisions

**Uniqueness as the integrity mechanism.** `ghanaCardNo`, `mrn`, `staffId`, `email`,
`batchNumber`, `barcodeNo`, `invoiceNumber`, `claimNumber` and `pacsAccessionNo` all carry
unique constraints. Document numbers are allocated by generating a candidate and letting the
unique index settle collisions, with retry — because two clerks registering simultaneously
would otherwise produce the same number from a `count() + 1`.

**Native date types.** Every date is a PostgreSQL `DATE` or `TIMESTAMP`. Dates were initially
stored as text, which made every comparison lexical: `'2026-9-1'` sorts after `'2026-10-01'`,
so an expiry check or a month filter silently returned the wrong rows. Migration
`20260814000000_dates_and_session_security` converts them in place.

**Enumerations in the database.** `PatientCategory`, `QueueStatus`, `BedStatus`,
`PriorityLevel`, `EmergencySeverity`, `LicenseStatus` and `LicensingBody` are PostgreSQL
enums, so an invalid value cannot be stored at all.

**JSON where structure is genuinely variable.** `icdDiagnoses`, `orders`, `results` and
`lineItems` are JSON columns. Each is a list whose length and shape vary per record and which
is always read as a whole. Normalising them would add four tables and four joins for no query
benefit.

**Cascade on patient deletion.** Clinical children cascade from `Patient`. Audit entries do
not — the trail must outlive the record it describes.

**Derived, not stored.** Stock status, waiting minutes, licence expiry status and DHIMS2
attendance are computed at read time. A stored `status` column drifts from the quantity and
expiry it claims to describe.

## 8.3 Data Dictionary — Selected Tables

### `Patient`

| Column | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | Surrogate key |
| `mrn` | text | unique, not null | Medical Record Number, `HG-YYYY-NNNN` |
| `facilityId` | text | not null | Registering facility |
| `fullName` | text | not null | Legal name |
| `dob` | date | not null | Date of birth |
| `gender` | text | not null | Male / Female / Other |
| `ghanaCardNo` | text | unique, not null | National identity number — the duplicate-prevention key |
| `nhisNumber` | text | nullable | NHIS membership number |
| `nhisStatus` | text | nullable | Active / Expired / Pending Verification |
| `nhisExpiry` | date | nullable | Card expiry |
| `patientCategory` | enum | not null | CASH / NHIS / CORPORATE / PRIVATE_INSURANCE / EXEMPTED |
| `allergies` | text[] | not null | Known drug allergies |
| `chronicConditions` | text[] | not null | Ongoing conditions |
| `bloodGroup` | text | default `O+` | ABO/Rh group |
| `registrationDate` | date | default today | First registration |
| `consentSigned` | boolean | default true | Data-processing consent |

### `PharmacyBatch`

| Column | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `batchNumber` | text | unique, not null | Manufacturer batch identifier |
| `drugName` | text | not null | Generic (INN) name |
| `brandName` | text | default `''` | Trade name |
| `dosageForm` | text | default `Tablet` | Tablet, capsule, injection, etc. |
| `strength` | text | default `''` | e.g. `500mg` |
| `expiryDate` | date | not null | Drives FEFO order and dispensing refusal |
| `quantityInStock` | integer | not null | Units held |
| `reorderLevel` | integer | default 50 | Low-stock threshold |
| `controlledSubstance` | boolean | default false | Restricted handling |

### `AuditLog`

| Column | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | timestamp | default now | When |
| `userId` | uuid | FK, nullable | Actor; nullable so a failed sign-in by an unknown email can still be logged |
| `userName` | text | not null | Actor name at the time of the action |
| `role` | text | not null | Role held at the time |
| `action` | text | not null | e.g. `DISPENSE_MEDICATION` |
| `patientId` | uuid | FK, nullable | Subject, where applicable |
| `details` | text | not null | Human-readable description |
| `ipAddress` | text | default `127.0.0.1` | Source address |

---

# 9. Component Design

## 9.1 Component Diagram

```mermaid
flowchart TB
    subgraph UI["User Interface Components"]
        UI1["Public site<br/>page.tsx, Reveal, ThemeToggle"]
        UI2["Dashboard shell<br/>Sidebar, Header, Profile"]
        UI3["Clinical modules<br/>triage, EMR, wards"]
        UI4["Support modules<br/>lab, radiology, pharmacy"]
        UI5["Revenue modules<br/>billing, claims"]
        UI6["Governance modules<br/>audit, DHIMS2, facilities"]
    end

    subgraph STATE["Client State"]
        ST1["HMSContext<br/>collections + session"]
        ST2["api-client.ts<br/>ApiError, loadCollection"]
        ST3["RoleGuard<br/>advisory access UI"]
    end

    subgraph SECU["Security Components"]
        SE1["proxy.ts"]
        SE2["api-guard.ts"]
        SE3["api-policy.ts"]
        SE4["session.ts"]
        SE5["rate-limit.ts"]
        SE6["validation.ts"]
    end

    subgraph SVC["Domain Services"]
        SV1["adapters.ts"]
        SV2["sequence.ts"]
        SV3["auth.ts — bcrypt"]
    end

    subgraph API["Route Handlers"]
        AP1["24 endpoints"]
    end

    subgraph DATA["Data Access"]
        DA1["prisma.ts"]
        DA2["resolve-datasource.ts"]
        DA3[("PostgreSQL")]
    end

    UI1 & UI2 & UI3 & UI4 & UI5 & UI6 --> ST1
    ST1 --> ST2
    UI3 & UI4 & UI5 & UI6 --> ST3
    ST2 -->|HTTPS| SE1
    SE1 --> AP1
    AP1 --> SE2
    SE2 --> SE3
    SE2 --> SE4
    AP1 --> SE6
    AP1 --> SV1
    AP1 --> SV2
    AP1 --> DA1
    SE5 --> AP1
    SV3 --> AP1
    DA1 --> DA2
    DA1 --> DA3
```

## 9.2 Component Responsibilities

| Component | Responsibility | Depends on |
| :--- | :--- | :--- |
| `proxy.ts` | Reject unauthenticated traffic; enforce role route access | `session.ts`, `rbac.ts` |
| `api-guard.ts` | Wrap handlers; apply policy; convert thrown errors to responses | `api-policy.ts`, `session.ts` |
| `api-policy.ts` | Declare who may call each endpoint and method | `rbac.ts` |
| `session.ts` | Sign and verify session tokens; cookie options | Web Crypto |
| `rate-limit.ts` | Throttle repeated failed sign-in attempts | — |
| `validation.ts` | Type, length and range checks on request input | — |
| `adapters.ts` | Convert Prisma rows to client records and back | Prisma types, `hms.ts` |
| `sequence.ts` | Allocate collision-free document numbers | Prisma error codes |
| `prisma.ts` | Provide a single client bound to the resolved datasource | `resolve-datasource.ts` |
| `resolve-datasource.ts` | Choose local or cloud PostgreSQL | Environment |
| `HMSContext` | Hold loaded collections; expose actions; surface failures | `api-client.ts` |
| `api-client.ts` | HTTP with typed errors; treat 403 as an empty collection | — |
| `RoleGuard` | Explain denied access in the interface | `HMSContext`, `rbac.ts` |

---

# 10. User-Interface Design

## 10.1 Design Language

| Aspect | Decision |
| :--- | :--- |
| Default theme | Light, with a persisted dark option |
| Public site type | Newsreader (serif display) with Manrope (sans body) — an editorial voice that distinguishes the product from generic dashboard templates |
| Portal type | Manrope throughout, optimised for dense tabular reading |
| Brand colour | Deep clinical green `#0d6b4e`; a single accent rather than a multi-hue palette |
| Status colours | Amber for waiting, green for in-progress or complete, rose for critical, stone for neutral |
| Layout | Sidebar navigation with a sticky header; content on a 12-column responsive grid |
| Density | High on worklists, low on data-entry forms |
| Motion | Scroll reveals on the public site only; suppressed under `prefers-reduced-motion` |

## 10.2 Screen Inventory

| Screen | Route | Primary roles |
| :--- | :--- | :--- |
| Public landing | `/` | Anonymous |
| Sign in | `/auth/login` | All |
| Operational dashboard | `/dashboard` | All (content varies by role) |
| Patient registration | `/patient-registration` | OPD / Medical Records |
| Patient flow and queues | `/patient-flow` | Front desk, clinical, diagnostics |
| Triage | `/triage` | Nurse, Ward Manager |
| EMR consultation | `/emr-consultation`, `/emr-consultation/[id]` | Doctor |
| Emergency | `/emergency` | Doctor, Nurse, Ward Manager |
| Wards and beds | `/wards-beds` | Ward Manager, Nurse |
| Laboratory | `/laboratory` | Laboratory Technician |
| Radiology | `/radiology` | Radiographer, Radiologist |
| Pharmacy | `/pharmacy` | Pharmacist, Store Keeper |
| Billing and cashier | `/billing-cashier` | Cashier, Finance |
| NHIS claims | `/nhis-claims` | Claims Officer, Finance |
| Inventory and procurement | `/inventory-procurement` | Store Keeper, Procurement |
| Hospitals management | `/hospitals-management` | Super Admin, Director |
| Facility configuration | `/facility-config` | Super Admin, Hospital Admin, HR |
| DHIMS2 reports | `/dhims2-reports` | Director, Records, Auditor |
| Security audit | `/security-audit` | Auditor, Super Admin |

## 10.3 Wireframe — Operational Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰  HealthEasy-G          [Search…]  [Facility ▾]      [Role badge] ☾ 🔔 (av) │
├────────────────┬─────────────────────────────────────────────────────────────┤
│ OVERVIEW       │  ┌───────────────────────────────────────────────────────┐  │
│ ▸ Dashboard    │  │  Role banner — workstation title and current facility │  │
│                │  │                              [+ Primary role action]  │  │
│ PATIENT ADMIN  │  └───────────────────────────────────────────────────────┘  │
│ ▸ Registration │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ ▸ Flow & Queues│  │ Waiting  │ │ Emergency│ │ Signed   │ │ Pending  │        │
│                │  │    2     │ │    0     │ │    2     │ │    2     │        │
│ CLINICAL       │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│ ▸ EMR          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ ▸ Emergency    │  │Start │ │Direc-│ │Queues│ │Emerg-│ │Wards │  quick actions│
│ ▸ Wards & Beds │  │consult│ │tory │ │      │ │ency  │ │      │               │
│                │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
│ DIAGNOSTICS    │  ┌────────────────────────────────┐ ┌────────────────────┐  │
│ ▸ Laboratory   │  │ Active consultation queue      │ │ HeFRA status       │  │
│ ▸ Radiology    │  │ ┌────┬──────┬────┬──────┬────┐ │ │ Licence  ……………     │  │
│ ▸ Pharmacy     │  │ │Q#  │Name  │MRN │Status│Act │ │ │ Expiry   ……………     │  │
│                │  │ ├────┼──────┼────┼──────┼────┤ │ ├────────────────────┤  │
│ REVENUE        │  │ │OPD-│Kofi  │HG- │In    │[Go]│ │ │ Staff credentials  │  │
│ ▸ Billing      │  │ │001 │Ansah │0001│consult   │ │ │ • Dr K. Mensah  ✓   │  │
│ ▸ NHIS Claims  │  │ └────┴──────┴────┴──────┴────┘ │ │ • Nurse A. Osei ⚠   │  │
│                │  └────────────────────────────────┘ └────────────────────┘  │
│ [Role · Level] │                                                             │
│ [Sign out]     │                                                             │
└────────────────┴─────────────────────────────────────────────────────────────┘
```

## 10.4 Wireframe — Triage Vitals Capture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Triage & Nursing Assessment                          Nurse Abena Osei ☾ (av)│
├──────────────────────────────────────────────────────────────────────────────┤
│  Select patient  [ Search MRN / name …                                    ▾] │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Kofi Owusu Ansah · HG-2026-0001 · M · 41y · O+                         │  │
│  │ ⚠ Allergies: Penicillin, Sulfa Drugs   Chronic: Hypertension           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  OBSERVATIONS                                    DERIVED                     │
│  ┌───────────────┐ ┌───────────────┐             ┌─────────────────────────┐ │
│  │ BP    ___/___ │ │ Pulse   ____  │             │ BMI        25.6         │ │
│  ├───────────────┤ ├───────────────┤             │ (computed on save)      │ │
│  │ Temp    __.__ │ │ SpO₂     ___% │             ├─────────────────────────┤ │
│  ├───────────────┤ ├───────────────┤             │ ALERTS                  │ │
│  │ Resp     ____ │ │ Glucose __.__ │             │ • Elevated BP           │ │
│  ├───────────────┤ ├───────────────┤             │ • Low SpO₂              │ │
│  │ Weight  __.__ │ │ Height  ___._ │             │ (derived on the server) │ │
│  └───────────────┘ └───────────────┘             └─────────────────────────┘ │
│                                                                              │
│  ESI ACUITY   ( )1 Resus  ( )2 Emergency  (•)3 Urgent  ( )4 Less  ( )5 Non   │
│  Pain score   [0]──────●──────[10]                                           │
│  Nursing notes ┌──────────────────────────────────────────────────────────┐  │
│                └──────────────────────────────────────────────────────────┘  │
│                                            [ Cancel ]  [ Save and route ▸ ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 10.5 Wireframe — Public Landing Page

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⬢ HealthEasy-G    Why it exists  Platform  Team  Contact    ☾  [Staff sign in]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ── RIDGE REGIONAL HOSPITAL, ACCRA         ┌──────────────────────────────┐  │
│                                            │ PATIENT FLOW          ● Live │  │
│  The whole hospital,                       ├──────────────────────────────┤  │
│  on one record.            (serif italic)  │ TRG-014  A. Serwaa  [IN TRIAGE] │
│                                            │ OPD-032  K. Ansah   [WITH DR]│  │
│  HealthEasy-G carries a patient from       │ LAB-009  A. Nyarko  [WAITING]│  │
│  the registration desk through triage…     ├──────────────────────────────┤  │
│                                            │ Every movement is audited    │  │
│  [ Sign in to the portal → ] [ See more ]  └──────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│  ALIGNED TO                                                                  │
│  HeFRA · GHS · NHIA G-DRG · DHIMS2 · DPC          (hairline rule, no cards)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 10.6 Responsive Behaviour

| Breakpoint | Layout |
| :--- | :--- |
| < 640 px | Single column; sidebar becomes a sheet; tables scroll horizontally within their container |
| 640–1024 px | Two-column cards; sidebar collapsible |
| 1024–1280 px | Three-column cards; sidebar persistent |
| > 1280 px | Full grid with a secondary information column |

## 10.7 Accessibility

- Semantic elements (`nav`, `header`, `main`, `dl`, `table`) rather than generic containers.
- All interactive controls reachable and operable by keyboard.
- `aria-label` on icon-only controls; `aria-expanded` on disclosure controls.
- Error regions marked `role="alert"`.
- Text contrast meets WCAG AA in both themes.
- Motion suppressed under `prefers-reduced-motion`.

---

# 11. Design Rationale — Decisions Worth Defending

**Why route access is derived from `allowedRoutes` rather than duplicated.**
The role catalogue already declares which modules each role may open. The perimeter reads
that same declaration, so the navigation a user sees and the routes they may load cannot
disagree.

**Why the policy table uses role lists for reads and permissions for writes.**
Reads define a data-protection boundary that a reviewer must be able to check at a glance —
an explicit list of roles is auditable. Writes correspond to professional authority, which
the permission catalogue already models.

**Why 403 becomes an empty collection in the client.**
A cashier has no laboratory worklist. Treating that as an error would fill the interface with
alarming messages about normal conditions. Genuine failures still propagate.

**Why totals are recomputed on the server.**
An invoice header that disagrees with its line items is a billing dispute. The client is a
convenience, not a source of truth.

**Why the audit trail takes identity from the session.**
An audit trail that accepts an actor name from the request body records whatever the caller
claims. It would be evidence of nothing.

---

**End of Design Documentation**
