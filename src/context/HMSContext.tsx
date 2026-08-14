'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  AuditLogEntry
} from '@/lib/types/hms';
import { UserRole, Permission, ROLE_DEFINITIONS } from '@/lib/types/rbac';
import { ApiError, api, loadCollection } from '@/lib/api-client';

/* ------------------------------------------------------------------ *
 * Reference data with no database table yet
 *
 * Everything else is loaded from PostgreSQL. The previous version seeded
 * ~900 lines of fabricated patients, queues, encounters, invoices and claims
 * into state and only replaced them when an endpoint returned a non-empty
 * list — so an empty table silently displayed convincing fake data, and no
 * one could tell which screens were real.
 * ------------------------------------------------------------------ */

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

/** Aggregate counts from `/api/stats` — carries no patient identifiers. */
export interface FacilityStats {
  patients: number;
  patientsToday: number;
  queueWaiting: number;
  queueInConsultation: number;
  bedsTotal: number;
  bedsOccupied: number;
  bedOccupancyRate: number;
  encountersToday: number;
  labsPending: number;
  radiologyPending: number;
  unpaidInvoiceCount: number;
  outstandingBalanceGhc: number;
  pendingClaimCount: number;
  pendingClaimGhc: number;
  lowStockCount: number;
  expiringBatchCount: number;
  facilities: number;
  activeStaff: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hierarchyLevel: number;
  staffId: string;
  department: string;
}

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
  stats: FacilityStats | null;

  // Auth & session state
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  /** True until the server session has been checked; guards render decisions. */
  sessionLoading: boolean;
  isLoadingData: boolean;
  loginUser: (userData: SessionUser) => void;
  logout: () => Promise<void>;

  // RBAC (advisory in the browser — the server is the enforcement point)
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
  canAccessRoute: (routePath: string) => boolean;

  // Multi-facility state
  activeFacilityId: string;
  setActiveFacilityId: (id: string) => void;

  // Error surface — set whenever a write is rejected
  lastError: string | null;
  clearError: () => void;

  // Actions. Each returns the saved record, or null when the write failed;
  // the reason is put on `lastError` and shown to the user.
  refreshAll: () => Promise<void>;
  addFacility: (facilityData: Omit<FacilityBranch, 'id' | 'createdDate'>) => Promise<FacilityBranch | null>;
  updateFacilityStatus: (id: string, status: FacilityBranch['status']) => Promise<boolean>;
  registerPatient: (
    patient: Omit<PatientRecord, 'id' | 'mrn' | 'registrationDate'>
  ) => Promise<PatientRecord | null>;
  addQueueItem: (item: Omit<QueueItem, 'id' | 'waitingMinutes'>) => Promise<QueueItem | null>;
  updateQueueStatus: (id: string, status: QueueItem['status'], location: string) => Promise<boolean>;
  recordVitals: (vital: Omit<VitalSigns, 'id' | 'timestamp'>) => Promise<VitalSigns | null>;
  createEncounter: (encounter: Omit<EMREncounter, 'id' | 'timestamp'>) => Promise<EMREncounter | null>;
  updateBedStatus: (
    bedId: string,
    status: InpatientBed['status'],
    patientId?: string,
    patientName?: string,
    mrn?: string
  ) => Promise<boolean>;
  recordLabResult: (
    labOrderId: string,
    results: LabOrderRecord['results'],
    techName: string
  ) => Promise<boolean>;
  dispenseMedication: (
    prescriptionId: string,
    patientId: string,
    mrn: string,
    patientName: string,
    drugName: string,
    qty: number,
    batchNo: string,
    pharmacist: string
  ) => Promise<boolean>;
  addAuditLog: (
    action: string,
    userName: string,
    role: string,
    details: string,
    mrn?: string,
    patientId?: string
  ) => Promise<void>;
}

const HMSContext = createContext<HMSContextType | undefined>(undefined);

export const HMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const [activeFacilityId, setActiveFacilityId] = useState<string>('fac-1');

  const [facilities, setFacilities] = useState<FacilityBranch[]>([]);
  const [staff, setStaff] = useState<StaffCredential[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [encounters, setEncounters] = useState<EMREncounter[]>([]);
  const [beds, setBeds] = useState<InpatientBed[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderRecord[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrderRecord[]>([]);
  const [pharmacyBatches, setPharmacyBatches] = useState<PharmacyBatchItem[]>([]);
  const [dispenseRecords, setDispenseRecords] = useState<PrescriptionDispenseRecord[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [nhisClaims, setNhisClaims] = useState<NHISClaimLine[]>([]);
  const [inventory, setInventory] = useState<InventoryStoreItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<FacilityStats | null>(null);

  const [mar] = useState<MedicationAdministrationRecord[]>(INITIAL_MAR);
  const [nhisBatches] = useState<NHISClaimBatch[]>(INITIAL_NHIS_BATCHES);
  const [dhimsReport] = useState<DHIMSReportSummary>(INITIAL_DHIMS);

  const isAuthenticated = currentUser !== null;
  const currentRole = (currentUser?.role ?? 'Super Admin') as UserRole;

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  /** Turns a failed write into a message the user can act on. */
  const reportFailure = useCallback((action: string, error: unknown) => {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) {
        setLastError('Your session has expired. Please sign in again.');
        setCurrentUser(null);
        return;
      }
      setLastError(`${action} failed — ${error.reason ?? error.message}`);
      return;
    }

    console.error(`${action} failed:`, error);
    setLastError(`${action} failed — unexpected error. See the browser console for details.`);
  }, []);

  /* ---------------------------------------------------------------- *
   * Session
   * ---------------------------------------------------------------- */

  // Identity comes from the signed, httpOnly session cookie via the server.
  // It used to be read from localStorage, where anyone could edit their own
  // role to "Super Admin" with two lines in the console.
  useEffect(() => {
    let cancelled = false;

    api
      .get<{ authenticated: boolean; user: SessionUser }>('/api/auth/session')
      .then((data) => {
        if (!cancelled && data?.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {
        /* Not signed in — middleware handles the redirect. */
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loginUser = useCallback((userData: SessionUser) => {
    // The cookie was already set by /api/auth/login; this only primes local
    // state so the dashboard renders without a second round trip.
    setCurrentUser(userData);
    setSessionLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
  }, []);

  /* ---------------------------------------------------------------- *
   * Data loading
   * ---------------------------------------------------------------- */

  const refreshAll = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Collections the signed-in role may not read come back empty rather
      // than throwing — a Cashier simply has no laboratory worklist.
      const [
        facilityRows,
        staffRows,
        patientRows,
        queueRows,
        vitalRows,
        encounterRows,
        labRows,
        pharmacyRows,
        bedRows,
        radiologyRows,
        invoiceRows,
        claimRows,
        inventoryRows,
        auditRows,
        dispenseRows
      ] = await Promise.all([
        loadCollection<FacilityBranch>('/api/facilities'),
        loadCollection<StaffCredential>('/api/staff'),
        loadCollection<PatientRecord>('/api/patients'),
        loadCollection<QueueItem>('/api/queues'),
        loadCollection<VitalSigns>('/api/vitals'),
        loadCollection<EMREncounter>('/api/encounters'),
        loadCollection<LabOrderRecord>('/api/lab-orders'),
        loadCollection<PharmacyBatchItem>('/api/pharmacy'),
        loadCollection<InpatientBed>('/api/beds'),
        loadCollection<RadiologyOrderRecord>('/api/radiology'),
        loadCollection<BillingInvoice>('/api/billing'),
        loadCollection<NHISClaimLine>('/api/nhis-claims'),
        loadCollection<InventoryStoreItem>('/api/inventory'),
        loadCollection<AuditLogEntry>('/api/audit-logs'),
        loadCollection<PrescriptionDispenseRecord>('/api/pharmacy/dispense')
      ]);

      setFacilities(facilityRows);
      setStaff(staffRows);
      setPatients(patientRows);
      setQueues(queueRows);
      setVitals(vitalRows);
      setEncounters(encounterRows);
      setLabOrders(labRows);
      setPharmacyBatches(pharmacyRows);
      setBeds(bedRows);
      setRadiologyOrders(radiologyRows);
      setInvoices(invoiceRows);
      setNhisClaims(claimRows);
      setInventory(inventoryRows);
      setAuditLogs(auditRows);
      setDispenseRecords(dispenseRows);

      try {
        const statsResponse = await api.get<{ data: FacilityStats }>('/api/stats');
        setStats(statsResponse.data);
      } catch {
        setStats(null);
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void refreshAll();
  }, [isAuthenticated, refreshAll]);

  /* ---------------------------------------------------------------- *
   * RBAC helpers (advisory — the server enforces the same rules)
   * ---------------------------------------------------------------- */

  const hasPermission = useCallback(
    (permission: Permission): boolean =>
      Boolean(ROLE_DEFINITIONS[currentRole]?.permissions.includes(permission)),
    [currentRole]
  );

  const canAccessRoute = useCallback(
    (routePath: string): boolean => {
      const definition = ROLE_DEFINITIONS[currentRole];
      if (!definition) return false;

      return definition.allowedRoutes.some((allowed) =>
        allowed === '/' ? routePath === '/' || routePath === '' : routePath.startsWith(allowed)
      );
    },
    [currentRole]
  );

  /* ---------------------------------------------------------------- *
   * Actions
   *
   * Each one persists first and only then updates local state from the saved
   * record. The previous implementation did the reverse — it wrote to state
   * and fired an un-awaited request whose failure was swallowed by
   * `.catch(console.error)`, so the screen could show a patient, invoice or
   * dispense that the database never received.
   * ---------------------------------------------------------------- */

  const addAuditLog = useCallback(
    async (action: string, _userName: string, _role: string, details: string, mrn?: string, patientId?: string) => {
      // Actor identity is stamped from the session on the server; the name and
      // role arguments are retained only for call-site compatibility.
      try {
        const response = await api.post<{ data: AuditLogEntry }>('/api/audit-logs', {
          action,
          details,
          mrn,
          patientId
        });
        setAuditLogs((prev) => [response.data, ...prev]);
      } catch (error) {
        console.error('Failed to record audit entry:', error);
      }
    },
    []
  );

  const addFacility = useCallback(
    async (facilityData: Omit<FacilityBranch, 'id' | 'createdDate'>): Promise<FacilityBranch | null> => {
      try {
        const response = await api.post<{ data: FacilityBranch }>('/api/facilities', facilityData);
        setFacilities((prev) => [response.data, ...prev]);
        return response.data;
      } catch (error) {
        reportFailure('Registering the hospital', error);
        return null;
      }
    },
    [reportFailure]
  );

  const updateFacilityStatus = useCallback(
    async (id: string, status: FacilityBranch['status']): Promise<boolean> => {
      try {
        const response = await api.patch<{ data: FacilityBranch }>('/api/facilities', { id, status });
        setFacilities((prev) => prev.map((facility) => (facility.id === id ? response.data : facility)));
        return true;
      } catch (error) {
        reportFailure('Updating the hospital status', error);
        return false;
      }
    },
    [reportFailure]
  );

  const registerPatient = useCallback(
    async (
      patientData: Omit<PatientRecord, 'id' | 'mrn' | 'registrationDate'>
    ): Promise<PatientRecord | null> => {
      try {
        // The MRN is allocated by the database, not guessed from the length of
        // the list currently held in the browser.
        const response = await api.post<{ data: PatientRecord }>('/api/patients', {
          ...patientData,
          facilityId: patientData.facilityId || activeFacilityId
        });

        const patient = response.data;
        setPatients((prev) => [patient, ...prev]);

        // Route the new patient straight to the triage queue.
        try {
          const queueResponse = await api.post<{ data: QueueItem }>('/api/queues', {
            patientId: patient.id,
            mrn: patient.mrn,
            patientName: patient.fullName,
            patientCategory: patient.patientCategory,
            department: 'Triage',
            servicePoint: 'Triage Station 1',
            locationNotes: 'Triage Waiting Bay'
          });
          setQueues((prev) => [queueResponse.data, ...prev]);
        } catch (error) {
          // The patient exists; only the queue ticket failed.
          reportFailure('Adding the patient to the triage queue', error);
        }

        return patient;
      } catch (error) {
        reportFailure('Registering the patient', error);
        return null;
      }
    },
    [activeFacilityId, reportFailure]
  );

  const addQueueItem = useCallback(
    async (item: Omit<QueueItem, 'id' | 'waitingMinutes'>): Promise<QueueItem | null> => {
      try {
        const response = await api.post<{ data: QueueItem }>('/api/queues', item);
        setQueues((prev) => [response.data, ...prev]);
        return response.data;
      } catch (error) {
        reportFailure('Adding the patient to the queue', error);
        return null;
      }
    },
    [reportFailure]
  );

  const updateQueueStatus = useCallback(
    async (id: string, status: QueueItem['status'], location: string): Promise<boolean> => {
      try {
        const response = await api.patch<{ data: QueueItem }>('/api/queues', {
          id,
          status,
          currentLocation: location
        });
        setQueues((prev) => prev.map((item) => (item.id === id ? response.data : item)));
        return true;
      } catch (error) {
        reportFailure('Updating the queue', error);
        return false;
      }
    },
    [reportFailure]
  );

  const recordVitals = useCallback(
    async (vitalData: Omit<VitalSigns, 'id' | 'timestamp'>): Promise<VitalSigns | null> => {
      try {
        const response = await api.post<{ data: VitalSigns }>('/api/vitals', vitalData);
        setVitals((prev) => [response.data, ...prev]);
        return response.data;
      } catch (error) {
        reportFailure('Recording vital signs', error);
        return null;
      }
    },
    [reportFailure]
  );

  const createEncounter = useCallback(
    async (encounterData: Omit<EMREncounter, 'id' | 'timestamp'>): Promise<EMREncounter | null> => {
      try {
        const response = await api.post<{ data: EMREncounter }>('/api/encounters', encounterData);
        const encounter = response.data;
        setEncounters((prev) => [encounter, ...prev]);

        // Clinical orders fan out into laboratory, billing and NHIS claims.
        // Each is awaited so a rejected order is reported instead of vanishing.
        for (const order of encounterData.orders ?? []) {
          if (order.type === 'Laboratory') {
            try {
              const labResponse = await api.post<{ data: LabOrderRecord }>('/api/lab-orders', {
                encounterId: encounter.id,
                patientId: encounter.patientId,
                mrn: encounter.mrn,
                patientName: encounter.patientName,
                testCode: order.code,
                testName: order.description
              });
              setLabOrders((prev) => [labResponse.data, ...prev]);
            } catch (error) {
              reportFailure(`Creating the laboratory order for ${order.description}`, error);
            }
          }

          const patient = patients.find((p) => p.id === encounter.patientId);
          const nhisCovers = patient?.patientCategory === 'NHIS' && order.nhisCovered;

          try {
            const invoiceResponse = await api.post<{ data: BillingInvoice }>('/api/billing', {
              patientId: encounter.patientId,
              mrn: encounter.mrn,
              patientName: encounter.patientName,
              patientCategory: patient?.patientCategory ?? 'Cash',
              lineItems: [
                {
                  description: order.description,
                  category:
                    order.type === 'Laboratory'
                      ? 'Lab'
                      : order.type === 'Prescription'
                        ? 'Pharmacy'
                        : order.type === 'Radiology'
                          ? 'Radiology'
                          : 'Procedure',
                  amountGhc: order.costGhc,
                  nhisCoveredGhc: nhisCovers ? order.costGhc : 0,
                  patientPayableGhc: nhisCovers ? 0 : order.costGhc
                }
              ],
              paidAmountGhc: 0,
              paymentMethod: nhisCovers ? 'NHIS Claim' : null
            });
            setInvoices((prev) => [invoiceResponse.data, ...prev]);
          } catch (error) {
            reportFailure(`Billing ${order.description}`, error);
          }

          if (nhisCovers && patient?.nhisNumber) {
            try {
              const claimResponse = await api.post<{ data: NHISClaimLine }>('/api/nhis-claims', {
                patientId: patient.id,
                mrn: patient.mrn,
                patientName: patient.fullName,
                icdCode: encounterData.icdDiagnoses[0]?.code,
                icdDescription: encounterData.icdDiagnoses[0]?.name,
                gdrgCode: order.code,
                gdrgTariffGhc: order.type === 'Prescription' ? 0 : order.costGhc,
                medicineCode: order.type === 'Prescription' ? order.code : 'N/A',
                medicineTariffGhc: order.type === 'Prescription' ? order.costGhc : 0
              });
              setNhisClaims((prev) => [claimResponse.data, ...prev]);
            } catch (error) {
              reportFailure(`Preparing the NHIS claim for ${order.description}`, error);
            }
          }
        }

        return encounter;
      } catch (error) {
        reportFailure('Saving the consultation note', error);
        return null;
      }
    },
    [patients, reportFailure]
  );

  const updateBedStatus = useCallback(
    async (
      bedId: string,
      status: InpatientBed['status'],
      patientId?: string,
      patientName?: string,
      mrn?: string
    ): Promise<boolean> => {
      try {
        const response = await api.patch<{ data: InpatientBed }>('/api/beds', {
          id: bedId,
          status,
          currentPatientId: patientId,
          patientName,
          mrn
        });
        setBeds((prev) => prev.map((bed) => (bed.id === bedId ? response.data : bed)));
        return true;
      } catch (error) {
        reportFailure('Updating the bed', error);
        return false;
      }
    },
    [reportFailure]
  );

  const recordLabResult = useCallback(
    async (labOrderId: string, results: LabOrderRecord['results'], _techName: string): Promise<boolean> => {
      try {
        const response = await api.patch<{ data: LabOrderRecord }>('/api/lab-orders', {
          id: labOrderId,
          status: 'Verified',
          results
        });
        setLabOrders((prev) => prev.map((order) => (order.id === labOrderId ? response.data : order)));
        return true;
      } catch (error) {
        reportFailure('Verifying the laboratory result', error);
        return false;
      }
    },
    [reportFailure]
  );

  const dispenseMedication = useCallback(
    async (
      prescriptionId: string,
      patientId: string,
      mrn: string,
      patientName: string,
      drugName: string,
      qty: number,
      batchNo: string,
      _pharmacist: string
    ): Promise<boolean> => {
      try {
        const response = await api.post<{ data: PrescriptionDispenseRecord }>('/api/pharmacy/dispense', {
          prescriptionId,
          patientId,
          mrn,
          patientName,
          drugName,
          quantityPrescribed: qty,
          quantityDispensed: qty,
          batchNumber: batchNo
        });

        setDispenseRecords((prev) => [response.data, ...prev]);
        // Stock was decremented inside the same transaction on the server; mirror
        // it locally so the shelf count on screen matches.
        setPharmacyBatches((prev) =>
          prev.map((batch) =>
            batch.batchNumber === batchNo
              ? { ...batch, quantityInStock: Math.max(0, batch.quantityInStock - qty) }
              : batch
          )
        );
        return true;
      } catch (error) {
        reportFailure('Dispensing the medicine', error);
        return false;
      }
    },
    [reportFailure]
  );

  const value = useMemo<HMSContextType>(
    () => ({
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
      stats,
      currentUser,
      isAuthenticated,
      sessionLoading,
      isLoadingData,
      loginUser,
      logout,
      currentRole,
      setCurrentRole,
      hasPermission,
      canAccessRoute,
      activeFacilityId,
      setActiveFacilityId,
      lastError,
      clearError,
      refreshAll,
      addFacility,
      updateFacilityStatus,
      registerPatient,
      addQueueItem,
      updateQueueStatus,
      recordVitals,
      createEncounter,
      updateBedStatus,
      recordLabResult,
      dispenseMedication,
      addAuditLog
    }),
    [
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
      stats,
      currentUser,
      isAuthenticated,
      sessionLoading,
      isLoadingData,
      loginUser,
      logout,
      currentRole,
      setCurrentRole,
      hasPermission,
      canAccessRoute,
      activeFacilityId,
      lastError,
      clearError,
      refreshAll,
      addFacility,
      updateFacilityStatus,
      registerPatient,
      addQueueItem,
      updateQueueStatus,
      recordVitals,
      createEncounter,
      updateBedStatus,
      recordLabResult,
      dispenseMedication,
      addAuditLog
    ]
  );

  return (
    <HMSContext.Provider value={value}>
      {children}
      <HMSErrorBanner message={lastError} onDismiss={clearError} />
    </HMSContext.Provider>
  );
};

/**
 * Global failure surface. Writes are no longer silent, so every rejected save
 * has somewhere to be seen even on screens that do not check the return value.
 */
function HMSErrorBanner({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 10_000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-[100] max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-xl dark:border-rose-900 dark:bg-rose-950"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg leading-none text-rose-600 dark:text-rose-400">
          &#9888;
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-rose-800 dark:text-rose-200">Action not saved</p>
          <p className="mt-1 break-words text-xs text-rose-700 dark:text-rose-300">{message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 rounded-lg px-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export const useHMS = () => {
  const context = useContext(HMSContext);
  if (!context) {
    throw new Error('useHMS must be used within an HMSProvider');
  }
  return context;
};
