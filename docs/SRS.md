---
title: "Software Requirements Specification"
subtitle: "HealthEasy-G Hospital Management System"
author: "Group: Architects — CSCD602 Advance Software Development, University of Ghana"
date: "August 2026"
---

# Software Requirements Specification

**Project:** HealthEasy — HealthEasy-G Hospital Management System
**Group:** Architects
**Course:** CSCD602 Advance Software Development
**Institution:** University of Ghana
**Document version:** 1.0
**Live system:** <https://healtheasy-g.vercel.app>
**Repository:** <https://github.com/NketiaAsubontengErnest/HealthEasy-G>

## Group Members

| # | Name | Student ID | Major Contribution |
| :-- | :--- | :--- | :--- |
| 1 | Ernest Nketia Asubonterng | 22424715 | Lead System Architect & AI Integrator |
| 2 | Nana Kwabena Asare | 22424817 | Clinical EMR and ICD-10 diagnosis engine |
| 3 | Casper Kosi Asense | 22425080 | Master Patient Index, Ghana Card and NHIS validation |
| 4 | Richard Gyebi | 22424822 | Cashier operations, payments and NHIS G-DRG claims |
| 5 | Aubrey Owusu Amoah | 22424666 | PACS radiology orders and diagnostic workflows |
| 6 | Thomas Nii Armah Okai | 22425782 | Pharmacy FEFO stock control and dispensing |
| 7 | Abubakari Zubeiru | 22425115 | Inpatient bed management and audit-log compliance |
| 8 | Frank Tandoh | 22425049 | Responsive layouts, design system and accessibility |

---

# 1. Introduction

## 1.1 Purpose

This document specifies the requirements for **HealthEasy-G**, a Hospital Management System
(HMS) for healthcare facilities operating under the Ghana Health Service. It is written for
the project supervisor and examiner, the development team, and any future maintainer of the
system.

The specification covers the complete system: patient administration, clinical care,
diagnostics, inpatient management, pharmacy, revenue collection, national health insurance
claims, statutory reporting and system governance.

## 1.2 Scope

HealthEasy-G is a multi-facility, multi-role web application that maintains a single
longitudinal record per patient across every department of a hospital.

**In scope:**

- A Master Patient Index keyed on the Ghana Card number.
- Queue and patient-flow management across departments.
- Triage vital signs with Emergency Severity Index scoring.
- Electronic Medical Records with ICD-10 diagnosis coding and clinical ordering.
- Laboratory Information System workflow from order to verified result.
- Radiology ordering and reporting (metadata; DICOM storage is excluded).
- Inpatient bed management and the medication administration record.
- Pharmacy stock control on a First-Expiry-First-Out basis, and dispensing.
- Billing, cashier collection and receipting.
- NHIS G-DRG claim line generation and batching.
- DHIMS2 monthly return computation.
- Role-based access control across 19 staff roles.
- An immutable audit trail satisfying Data Protection Commission expectations.
- A clinical decision-support assistant for prescribing.

**Out of scope for this version:**

- Live integration with the National Identification Authority or NHIA verification services.
- DICOM image storage, transmission and viewing.
- Payroll, human-resource management beyond staff licence tracking, and general ledger
  accounting.
- Telemedicine and patient-facing portals.
- Mobile native applications.

## 1.3 Definitions, Acronyms and Abbreviations

| Term | Definition |
| :--- | :--- |
| **ADT** | Admission, Discharge and Transfer |
| **DHIMS2** | District Health Information Management System, second generation — the Ghana Health Service national reporting platform |
| **DPC** | Data Protection Commission of Ghana, established under Act 843 |
| **EMR** | Electronic Medical Record |
| **ESI** | Emergency Severity Index, a five-level triage acuity scale |
| **FEFO** | First Expiry, First Out — stock rotation by expiry date |
| **G-DRG** | Ghana Diagnosis-Related Groupings, the NHIA tariff structure |
| **GHS** | Ghana Health Service |
| **Ghana Card** | The national identity card issued by the National Identification Authority |
| **HeFRA** | Health Facilities Regulatory Agency, which licenses facilities |
| **ICD-10** | International Classification of Diseases, tenth revision |
| **MAR** | Medication Administration Record |
| **MPI** | Master Patient Index |
| **MRN** | Medical Record Number |
| **NHIA / NHIS** | National Health Insurance Authority / Scheme |
| **OPD** | Out-Patient Department |
| **PACS** | Picture Archiving and Communication System |
| **RBAC** | Role-Based Access Control |
| **GSTG** | Ghana Standard Treatment Guidelines |

## 1.4 References

1. Ghana Health Service, *Standard Operating Procedures for Health Information*.
2. National Health Insurance Authority, *G-DRG Tariff and Claims Submission Guidelines*.
3. Ministry of Health Ghana, *Standard Treatment Guidelines*, 7th edition.
4. Republic of Ghana, *Data Protection Act, 2012 (Act 843)*.
5. Health Facilities Regulatory Agency, *Facility Licensing Requirements*.
6. World Health Organization, *ICD-10 Classification of Diseases*.
7. IEEE, *Std 830-1998, Recommended Practice for Software Requirements Specifications*.

## 1.5 Overview of the Document

Section 2 describes the system in its operating context. Section 3 identifies stakeholders.
Section 4 records how requirements were gathered. Section 5 specifies functional
requirements. Section 6 specifies non-functional requirements. Sections 7 and 8 record
constraints and assumptions. Section 9 provides traceability.

---

# 2. Overall Description

## 2.1 Product Perspective

HealthEasy-G is a self-contained web application. It replaces the paper folder system and
the disconnected spreadsheets that currently coexist in many Ghanaian facilities. It is not
a component of a larger product, but it is designed to interoperate with the national
systems a facility is obliged to report to:

```
        National Identification          NHIA CLAIM-it            GHS DHIMS2
             Authority                   (claims)                 (returns)
                 │                           │                        │
                 │  (format validation       │  (batch export         │  (computed
                 │   today; live check       │   today; direct        │   figures today;
                 │   is future work)         │   API is future work)  │   file export is
                 │                           │                        │   future work)
        ┌────────┴───────────────────────────┴────────────────────────┴────────┐
        │                    HealthEasy-G Hospital Management System           │
        └───────────────────────────────────────────────────────────────────────┘
                 │                    │                     │
           Facility staff       PostgreSQL             Ollama clinical
           (19 roles)           database               assistant (optional)
```

## 2.2 Product Functions

At the highest level the system performs eight functions:

1. **Registers and identifies patients** uniquely and prevents duplicates.
2. **Routes patients** between departments through managed queues.
3. **Records clinical care** — vitals, consultations, diagnoses and orders.
4. **Executes diagnostic orders** in the laboratory and radiology departments.
5. **Manages inpatient stay** — beds, transfers and medication administration.
6. **Controls medicine stock** and dispenses against prescriptions.
7. **Collects revenue** and prepares national health insurance claims.
8. **Reports and governs** — statutory returns, licence tracking and audit.

## 2.3 User Classes and Characteristics

The system defines 19 roles across four hierarchy levels. Each role has an explicit set of
permitted actions and an explicit set of prohibitions.

| Level | Role | Characteristics |
| :--- | :--- | :--- |
| 1 | Super Admin | Technical administrator. Manages facilities, configuration and system security. **Barred from clinical records by data-protection rule.** |
| 2 | Hospital Director | Executive oversight of one facility. Reporting and approvals. |
| 2 | System Auditor | Compliance monitoring. Read-only on audit logs; no clinical or financial access. |
| 3 | Hospital Admin | Operational management, staff scheduling, refund authorisation. |
| 3 | OPD / Medical Records | Front desk. Registration, MPI lookup, record merge, queue routing. |
| 3 | Doctor | Consultation, ICD-10 diagnosis, clinical ordering, prescribing, discharge. |
| 3 | Nurse | Triage vitals, nursing notes, medication administration, monitoring. |
| 3 | Ward Manager | Bed allocation, ADT workflow, ward supplies. |
| 3 | Theatre Nurse | Theatre preparation, sterile field, recovery monitoring. |
| 3 | Laboratory Technician | Sample receipt, testing, result entry and verification. |
| 3 | Radiographer | Performs imaging, uploads studies. Cannot interpret. |
| 3 | Radiologist | Interprets images, writes and signs reports. |
| 3 | Pharmacist | Prescription verification, dispensing, counselling, stock control. |
| 3 | Cashier | Payment collection and receipting. Cannot authorise refunds alone. |
| 4 | Finance Officer | Revenue analysis, budgeting, claim reconciliation. |
| 4 | Claims Officer | NHIS eligibility, claim preparation and submission. |
| 4 | HR Officer | Staff records, licence verification, rosters. No clinical access. |
| 4 | Procurement Officer | Purchase requests and supplier management. |
| 4 | Store Keeper | Central stores, stock receipt and transfer. |

Technical proficiency across these roles varies widely, from IT administrators to clinical
staff with limited computer experience. The interface is therefore designed around
task-shaped screens rather than generic data grids.

## 2.4 Operating Environment

| Element | Requirement |
| :--- | :--- |
| Client | Any modern browser (Chrome, Edge, Firefox, Safari — current and previous major version) on desktop, laptop or tablet |
| Server | Node.js 20+ runtime; deployed on Vercel serverless infrastructure |
| Database | PostgreSQL 14 or later; Neon serverless PostgreSQL in the deployed environment |
| Network | HTTPS. The system also runs entirely against a local PostgreSQL instance when a facility has no internet connectivity |
| Optional | An Ollama host for the clinical assistant; absent it, a deterministic rule engine is used |

## 2.5 Design and Implementation Constraints

Recorded in full in Section 7.

## 2.6 User Documentation

A role-by-role user manual accompanies the system (`docs/User_Manual.md`), together with a
system administration and maintenance guide.

---

# 3. Stakeholder Analysis

## 3.1 Stakeholder Register

| Stakeholder | Type | Interest | Influence | Engagement |
| :--- | :--- | :--- | :--- | :--- |
| Patients | External, primary beneficiary | Accurate records, shorter waits, correct bills | Low direct, high moral | Requirements derived from care pathway analysis |
| Clinical staff (doctors, nurses) | Internal, primary user | Fast access to a complete record; minimal typing | High | Workflow interviews; task-shaped screen design |
| Front-desk / records staff | Internal, primary user | Fast registration, duplicate prevention | High | Registration workflow analysis |
| Diagnostic staff (laboratory, radiology) | Internal, primary user | Clear worklist, traceable specimens | Medium | Order-to-result workflow analysis |
| Pharmacy staff | Internal, primary user | Accurate stock, safe dispensing | Medium | FEFO and dispensing workflow analysis |
| Cashiers and finance | Internal, primary user | Correct charges, reconciled collections | Medium | Billing workflow analysis |
| Claims officers | Internal, primary user | Clean claims that pass NHIA vetting | High | Claim rejection cause analysis |
| Hospital Director / Administration | Internal, decision maker | Operational visibility, compliance | High | Reporting requirements |
| System Auditor | Internal, governance | Complete, tamper-evident audit trail | Medium | Audit requirements |
| IT administrator | Internal, support | Maintainability, deployability | Medium | Operational requirements |
| Ghana Health Service | External, regulator | DHIMS2 returns | High | Statutory reporting requirements |
| NHIA | External, payer | Valid, well-formed claims | High | G-DRG claim structure |
| HeFRA | External, regulator | Facility licensing compliance | High | Licence tracking requirements |
| Data Protection Commission | External, regulator | Lawful processing of health data | High | Access control and audit requirements |
| Course supervisor / examiner | External, assessor | Demonstrable engineering quality | High | Coursework specification |

## 3.2 Stakeholder Influence–Interest Grid

```
   High │  Clinical staff          │  Hospital Director
        │  Front-desk staff        │  Claims Officer
Interest│  Pharmacy staff          │  GHS · NHIA · HeFRA · DPC
        │                          │  Course examiner
        ├──────────────────────────┼──────────────────────────
        │  Patients                │  IT administrator
    Low │  Procurement             │  System Auditor
        └──────────────────────────┴──────────────────────────
              Low                        High
                          Influence
```

**Engagement strategy.** High-influence, high-interest stakeholders (clinical leadership,
regulators, the examiner) drove the requirement set directly. High-interest but
lower-influence users (clinical and front-desk staff) shaped the interaction design.
Regulator requirements were treated as non-negotiable constraints rather than features.

---

# 4. Requirements Gathering and Analysis

## 4.1 Elicitation Techniques

Because the project is an academic capstone rather than a commissioned build, requirements
were elicited from documentary and observational sources rather than from a paying client:

| Technique | Application |
| :--- | :--- |
| **Document analysis** | Ghana Health Service operating procedures, NHIA G-DRG claim structure and rejection criteria, DHIMS2 monthly return forms, HeFRA licensing requirements, Data Protection Act 843, Ghana Standard Treatment Guidelines |
| **Process modelling** | The OPD patient journey was traced end to end — arrival, registration, triage, consultation, diagnostics, pharmacy, cashier, departure — and each hand-off point examined for the information it requires and produces |
| **Artefact analysis** | Paper forms in common use (OPD attendance register, triage sheet, laboratory request form, prescription sheet, NHIS claim form) were decomposed into their data fields |
| **Role decomposition** | The staffing structure of a regional hospital was decomposed into the 19 roles, and each role's authority and prohibitions were derived from professional scope of practice |
| **Failure analysis** | Known failure modes of paper systems — duplicate folders, lost results, expired-stock dispensing, rejected claims — were converted into preventive requirements |
| **Prototyping** | Screens were built early and reviewed within the team, then revised. Several requirements (for example, the need for a queue ticket per department rather than a single global counter) emerged only from using the prototype |

## 4.2 Analysis Method

Requirements were analysed in three passes:

1. **Classification.** Each elicited statement was classified as functional, non-functional,
   constraint or assumption.
2. **Conflict resolution.** Conflicts were identified and resolved explicitly. The most
   significant is recorded in §4.3.
3. **Prioritisation.** MoSCoW prioritisation was applied. Every *Must* requirement is
   implemented in the delivered system; *Could* and *Won't* items appear in the future
   evolution roadmap.

## 4.3 Notable Requirements Conflicts and Their Resolution

**Conflict 1 — Administrator capability versus data protection.**
An IT administrator conventionally holds unrestricted access for support purposes. The Data
Protection Act and DPC guidance require that access to personal health data be limited to
those with a care or administrative need. *Resolution:* the Super Admin role is barred at the
server from reading the patient index, vitals and consultation notes. Operational visibility
is preserved through an aggregate statistics endpoint that returns counts with no
identifiers. This is enforced in code, not policy (FR-SEC-04, FR-RPT-03).

**Conflict 2 — Registration speed versus duplicate prevention.**
Front-desk staff need to register quickly, especially in emergencies. Duplicate prevention
requires validation that slows registration. *Resolution:* the Ghana Card uniqueness check is
enforced absolutely, but an emergency fast-track path allows registration of an unidentified
patient with a placeholder identifier, to be merged later (FR-PAT-02, FR-PAT-06).

**Conflict 3 — Clinician autonomy versus result verification.**
Laboratory technicians need to enter results promptly; releasing an unverified result to the
clinical record is unsafe. *Resolution:* result entry and result verification are separated
into two permissions. The same person may hold both, but the transition to *Verified* is
recorded distinctly and attributed (FR-LAB-03, FR-LAB-04).

**Conflict 4 — Offline operation versus centralised data.**
Facilities experience internet outages, but centralised data is required for multi-facility
oversight. *Resolution:* the system runs against either a local or a cloud PostgreSQL
instance, selected by configuration, with an identical schema (NFR-AVL-02, C-07).

## 4.4 Requirements Prioritisation Summary

| Priority | Count | Status |
| :--- | :--- | :--- |
| Must have | 61 | All implemented |
| Should have | 14 | All implemented |
| Could have | 9 | 3 implemented; 6 in the roadmap |
| Won't have (this release) | 7 | Documented in the roadmap |

---

# 5. Functional Requirements

Each requirement carries an identifier, a priority (M = Must, S = Should, C = Could) and a
verification reference. "Verified by" points to the evidence in `Testing_Report.md`.

## 5.1 Authentication and Session Management (AUTH)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-AUTH-01 | The system shall authenticate staff by email address and password. | M | TC-AUTH-01 |
| FR-AUTH-02 | Passwords shall be stored only as bcrypt hashes; the system shall never store or transmit a plaintext password. | M | Code review, TC-SEC-05 |
| FR-AUTH-03 | On successful authentication the system shall issue a cryptographically signed session token in an `httpOnly` cookie. | M | TC-AUTH-03 |
| FR-AUTH-04 | The system shall reject any session token whose signature does not verify, whose payload has been altered, or whose expiry has passed. | M | TC-SEC-01, TC-SEC-02, TC-SEC-03 |
| FR-AUTH-05 | The system shall return an identical response for an unknown email address and an incorrect password, preventing account enumeration. | M | TC-SEC-06 |
| FR-AUTH-06 | The system shall refuse authentication for staff accounts whose status is not Active. | M | TC-AUTH-04 |
| FR-AUTH-07 | The system shall throttle repeated failed sign-in attempts from the same source. | S | TC-SEC-07 |
| FR-AUTH-08 | The system shall terminate a session on sign-out and record the event. | M | TC-AUTH-05 |
| FR-AUTH-09 | Sessions shall expire after a configurable period, defaulting to one eight-hour shift. | M | TC-SEC-03 |

## 5.2 Patient Administration (PAT)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-PAT-01 | The system shall register a patient capturing name, date of birth, gender, contact, Ghana Card number, residential and digital address, next of kin, blood group, allergies and chronic conditions. | M | TC-PAT-01 |
| FR-PAT-02 | The system shall reject registration where the Ghana Card number already exists, and shall identify the existing record. | M | TC-PAT-02 |
| FR-PAT-03 | The system shall allocate a unique sequential Medical Record Number to each patient. | M | TC-PAT-03 |
| FR-PAT-04 | The system shall record NHIS membership number, status and expiry where the patient is insured. | M | TC-PAT-01 |
| FR-PAT-05 | The system shall support search and retrieval of patient records by name, MRN and Ghana Card number. | M | TC-PAT-04 |
| FR-PAT-06 | The system shall support fast-track registration of an unidentified emergency patient. | S | TC-PAT-05 |
| FR-PAT-07 | The system shall support merging duplicate patient records, retaining the surviving MRN. | C | Roadmap |
| FR-PAT-08 | The system shall route a newly registered patient into the triage queue automatically. | M | TC-PAT-06 |

## 5.3 Queue and Patient Flow (QUE)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-QUE-01 | The system shall issue a queue ticket for each department a patient is routed to. | M | TC-QUE-01 |
| FR-QUE-02 | Queue numbers shall be sequential within a department and within a day. | M | TC-QUE-01 |
| FR-QUE-03 | The system shall display waiting time derived from the age of the queue entry. | M | TC-QUE-02 |
| FR-QUE-04 | The system shall support priority levels of Normal, Urgent and Emergency, ordering the queue accordingly. | M | TC-QUE-03 |
| FR-QUE-05 | The system shall transition a queue entry through Waiting, In Consultation, Completed and Transferred. | M | TC-QUE-04 |

## 5.4 Triage and Vital Signs (TRI)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-TRI-01 | The system shall record blood pressure, pulse, temperature, respiratory rate, oxygen saturation, weight, height, blood glucose and pain score. | M | TC-TRI-01 |
| FR-TRI-02 | The system shall compute Body Mass Index from the recorded weight and height. | M | TC-TRI-02 |
| FR-TRI-03 | The system shall record an Emergency Severity Index level from 1 to 5 as assigned by the triage nurse. | M | TC-TRI-03 |
| FR-TRI-04 | The system shall derive abnormality alerts from the recorded observations against Ghana Health Service triage thresholds. | M | TC-TRI-04 |
| FR-TRI-05 | The system shall attribute each vitals record to the staff member who recorded it, taken from the authenticated session. | M | TC-SEC-08 |

## 5.5 Clinical Consultation and EMR (EMR)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-EMR-01 | The system shall record presenting complaint, history, past medical history, examination findings, clinical notes and treatment plan. | M | TC-EMR-01 |
| FR-EMR-02 | The system shall record one or more ICD-10 diagnoses per encounter. | M | TC-EMR-02 |
| FR-EMR-03 | The system shall present the patient's previous encounters, vitals and results to the consulting clinician. | M | TC-EMR-03 |
| FR-EMR-04 | The system shall allow the clinician to raise laboratory, radiology, prescription, admission and procedure orders within the consultation. | M | TC-EMR-04 |
| FR-EMR-05 | Raising an order shall automatically create the corresponding departmental work item and billing line. | M | TC-INT-01 |
| FR-EMR-06 | The system shall attribute each encounter to the signing clinician from the authenticated session. | M | TC-SEC-08 |
| FR-EMR-07 | The system shall support issuing a sick-leave certificate with a specified number of days. | S | TC-EMR-05 |

## 5.6 Laboratory (LAB)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-LAB-01 | The system shall maintain a laboratory test catalogue with code, name, category, specimen type, cost and NHIS coverage. | M | TC-LAB-01 |
| FR-LAB-02 | The system shall allocate a unique specimen barcode to each laboratory order. | M | TC-LAB-02 |
| FR-LAB-03 | The system shall progress an order through Ordered, Specimen Collected, In Analysis, Verified and Completed. | M | TC-LAB-03 |
| FR-LAB-04 | The transition to Verified shall require the `VERIFY_LAB_RESULTS` permission and shall record the verifying officer and time. | M | TC-LAB-04, TC-SEC-09 |
| FR-LAB-05 | The system shall record result parameters with value, unit, reference range and abnormal/critical flags. | M | TC-LAB-05 |
| FR-LAB-06 | Order metadata shall be taken from the test catalogue rather than from the request, so specimen type and category remain consistent. | S | TC-LAB-06 |

## 5.7 Radiology (RAD)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-RAD-01 | The system shall record radiology orders with modality, body part, clinical indication and pregnancy screening. | M | TC-RAD-01 |
| FR-RAD-02 | The system shall allocate a unique PACS accession number to each study. | M | TC-RAD-02 |
| FR-RAD-03 | The system shall separate performing an imaging study from interpreting it: only a holder of `WRITE_RADIOLOGY_REPORT` may issue a report. | M | TC-RAD-03, TC-SEC-10 |
| FR-RAD-04 | The system shall record and flag critical findings. | S | TC-RAD-04 |

## 5.8 Inpatient and Wards (WRD)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-WRD-01 | The system shall maintain a bed register with ward, bed number, type, daily rate and status. | M | TC-WRD-01 |
| FR-WRD-02 | The system shall support bed states of Available, Occupied, Reserved, Cleaning, Maintenance and Isolation. | M | TC-WRD-02 |
| FR-WRD-03 | The system shall refuse to assign an occupied bed to a different patient. | M | TC-WRD-03 |
| FR-WRD-04 | The system shall maintain a medication administration record with scheduled, administered, omitted and refused states. | M | TC-WRD-04 |
| FR-WRD-05 | Recording a dose as omitted or refused shall require a reason. | M | TC-WRD-05 |

## 5.9 Pharmacy (PHM)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-PHM-01 | The system shall maintain drug stock by batch, with expiry, quantity, reorder level, cost and selling price. | M | TC-PHM-01 |
| FR-PHM-02 | The system shall present stock in First-Expiry-First-Out order. | M | TC-PHM-02 |
| FR-PHM-03 | The system shall record dispensing against a prescription and deduct stock in the same atomic transaction. | M | TC-PHM-03, TC-INT-02 |
| FR-PHM-04 | The system shall refuse to dispense more than the quantity held. | M | TC-PHM-04 |
| FR-PHM-05 | The system shall refuse to dispense from an expired batch. | M | TC-PHM-05 |
| FR-PHM-06 | The system shall flag controlled substances. | M | TC-PHM-06 |
| FR-PHM-07 | The system shall record counselling notes against a dispense. | S | TC-PHM-07 |

## 5.10 Billing and Revenue (BIL)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-BIL-01 | The system shall generate an invoice with itemised lines for every chargeable service. | M | TC-BIL-01 |
| FR-BIL-02 | Invoice totals shall be recomputed on the server from the line items, not accepted from the client. | M | TC-SEC-11 |
| FR-BIL-03 | The system shall apply NHIS exemption to covered items for insured patients. | M | TC-BIL-02 |
| FR-BIL-04 | The system shall record payments by cash, mobile money, card, insurance and corporate account. | M | TC-BIL-03 |
| FR-BIL-05 | The system shall refuse a payment exceeding the invoice total. | M | TC-BIL-04 |
| FR-BIL-06 | Reducing a settled amount shall require the `PROCESS_REFUNDS` permission. | M | TC-BIL-05, TC-SEC-12 |
| FR-BIL-07 | The system shall issue a uniquely numbered receipt. | M | TC-BIL-06 |

## 5.11 NHIS Claims (CLM)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-CLM-01 | The system shall generate a claim line from the encounter diagnosis and the service tariff. | M | TC-CLM-01 |
| FR-CLM-02 | Claim demographics shall be read from the patient record, never from the request body. | M | TC-CLM-02 |
| FR-CLM-03 | The system shall flag claims with a missing NHIS number, an expired card or no diagnosis code, and hold them as Draft. | M | TC-CLM-03 |
| FR-CLM-04 | The claim total shall be computed as the sum of the service and medicine tariffs. | M | TC-CLM-04 |
| FR-CLM-05 | The system shall assemble validated claims into a monthly batch, computing the count and total from the lines it carries. | M | TC-CLM-05 |
| FR-CLM-06 | Batching shall stamp each claim atomically so that no claim can be submitted in two batches. | M | TC-CLM-06, TC-INT-03 |
| FR-CLM-07 | The system shall progress a batch through Prepared, Exported, Submitted and Reconciled, settling claims on reconciliation. | M | TC-CLM-07 |

## 5.12 Inventory and Procurement (INV)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-INV-01 | The system shall maintain store items with code, category, location, batch, expiry, quantity, unit, price and reorder point. | M | TC-INV-01 |
| FR-INV-02 | The system shall derive stock status (In Stock, Low Stock, Near Expiry, Expired) from quantity and expiry rather than storing it. | M | TC-INV-02 |
| FR-INV-03 | The system shall support items with no expiry date. | M | TC-INV-03 |

## 5.13 Reporting and Governance (RPT)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-RPT-01 | The system shall compute the DHIMS2 monthly return from live clinical data, including attendance disaggregated by age band and sex, and the five leading diagnoses. | M | TC-RPT-01 |
| FR-RPT-02 | Figures that the system cannot derive — deaths and maternal deliveries — shall be captured from the records officer. | M | TC-RPT-02 |
| FR-RPT-03 | The system shall provide aggregate operational statistics containing no patient identifiers. | M | TC-RPT-03 |
| FR-RPT-04 | The system shall track HeFRA facility licence numbers, expiry and status. | M | TC-RPT-04 |
| FR-RPT-05 | The system shall track staff professional licences and flag those expiring within 90 days. | M | TC-RPT-05 |

## 5.14 Security and Access Control (SEC)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-SEC-01 | The system shall implement role-based access control across 19 roles and 62 permissions. | M | TC-SEC-13 |
| FR-SEC-02 | Access control shall be enforced on the server for every request; client-side checks are advisory only. | M | TC-SEC-14 |
| FR-SEC-03 | Any endpoint or method without an explicit access policy shall be denied. | M | TC-SEC-15 |
| FR-SEC-04 | The Super Admin role shall be denied access to the patient index, vital signs and consultation notes. | M | TC-SEC-16 |
| FR-SEC-05 | The acting identity on every write shall be taken from the authenticated session, never from the request body. | M | TC-SEC-08 |
| FR-SEC-06 | The system shall maintain an append-only audit trail recording actor, role, action, subject, detail, time and source address. | M | TC-SEC-17 |
| FR-SEC-07 | The system shall validate the type, length and range of safety-critical input. | M | TC-SEC-18 |
| FR-SEC-08 | Staff credential hashes shall never be transmitted to a client. | M | TC-SEC-05 |

## 5.15 Clinical Decision Support (AI)

| ID | Requirement | Priority | Verified by |
| :--- | :--- | :--- | :--- |
| FR-AI-01 | The system shall suggest prescriptions from the patient's diagnoses, vitals, allergies, chronic conditions, laboratory results and history. | S | TC-AI-01 |
| FR-AI-02 | Suggestions shall be restricted to medicines actually held in the facility's stock. | M | TC-AI-02 |
| FR-AI-03 | Suggestions conflicting with a recorded allergy shall be flagged, with the conflict re-derived locally rather than accepted from the model. | M | TC-AI-03 |
| FR-AI-04 | Where the model is unavailable the system shall fall back to a deterministic Ghana Standard Treatment Guidelines rule engine. | M | TC-AI-04 |
| FR-AI-05 | The response shall identify whether it originated from the model or the rule engine. | S | TC-AI-05 |
| FR-AI-06 | Suggestions shall be advisory; the prescribing decision shall remain with the clinician. | M | Design review |

---

# 6. Non-Functional Requirements

## 6.1 Performance (PRF)

| ID | Requirement | Target | Verified by |
| :--- | :--- | :--- | :--- |
| NFR-PRF-01 | Page load (first contentful paint) on a broadband connection | ≤ 2.0 s | TC-PRF-01 |
| NFR-PRF-02 | API response for a single-collection read | ≤ 800 ms at the 95th percentile | TC-PRF-02 |
| NFR-PRF-03 | Authentication round trip | ≤ 1.5 s | TC-PRF-03 |
| NFR-PRF-04 | Dashboard aggregate statistics | ≤ 1.5 s | TC-PRF-04 |
| NFR-PRF-05 | The system shall support at least 50 concurrent staff sessions per facility | 50 | TC-PRF-05 |

## 6.2 Security (SECU)

| ID | Requirement |
| :--- | :--- |
| NFR-SECU-01 | All traffic in the deployed environment shall be served over HTTPS. |
| NFR-SECU-02 | Session cookies shall be `httpOnly`, `SameSite=Lax`, and `Secure` in production. |
| NFR-SECU-03 | Session tokens shall be signed with HMAC-SHA256 using a secret of at least 32 characters; the system shall refuse to sign sessions in production with a weaker secret. |
| NFR-SECU-04 | Signature comparison shall be constant-time. |
| NFR-SECU-05 | Passwords shall be hashed with bcrypt at a work factor of at least 10. |
| NFR-SECU-06 | Database credentials shall never be committed to version control nor written to logs. |
| NFR-SECU-07 | Database access shall be parameterised through an ORM, eliminating string-concatenated SQL. |

## 6.3 Reliability and Availability (AVL)

| ID | Requirement |
| :--- | :--- |
| NFR-AVL-01 | Target availability of 99% during facility operating hours. |
| NFR-AVL-02 | The system shall operate against a local database when external connectivity is unavailable. |
| NFR-AVL-03 | Operations spanning more than one table shall be atomic; a partial write shall not be observable. |
| NFR-AVL-04 | A failed write shall be reported to the user rather than silently discarded. |

## 6.4 Usability (USA)

| ID | Requirement |
| :--- | :--- |
| NFR-USA-01 | A user shall reach any permitted module within two clicks of the dashboard. |
| NFR-USA-02 | The interface shall be usable on screens from 360 px to 2560 px wide. |
| NFR-USA-03 | Error messages shall state what failed and what the user should do next. |
| NFR-USA-04 | Denied access shall be explained, naming the role and the missing authority. |
| NFR-USA-05 | Light and dark themes shall both be available, with light as the default and the choice persisted. |
| NFR-USA-06 | Motion shall be suppressed for users who have requested reduced motion. |

## 6.5 Maintainability (MNT)

| ID | Requirement |
| :--- | :--- |
| NFR-MNT-01 | The codebase shall be written in TypeScript under `strict` compilation with no type errors. |
| NFR-MNT-02 | Access policy shall be declared in one place rather than scattered through handlers. |
| NFR-MNT-03 | Conversion between storage and presentation shapes shall occur at a single boundary. |
| NFR-MNT-04 | Automated tests shall cover session security, access policy, data conversion and date handling. |
| NFR-MNT-05 | Continuous integration shall run typecheck, tests and build on every change. |
| NFR-MNT-06 | Database schema changes shall be applied through versioned migrations. |

## 6.6 Portability and Compatibility (PRT)

| ID | Requirement |
| :--- | :--- |
| NFR-PRT-01 | The system shall run on any platform supporting Node.js 20+ and PostgreSQL 14+. |
| NFR-PRT-02 | The same code shall run against local and cloud PostgreSQL without modification. |
| NFR-PRT-03 | The system shall function on the current and previous major versions of Chrome, Edge, Firefox and Safari. |

## 6.7 Compliance (CMP)

| ID | Requirement |
| :--- | :--- |
| NFR-CMP-01 | Processing of personal health data shall satisfy the Data Protection Act, 2012 (Act 843): access limited to those with a legitimate need, and every access recorded. |
| NFR-CMP-02 | Claim data structure shall conform to the NHIA G-DRG format. |
| NFR-CMP-03 | Statutory reporting figures shall conform to the DHIMS2 monthly return structure. |
| NFR-CMP-04 | Facility licensing data shall conform to HeFRA requirements. |
| NFR-CMP-05 | Clinical decision support shall be grounded in the Ghana Standard Treatment Guidelines. |

---

# 7. System Constraints

| ID | Constraint | Origin | Consequence |
| :--- | :--- | :--- | :--- |
| C-01 | The system must be deployable to a serverless platform (Vercel) | Coursework requirement | No long-lived in-process state; rate limiting is process-local and documented as such |
| C-02 | PostgreSQL is the required datastore | Team decision, relational integrity of clinical data | Schema is relational; no document store |
| C-03 | Live NHIA and NIA verification requires an accredited integration agreement unavailable to a student project | External, regulatory | Card and membership numbers are validated for format and internal consistency only |
| C-04 | DICOM image storage is beyond the available infrastructure budget | Resource | Radiology is metadata-only |
| C-05 | The clinical assistant must not depend on a paid external API | Cost, and offline operation | Ollama with a local rule-engine fallback rather than a hosted model |
| C-06 | Development timeframe is one academic semester | Schedule | Scope limited to the modules in §1.2 |
| C-07 | Facilities experience intermittent connectivity | Environmental | Local/cloud database switching is a first-class feature |
| C-08 | Clinical staff have widely varying computer literacy | User population | Task-shaped screens; explanatory errors |
| C-09 | Health data is subject to Act 843 | Legal | Server-enforced access control and an immutable audit trail are mandatory, not optional |
| C-10 | The application must remain publicly accessible for grading | Coursework | Deployed on Vercel with a managed database |

---

# 8. Assumptions and Dependencies

## 8.1 Assumptions

| ID | Assumption | Risk if false |
| :--- | :--- | :--- |
| A-01 | Each patient possesses, or can be issued, a unique Ghana Card number | Duplicate prevention weakens; the emergency fast-track path partially mitigates |
| A-02 | Staff each have an individual account and do not share credentials | Audit attribution becomes meaningless |
| A-03 | The facility has electricity and a local network during operating hours | The system is unavailable; paper fallback required |
| A-04 | ICD-10 and G-DRG code sets remain stable within a release cycle | Codes require updating; handled as adaptive maintenance |
| A-05 | Browsers used are current or one major version behind | Layout and script failures on legacy browsers |
| A-06 | A database backup regime is operated by the hosting provider or the facility | Data loss on failure |
| A-07 | Clinical users exercise professional judgement over decision-support suggestions | Inappropriate prescribing; mitigated by advisory framing and allergy re-checking |

## 8.2 Dependencies

| Dependency | Purpose | Failure behaviour |
| :--- | :--- | :--- |
| PostgreSQL | System of record | The system cannot operate; errors are surfaced rather than hidden |
| Vercel | Hosting | The deployed instance is unavailable; local operation is unaffected |
| Neon | Managed database | Switch `DATABASE_TARGET` to `local` |
| Ollama host | Clinical assistant | Automatic fallback to the GSTG rule engine |
| Google Fonts | Typography | Fonts are self-hosted at build time by `next/font`; no runtime dependency |
| npm registry | Build-time dependency resolution | Builds fail; runtime unaffected |

---

# 9. Requirements Traceability

## 9.1 Requirement to Implementation

| Requirement group | Principal implementation |
| :--- | :--- |
| FR-AUTH | `src/lib/session.ts`, `src/app/api/auth/*`, `src/lib/rate-limit.ts` |
| FR-PAT | `src/app/api/patients/route.ts`, `src/app/(DashboardLayout)/patient-registration/` |
| FR-QUE | `src/app/api/queues/route.ts`, `src/app/(DashboardLayout)/patient-flow/` |
| FR-TRI | `src/app/api/vitals/route.ts`, `src/app/(DashboardLayout)/triage/` |
| FR-EMR | `src/app/api/encounters/route.ts`, `src/app/(DashboardLayout)/emr-consultation/` |
| FR-LAB | `src/app/api/lab-orders/route.ts`, `src/app/api/lab-catalogue/route.ts` |
| FR-RAD | `src/app/api/radiology/route.ts` |
| FR-WRD | `src/app/api/beds/route.ts`, `src/app/api/mar/route.ts` |
| FR-PHM | `src/app/api/pharmacy/route.ts`, `src/app/api/pharmacy/dispense/route.ts` |
| FR-BIL | `src/app/api/billing/route.ts` |
| FR-CLM | `src/app/api/nhis-claims/route.ts`, `src/app/api/nhis-batches/route.ts` |
| FR-INV | `src/app/api/inventory/route.ts` |
| FR-RPT | `src/app/api/dhims2/route.ts`, `src/app/api/stats/route.ts` |
| FR-SEC | `src/proxy.ts`, `src/lib/api-guard.ts`, `src/lib/api-policy.ts`, `src/lib/types/rbac.ts`, `src/lib/validation.ts` |
| FR-AI | `src/app/api/ai-assistant/route.ts` |

## 9.2 Requirement to Test

Full mapping is given in `Testing_Report.md` §4. Every *Must* requirement has at least one
corresponding test case; requirements marked "Roadmap" are not tested in this release and
are recorded in `Maintenance_and_Evolution.md`.

---

**End of Software Requirements Specification**
