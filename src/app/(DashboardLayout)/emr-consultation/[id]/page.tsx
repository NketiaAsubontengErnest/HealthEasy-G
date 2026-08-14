'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHMS } from '@/context/HMSContext';
import { ClinicalOrder } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import AIAssistantPanel from '../AIAssistantPanel';
import {
  IconStethoscope,
  IconNotes,
  IconPlus,
  IconTrash,
  IconCheck,
  IconFileText,
  IconSignature,
  IconUser,
  IconHeartbeat,
  IconAlertCircle,
  IconArrowLeft,
  IconBuildingHospital,
  IconLock
} from '@tabler/icons-react';

export default function SinglePatientConsultationPage() {
  return (
    <RoleGuard routePath="/emr-consultation">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Patient Clinical Record...</div>}>
        <SinglePatientContent />
      </Suspense>
    </RoleGuard>
  );
}

function SinglePatientContent() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const { patients, vitals, encounters, queues, createEncounter, updateQueueStatus } = useHMS();

  const activePatient = patients.find((p) => p.id === patientId || p.mrn === patientId);
  const activeVitals = vitals.find((v) => v.patientId === activePatient?.id);
  const pastEncounters = encounters.filter((e) => e.patientId === activePatient?.id);
  const activeQueueItem = queues.find((q) => q.patientId === activePatient?.id && q.status !== 'Completed');

  // Clinical Form State
  const [complaint, setComplaint] = useState('');
  const [history, setHistory] = useState('');
  const [exam, setExam] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [sickLeaveDays, setSickLeaveDays] = useState(0);
  const [clinicianName, setClinicianName] = useState('Dr. Kwame Mensah');

  // ICD Diagnoses State
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<
    { code: string; name: string; category: string }[]
  >([
    { code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' }
  ]);

  // Order Entry State
  const [orders, setOrders] = useState<ClinicalOrder[]>([
    {
      id: `ord-${Date.now()}-1`,
      encounterId: '',
      patientId: activePatient?.id || '',
      type: 'Laboratory',
      code: 'LAB-FBC',
      description: 'Full Blood Count (FBC)',
      costGhc: 45.0,
      nhisCovered: true,
      status: 'Pending',
      orderedBy: clinicianName,
      orderTimestamp: new Date().toLocaleString()
    }
  ]);

  // Department Referral State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referDepartment, setReferDepartment] = useState('Laboratory');
  const [referReason, setReferReason] = useState('Patient presenting with fever and fatigue; rule out malaria & anemia.');
  const [selectedLabTestCodes, setSelectedLabTestCodes] = useState<string[]>(['LAB-FBC', 'LAB-MAL-RDT']);

  // Hospital Lab Catalogue State from DB API
  const [hospitalLabCatalogue, setHospitalLabCatalogue] = useState<any[]>([]);

  useEffect(() => {
    async function loadLabCatalogue() {
      try {
        const res = await fetch('/api/lab-catalogue');
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setHospitalLabCatalogue(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching lab catalogue from DB:', err);
      }
    }
    loadLabCatalogue();
  }, []);

  const icdCatalogue = [
    { code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' },
    { code: 'E11', name: 'Type 2 diabetes mellitus', category: 'Endocrine' },
    { code: 'B54', name: 'Unspecified malaria', category: 'Infectious' },
    { code: 'J06.9', name: 'Acute upper respiratory infection', category: 'Respiratory' },
    { code: 'K29.7', name: 'Gastritis, unspecified', category: 'Gastrointestinal' },
    { code: 'R51', name: 'Headache', category: 'Neurological' }
  ];

  const handleAddDiagnosis = (code: string) => {
    const item = icdCatalogue.find((i) => i.code === code);
    if (item && !selectedDiagnoses.some((d) => d.code === code)) {
      setSelectedDiagnoses([...selectedDiagnoses, item]);
    }
  };

  const handleAddOrder = (type: ClinicalOrder['type'], description: string, costGhc: number, code: string) => {
    if (!activePatient) return;
    const newOrd: ClinicalOrder = {
      id: `ord-${Date.now()}-${orders.length + 1}`,
      encounterId: '',
      patientId: activePatient.id,
      type,
      code,
      description,
      costGhc,
      nhisCovered: true,
      status: 'Pending',
      orderedBy: clinicianName,
      orderTimestamp: new Date().toLocaleString()
    };
    setOrders([...orders, newOrd]);
  };

  const handleRemoveOrder = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id));
  };

  const handleAddAIOrders = (aiOrders: ClinicalOrder[]) => {
    setOrders((prev) => [...prev, ...aiOrders]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    createEncounter({
      patientId: activePatient.id,
      mrn: activePatient.mrn,
      patientName: activePatient.fullName,
      encounterType: 'OPD',
      clinicianName,
      presentingComplaints: complaint || 'General malaise and routine consultation.',
      historyOfPresentingComplaint: history || 'No acute distress.',
      pastMedicalHistory: activePatient.chronicConditions.join(', ') || 'None reported.',
      physicalExamination: exam || 'Afebrile, chest clear, heart sounds normal.',
      icdDiagnoses: selectedDiagnoses,
      clinicalNotes: `${complaint} | Plan: ${treatmentPlan}`,
      treatmentPlan,
      sickLeaveDays: sickLeaveDays > 0 ? sickLeaveDays : undefined,
      orders,
      dischargeDecision: 'Discharged',
      signed: true
    });

    if (activeQueueItem) {
      updateQueueStatus(activeQueueItem.id, 'Completed', 'Discharged');
    }

    alert(
      `Encounter Signed for ${activePatient.fullName}!\n- Patient completed and removed from active waiting list.\n- Orders dispatched to Lab & Pharmacy.\n- Returning to Patient Directory.`
    );

    router.push('/emr-consultation');
  };

  if (!activePatient) {
    return (
      <div className="p-12 text-center space-y-4">
        <IconAlertCircle size={48} className="mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Patient Record Not Found</h2>
        <p className="text-xs text-slate-500">No active patient record matching ID "{patientId}".</p>
        <Link
          href="/emr-consultation"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow"
        >
          <IconArrowLeft size={16} /> Back to OPD Patient List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/emr-consultation"
            className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition text-slate-700 dark:text-slate-200"
            title="Back to OPD Patient List"
          >
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {activePatient.patientCategory} PATIENT
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">{activePatient.mrn}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Clinical Folder: {activePatient.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePatient.gender}, DOB: {activePatient.dob} · Ghana Card: {activePatient.ghanaCardNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReferralModal(true)}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-white font-extrabold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <IconBuildingHospital size={18} /> Refer Patient to Dept / Lab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vitals, Medical History & Longitudinal Records */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Bio & Allergy Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-2">
              <IconUser size={18} className="text-emerald-600" /> Patient Master Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activePatient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NHIS #:</span>
                <span className="font-mono text-emerald-600 font-bold">{activePatient.nhisNumber || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-bold text-rose-600">{activePatient.bloodGroup}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold text-rose-600 block">Allergies:</span>
                <span className="text-slate-700 dark:text-slate-300">{activePatient.allergies.join(', ') || 'No known drug allergies.'}</span>
              </div>
              <div>
                <span className="font-bold text-amber-600 block">Chronic Conditions:</span>
                <span className="text-slate-700 dark:text-slate-300">{activePatient.chronicConditions.join(', ') || 'None reported.'}</span>
              </div>
            </div>
          </div>

          {/* Vitals Card */}
          {activeVitals ? (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <IconHeartbeat size={18} className="text-rose-500" /> Latest Triage Vitals
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">{activeVitals.timestamp}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border">
                  <span className="text-[10px] text-slate-400 block font-medium">Blood Pressure</span>
                  <span className={`font-mono font-bold text-sm ${activeVitals.systolicBp >= 140 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {activeVitals.systolicBp}/{activeVitals.diastolicBp} mmHg
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border">
                  <span className="text-[10px] text-slate-400 block font-medium">Pulse Rate</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{activeVitals.pulseRate} bpm</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border">
                  <span className="text-[10px] text-slate-400 block font-medium">Temperature</span>
                  <span className={`font-mono font-bold text-sm ${activeVitals.temperature >= 38.0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                    {activeVitals.temperature} °C
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border">
                  <span className="text-[10px] text-slate-400 block font-medium">Oxygen Sat (SpO2)</span>
                  <span className={`font-mono font-bold text-sm ${activeVitals.oxygenSaturation < 95 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeVitals.oxygenSaturation}%
                  </span>
                </div>
              </div>

              {activeVitals.nursingNotes && (
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border text-slate-700 dark:text-slate-300">
                  <span className="font-bold block text-slate-900 dark:text-white mb-0.5">Nursing Triage Note:</span>
                  <p className="italic">{activeVitals.nursingNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border text-center text-slate-400 text-xs py-6">
              No recent triage vitals recorded.
            </div>
          )}

          {/* Past Encounters Timeline */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white">Past Encounters Timeline</h3>
            <div className="space-y-3">
              {pastEncounters.map((enc) => (
                <div key={enc.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1">
                  <span className="text-[10px] text-slate-400 block">{enc.timestamp} by {enc.clinicianName}</span>
                  <span className="font-bold text-slate-900 dark:text-white block">{enc.presentingComplaints}</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {enc.icdDiagnoses.map((d, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {d.code}: {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Doctor Consultation Workstation */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IconStethoscope className="text-indigo-600" size={22} /> Clinical Consultation Workstation
            </h2>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              Single Patient Active
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Presenting Complaints *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. High fever, headache, weakness x 3 days..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                ></textarea>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Physical Examination Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient conscious, chest clear, no pallor..."
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                ></textarea>
              </div>
            </div>

            {/* ICD-10 Diagnoses Picker */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-900 dark:text-white">ICD-10 Diagnoses Code Picker *</label>
                <select
                  onChange={(e) => handleAddDiagnosis(e.target.value)}
                  className="p-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                >
                  <option value="">+ Add ICD Code...</option>
                  {icdCatalogue.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedDiagnoses.map((diag) => (
                  <span
                    key={diag.code}
                    className="bg-indigo-100 text-indigo-900 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-indigo-200"
                  >
                    <span>{diag.code}: {diag.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDiagnoses(selectedDiagnoses.filter((d) => d.code !== diag.code))}
                      className="text-rose-600 hover:text-rose-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* AI Decision Assistant Panel */}
            <AIAssistantPanel
              selectedPatientId={activePatient.id}
              selectedDiagnoses={selectedDiagnoses}
              clinicianName={clinicianName}
              onAddOrders={handleAddAIOrders}
              onInsertAINotes={(aiNotes) => {
                setTreatmentPlan((prev) => (prev ? `${prev}\n\n${aiNotes}` : aiNotes));
              }}
              onAddDiagnosis={(diag) => {
                if (!selectedDiagnoses.some((d) => d.code === diag.code)) {
                  setSelectedDiagnoses((prev) => [...prev, diag]);
                }
              }}
            />

            {/* Order Entry Panel */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Clinician Order Entry Panel</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddOrder('Laboratory', 'Full Blood Count (FBC)', 45.0, 'LAB-FBC')}
                    className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 font-bold rounded-lg"
                  >
                    + Order FBC Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddOrder('Prescription', 'Tab Amlodipine 10mg Daily x 30 Days', 35.0, 'MED-AML-10')}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-lg"
                  >
                    + Add Amlodipine Rx
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {orders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{ord.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Type: {ord.type} | Code: {ord.code}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-600">GHS {ord.costGhc.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOrder(ord.id)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Treatment & Management Plan</label>
                <input
                  type="text"
                  placeholder="e.g. Oral rehydration, review lab results in 3 days."
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Sick Leave Days (Optional)</label>
                <input
                  type="number"
                  value={sickLeaveDays}
                  onChange={(e) => setSickLeaveDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <IconSignature size={18} className="text-indigo-600" />
                Signed by: <strong>{clinicianName}</strong> (MDC Reg)
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 text-white font-extrabold rounded-xl shadow hover:bg-emerald-500 transition text-sm flex items-center gap-2"
              >
                <IconCheck size={18} /> Sign & Dispatch Clinical Orders
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Department Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <IconStethoscope className="text-amber-500" size={20} /> Refer / Transfer Patient to Department
              </h3>
              <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border flex justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Name & MRN</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{activePatient.fullName}</span>
                </div>
                <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {activePatient.mrn}
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  1. Target Service Department / Unit (Where) *
                </label>
                <select
                  value={referDepartment}
                  onChange={(e) => setReferDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold text-slate-900 dark:text-white text-xs"
                >
                  <option value="Laboratory">Laboratory (for Blood Work & Diagnostic Tests)</option>
                  <option value="Radiology & Imaging">Radiology (for X-Ray, CT, Ultrasound)</option>
                  <option value="Pharmacy">Pharmacy (for Medication Dispensing & Counseling)</option>
                  <option value="Eye / Ophthalmology Clinic">Eye / Ophthalmology Clinic</option>
                  <option value="Dental Clinic">Dental Clinic</option>
                  <option value="Inpatient Ward">Inpatient Ward (Admission Referral)</option>
                  <option value="Physiotherapy">Physiotherapy & Rehabilitation</option>
                </select>
              </div>

              {referDepartment.startsWith('Laboratory') && (
                <div className="bg-teal-50/70 dark:bg-teal-950/40 p-4 rounded-xl border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-teal-900 dark:text-teal-200 text-xs flex items-center gap-1.5">
                      🧪 Select Specific Hospital Lab Tests (Configured by Lab Technicians):
                    </label>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                      {selectedLabTestCodes.length} tests selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {hospitalLabCatalogue.map((t) => {
                      const isChecked = selectedLabTestCodes.includes(t.code);
                      return (
                        <label
                          key={t.code}
                          className={`p-2.5 rounded-lg border text-[11px] cursor-pointer transition flex items-start justify-between gap-2 ${
                            isChecked
                              ? 'bg-white dark:bg-slate-800 border-teal-500 shadow-sm font-bold text-slate-900 dark:text-white'
                              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLabTestCodes([...selectedLabTestCodes, t.code]);
                                } else {
                                  setSelectedLabTestCodes(selectedLabTestCodes.filter((c) => c !== t.code));
                                }
                              }}
                              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                            />
                            <div className="min-w-0">
                              <span className="block truncate">{t.name}</span>
                              <span className="text-[9px] font-mono text-slate-400 block">{t.code} · {t.category}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-600 block text-[10px]">GHS {t.costGhc.toFixed(2)}</span>
                            {t.nhisCovered && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded block">NHIS</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  3. Clinical Reason & Instructions for Referral (Why) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the clinical indication or suspect diagnosis..."
                  value={referReason}
                  onChange={(e) => setReferReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!referReason.trim()) {
                    alert('Please enter the clinical reason for referral.');
                    return;
                  }

                  let labTestDetails = '';

                  if (referDepartment.startsWith('Laboratory') && selectedLabTestCodes.length > 0) {
                    const selectedTests = hospitalLabCatalogue.filter((t) => selectedLabTestCodes.includes(t.code));
                    labTestDetails = selectedTests.map((t) => t.name).join(', ');

                    const newLabOrders: ClinicalOrder[] = selectedTests.map((t, idx) => ({
                      id: `lab-order-${Date.now()}-${idx}`,
                      encounterId: '',
                      patientId: activePatient.id,
                      type: 'Laboratory',
                      code: t.code,
                      description: t.name,
                      costGhc: t.costGhc,
                      nhisCovered: t.nhisCovered && activePatient.patientCategory === 'NHIS',
                      status: 'Pending',
                      orderedBy: clinicianName,
                      orderTimestamp: new Date().toLocaleString()
                    }));

                    setOrders((prev) => {
                      const existingCodes = new Set(prev.map((o) => o.code));
                      const toAdd = newLabOrders.filter((o) => !existingCodes.has(o.code));
                      return [...prev, ...toAdd];
                    });
                  }

                  if (activeQueueItem) {
                    const fullNotes = labTestDetails
                      ? `${referDepartment} (Tests: ${labTestDetails}) — Reason: ${referReason}`
                      : `${referDepartment} — Reason: ${referReason}`;
                    updateQueueStatus(activeQueueItem.id, 'Transferred', fullNotes);
                  }

                  alert(
                    `Patient ${activePatient.fullName} successfully referred to ${referDepartment}!\n` +
                    `- Clinical Reason: ${referReason}\n` +
                    (labTestDetails ? `- Specific Lab Tests Ordered: ${labTestDetails}\n` : '') +
                    `- Returning to OPD Patient List.`
                  );

                  setShowReferralModal(false);
                  router.push('/emr-consultation');
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-1.5"
              >
                <IconCheck size={16} /> Confirm Referral & Dispatch Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
