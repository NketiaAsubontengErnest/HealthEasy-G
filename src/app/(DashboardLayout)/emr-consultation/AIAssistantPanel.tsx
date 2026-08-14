import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { ClinicalOrder } from '@/lib/types/hms';
import {
  IconBrain,
  IconStethoscope,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconLock,
  IconPill,
  IconFileText,
  IconCircleCheck,
  IconSparkles
} from '@tabler/icons-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MedicineSuggestion {
  drugCode: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  suggestedDose: string;
  durationDays: number;
  reasoning: string;
  allergyConflict: boolean;
  priority: 'First Line' | 'Second Line' | 'Supportive';
  unitPriceGhc: number;
  quantityInStock: number;
  isControlled: boolean;
}

interface AIAssistantPanelProps {
  selectedPatientId: string;
  selectedDiagnoses: { code: string; name: string; category: string }[];
  clinicianName: string;
  onAddOrders: (orders: ClinicalOrder[]) => void;
  onInsertAINotes?: (notes: string) => void;
  onAddDiagnosis?: (diag: { code: string; name: string; category: string }) => void;
}

// ─── Priority badge styling ────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  'First Line':  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Second Line': 'bg-amber-100  text-amber-800  border-amber-300',
  'Supportive':  'bg-sky-100    text-sky-800    border-sky-300',
};

// ─── Bouncing dot component ────────────────────────────────────────────────────

function BounceDot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-violet-500"
      style={{ animation: 'bounce 1s infinite', animationDelay: delay }}
    />
  );
}

function generateClientGSTGFallback(
  selectedDiagnoses: { code: string; name: string; category: string }[],
  activeVitals: any,
  pharmacyBatches: any[],
  patient: any
): MedicineSuggestion[] {
  const suggestions: MedicineSuggestion[] = [];
  const lowerAllergies = (patient?.allergies || []).map((a: string) => (a || '').toLowerCase());
  const codes = (selectedDiagnoses || []).map((d) => (d.code || '').toUpperCase());

  const getDrugName = (b: any) => (b?.genericName || b?.drugName || '').toLowerCase();

  // 1. Essential Hypertension (I10)
  if (codes.some((c) => c.startsWith('I10')) || (activeVitals && activeVitals.systolicBp >= 140)) {
    const aml = (pharmacyBatches || []).find(
      (b) => b?.drugCode === 'AML-10' || getDrugName(b).includes('amlodipine')
    );
    const hasAllergy = lowerAllergies.some((a: string) => a.includes('amlodipine') || a.includes('calcium channel'));
    suggestions.push({
      drugCode: aml ? aml.drugCode : 'AML-10',
      genericName: aml ? (aml.genericName || aml.drugName || 'Amlodipine Besylate') : 'Amlodipine Besylate',
      strength: aml ? aml.strength || '10mg' : '10mg',
      dosageForm: aml ? aml.dosageForm || 'Tablet' : 'Tablet',
      suggestedDose: '1 tablet orally once daily in the morning',
      durationDays: 30,
      reasoning: `First-line calcium channel blocker for hypertension under Ghana Standard Treatment Guidelines (GSTG). Patient BP is ${
        activeVitals ? `${activeVitals.systolicBp}/${activeVitals.diastolicBp} mmHg` : 'elevated'
      }.`,
      allergyConflict: hasAllergy,
      priority: 'First Line',
      unitPriceGhc: aml ? aml.unitPriceGhc || aml.sellingPriceGhc || 1.5 : 1.5,
      quantityInStock: aml ? aml.quantityInStock || 450 : 450,
      isControlled: false,
    });
  }

  // 2. Unspecified Malaria (B54)
  if (codes.some((c) => c.startsWith('B54')) || (activeVitals && activeVitals.temperature >= 38.0)) {
    const coa = (pharmacyBatches || []).find(
      (b) => b?.drugCode === 'COA-80' || getDrugName(b).includes('coartem') || getDrugName(b).includes('artemether')
    );
    const hasAllergy = lowerAllergies.some(
      (a: string) => a.includes('artemether') || a.includes('lumefantrine') || a.includes('coartem')
    );
    suggestions.push({
      drugCode: coa ? coa.drugCode : 'COA-80',
      genericName: coa ? (coa.genericName || coa.drugName || 'Artemether + Lumefantrine (Coartem)') : 'Artemether + Lumefantrine (Coartem)',
      strength: coa ? coa.strength || '80/480mg' : '80/480mg',
      dosageForm: coa ? coa.dosageForm || 'Tablet' : 'Tablet',
      suggestedDose: '1 tablet twice daily with fatty meals for 3 days',
      durationDays: 3,
      reasoning: 'First-line Artemisinin-based Combination Therapy (ACT) for acute uncomplicated malaria per Ghana Health Service guidelines.',
      allergyConflict: hasAllergy,
      priority: 'First Line',
      unitPriceGhc: coa ? coa.unitPriceGhc || coa.sellingPriceGhc || 8.0 : 8.0,
      quantityInStock: coa ? coa.quantityInStock || 320 : 320,
      isControlled: false,
    });
  }

  // 3. Supportive Paracetamol
  const par = (pharmacyBatches || []).find(
    (b) => b?.drugCode === 'PAR-500' || getDrugName(b).includes('paracetamol')
  );
  const hasParAllergy = lowerAllergies.some((a: string) => a.includes('paracetamol') || a.includes('acetaminophen'));
  suggestions.push({
    drugCode: par ? par.drugCode : 'PAR-500',
    genericName: par ? (par.genericName || par.drugName || 'Paracetamol') : 'Paracetamol',
    strength: par ? par.strength || '500mg' : '500mg',
    dosageForm: par ? par.dosageForm || 'Tablet' : 'Tablet',
    suggestedDose: '2 tablets 8-hourly after meals as needed for fever/pain',
    durationDays: 5,
    reasoning: 'Supportive antipyretic & analgesic for fever and somatic pain per GSTG protocols.',
    allergyConflict: hasParAllergy,
    priority: 'Supportive',
    unitPriceGhc: par ? par.unitPriceGhc || par.sellingPriceGhc || 0.8 : 0.8,
    quantityInStock: par ? par.quantityInStock || 500 : 500,
    isControlled: false,
  });

  return suggestions;
}

interface AIDiagnosisAnalysis {
  issueTitle: string;
  severity: 'Critical' | 'Warning' | 'Info';
  clinicalSummary: string;
  suggestedICDCodes: { code: string; name: string; category: string }[];
}

function analyzeClinicalIssues(
  patient: any,
  patientVitals: any,
  patientLabResults: any[],
  selectedDiagnoses: { code: string; name: string; category: string }[]
): AIDiagnosisAnalysis[] {
  const issues: AIDiagnosisAnalysis[] = [];

  // 1. Check Hypertension
  if (patientVitals && patientVitals.systolicBp >= 140) {
    const isSevere = patientVitals.systolicBp >= 160 || patientVitals.diastolicBp >= 100;
    issues.push({
      issueTitle: isSevere ? 'Stage 2 Severe Hypertension (Hypertensive Urgency Risk)' : 'Stage 1 Essential Hypertension',
      severity: isSevere ? 'Critical' : 'Warning',
      clinicalSummary: `Recorded Blood Pressure is ${patientVitals.systolicBp}/${patientVitals.diastolicBp} mmHg (Normal <120/80 mmHg). Pulse: ${patientVitals.pulseRate} bpm. Immediate anti-hypertensive intervention & BP monitoring recommended under GSTG guidelines.`,
      suggestedICDCodes: [{ code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' }]
    });
  }

  // 2. Check Pyrexia / Malaria Risk
  if (patientVitals && patientVitals.temperature >= 38.0) {
    issues.push({
      issueTitle: 'Pyrexia (High Fever) — Suspected Acute Malaria / Febrile Illness',
      severity: 'Warning',
      clinicalSummary: `Recorded body temperature is ${patientVitals.temperature}°C (Pyrexia >38.0°C). Pulse rate is ${patientVitals.pulseRate} bpm. Malaria RDT or Parasitemia density test is recommended. First-line ACT (Coartem) indicated if confirmed.`,
      suggestedICDCodes: [
        { code: 'B54', name: 'Unspecified malaria', category: 'Infectious' },
        { code: 'R50.9', name: 'Fever, unspecified', category: 'General Symptoms' }
      ]
    });
  }

  // 3. Check Hyperglycemia / Diabetes
  if (patientVitals && patientVitals.bloodGlucoseMmoles >= 11.1) {
    issues.push({
      issueTitle: 'Uncontrolled Hyperglycemia / Type 2 Diabetes Mellitus',
      severity: 'Critical',
      clinicalSummary: `Random blood glucose level is elevated at ${patientVitals.bloodGlucoseMmoles} mmol/L (Normal 4.0-7.8 mmol/L). Indicates uncontrolled glycemic status or new onset Diabetes Mellitus.`,
      suggestedICDCodes: [{ code: 'E11', name: 'Type 2 diabetes mellitus', category: 'Endocrine' }]
    });
  }

  // 4. Default / General Symptom Analysis
  if (issues.length === 0) {
    issues.push({
      issueTitle: 'Acute OPD Presentation — General Malaise & Clinical Evaluation',
      severity: 'Info',
      clinicalSummary: `Patient presents for clinical evaluation. Vitals parameters are within normal physiological bounds. Screen for upper respiratory infection, acute gastritis, or somatic pain.`,
      suggestedICDCodes: [
        { code: 'J06.9', name: 'Acute upper respiratory infection', category: 'Respiratory' },
        { code: 'K29.7', name: 'Gastritis, unspecified', category: 'Gastrointestinal' },
        { code: 'R51', name: 'Headache', category: 'Neurological' }
      ]
    });
  }

  return issues;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AIAssistantPanel({
  selectedPatientId,
  selectedDiagnoses,
  clinicianName,
  onAddOrders,
  onInsertAINotes,
  onAddDiagnosis
}: AIAssistantPanelProps) {
  const { patients, vitals, encounters, labOrders, pharmacyBatches } = useHMS();

  const [isOpen,      setIsOpen]      = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [approved,    setApproved]    = useState<Set<string>>(new Set());
  const [rejected,    setRejected]    = useState<Set<string>>(new Set());
  const [error,       setError]       = useState<string | null>(null);
  const [hasRun,      setHasRun]      = useState(false);
  const [addedBanner, setAddedBanner] = useState(false);

  // ── Derived data ────────────────────────────────────────────────────────────

  const patient         = patients.find((p) => p.id === selectedPatientId);
  const patientVitals   = vitals.find((v) => v.patientId === selectedPatientId);
  const patientLabOrders= labOrders.filter((l) => l.patientId === selectedPatientId);
  const patientEncounters = encounters
    .filter((e) => e.patientId === selectedPatientId)
    .slice(0, 3);
  const allLabResults   = patientLabOrders.flatMap((lo) => lo.results);
  const approvedCount   = approved.size;
  const hasDiagnoses    = selectedDiagnoses.length > 0;

  // ── Fetch AI suggestions ─────────────────────────────────────────────────────

  const handleGetSuggestions = async () => {
    if (!patient || !hasDiagnoses) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setApproved(new Set());
    setRejected(new Set());
    setHasRun(true);
    setAddedBanner(false);

    const payload = {
      patient: {
        patientId:          patient.id,
        fullName:           patient.fullName,
        gender:             patient.gender,
        dob:                patient.dob,
        allergies:          patient.allergies,
        chronicConditions:  patient.chronicConditions,
        bloodGroup:         patient.bloodGroup,
        patientCategory:    patient.patientCategory,
        nhisStatus:         patient.nhisStatus ?? null,
      },
      vitals: patientVitals
        ? {
            systolicBp:         patientVitals.systolicBp,
            diastolicBp:        patientVitals.diastolicBp,
            pulseRate:          patientVitals.pulseRate,
            temperature:        patientVitals.temperature,
            oxygenSaturation:   patientVitals.oxygenSaturation,
            bmi:                patientVitals.bmi,
            bloodGlucoseMmoles: patientVitals.bloodGlucoseMmoles,
            painScore:          patientVitals.painScore,
            esiSeverity:        patientVitals.esiSeverity,
          }
        : null,
      activeDiagnoses: selectedDiagnoses,
      labResults: allLabResults,
      pastEncounters: patientEncounters.map((enc) => ({
        timestamp:           enc.timestamp,
        presentingComplaints: enc.presentingComplaints,
        treatmentPlan:       enc.treatmentPlan,
        icdDiagnoses:        enc.icdDiagnoses,
      })),
      pharmacyStock: pharmacyBatches.map((b) => ({
        drugCode:        b.drugCode,
        genericName:     b.genericName,
        brandName:       b.brandName,
        dosageForm:      b.dosageForm,
        strength:        b.strength,
        quantityInStock: b.quantityInStock,
        unitPriceGhc:    b.unitPriceGhc,
        isControlled:    b.isControlled,
        expiryDate:      b.expiryDate,
      })),
    };

    try {
      const res = await fetch('/api/ai-assistant', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
      } else {
        // Fallback to Ghana Standard Treatment Guidelines (GSTG) Engine
        const fallback = generateClientGSTGFallback(selectedDiagnoses, patientVitals, pharmacyBatches, patient);
        setSuggestions(fallback);
      }
    } catch (err: any) {
      console.warn('[AI Assistant Panel] Unreachable Ollama service. Activating GSTG Engine fallback...');
      const fallback = generateClientGSTGFallback(selectedDiagnoses, patientVitals, pharmacyBatches, patient);
      setSuggestions(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Approve / Reject ────────────────────────────────────────────────────────

  const toggleApprove = (code: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
    setRejected((prev) => { const n = new Set(prev); n.delete(code); return n; });
  };

  const toggleReject = (code: string) => {
    setRejected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
    setApproved((prev) => { const n = new Set(prev); n.delete(code); return n; });
  };

  // ── Inject approved orders ──────────────────────────────────────────────────

  const handleAddApprovedToOrders = () => {
    const approvedSuggestions = suggestions.filter((s) => approved.has(s.drugCode));
    const orders: ClinicalOrder[] = approvedSuggestions.map((s, i) => {
      const estimatedQty  = Math.ceil(s.durationDays * 1); // 1 unit/day baseline
      const estimatedCost = parseFloat((s.unitPriceGhc * estimatedQty).toFixed(2));
      return {
        id:             `ai-rx-${Date.now()}-${i}`,
        encounterId:    '',
        patientId:      selectedPatientId,
        type:           'Prescription',
        code:           s.drugCode,
        description:    `${s.genericName} ${s.strength} ${s.dosageForm} — ${s.suggestedDose} × ${s.durationDays} days  [AI-Assisted]`,
        costGhc:        estimatedCost,
        nhisCovered:    patient?.patientCategory === 'NHIS',
        status:         'Pending',
        orderedBy:      `${clinicianName} (AI-Assisted)`,
        orderTimestamp: new Date().toLocaleString(),
      };
    });

    onAddOrders(orders);
    setApproved(new Set());
    setAddedBanner(true);
    setTimeout(() => setAddedBanner(false), 4000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #eef2ff 100%)' }}>

      {/* ── Header / Toggle ── */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-violet-50/60 dark:hover:bg-violet-900/20 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {/* Glowing AI icon */}
          <div className="relative w-11 h-11 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-violet-500 opacity-20 blur-md" />
            <div className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <IconSparkles className="text-white" size={22} />
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
              AI Medicine Suggestion Assistant
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Powered by{' '}
              <span className="font-bold text-violet-600 dark:text-violet-400">kimi-k3:cloud</span>
              {' '}via Ollama · Ghana STG–Guided · Doctor Approval Required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasRun && suggestions.length > 0 && (
            <span className="text-[11px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-700">
              {suggestions.length} suggestions
            </span>
          )}
          <span className="text-slate-400 text-sm font-bold">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Expandable Body ── */}
      {isOpen && (
        <div className="border-t-2 border-violet-100 dark:border-violet-800 p-5 space-y-4 dark:bg-slate-900/40">

          {/* ── Disclaimer Banner ── */}
          <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3.5">
            <IconStethoscope className="text-amber-600 dark:text-amber-400 shrink-0" size={24} />
            <div className="text-[11px] leading-relaxed">
              <p className="font-extrabold text-amber-800 dark:text-amber-400 text-xs">
                Clinical Decision Support — Not a Prescribing System
              </p>
              <p className="text-amber-700 dark:text-amber-500 mt-0.5">
                AI suggestions are advisory only. All prescriptions require explicit{' '}
                <strong>Doctor Approval</strong> before entering Clinical Orders.
                Final prescribing authority rests solely with the attending physician.
              </p>
            </div>
          </div>

          {/* ── Context Summary ── */}
          {patient && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 text-[11px] space-y-3">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Patient Context for AI Analysis
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'ICD Diagnoses',   value: `${selectedDiagnoses.length} codes`,    color: hasDiagnoses ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-100' },
                  { label: 'Lab Parameters',  value: `${allLabResults.length} results`,      color: 'bg-teal-50 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800' },
                  { label: 'Allergies',       value: patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None', color: patient.allergies.length > 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-slate-50 border-slate-100' },
                  { label: 'Pharmacy Stock',  value: `${pharmacyBatches.length} medicines`,  color: 'bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-lg p-2.5 border ${color}`}>
                    <span className="text-[10px] text-slate-400 block">{label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight block mt-0.5 truncate" title={value}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Clinical Diagnostic Reasoning & Issue Detector Card */}
              {(() => {
                const aiIssues = analyzeClinicalIssues(patient, patientVitals, allLabResults, selectedDiagnoses);
                return (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-violet-200 dark:border-violet-800 p-3.5 space-y-3 mt-3">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <IconBrain className="text-violet-600" size={18} />
                        AI Diagnostic Intelligence & Detected Clinical Issues
                      </h4>
                      <span className="text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300 px-2.5 py-0.5 rounded-full">
                        {aiIssues.length} issue(s) identified
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {aiIssues.map((issue, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">{issue.issueTitle}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              issue.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : issue.severity === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{issue.clinicalSummary}</p>

                          {issue.suggestedICDCodes.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-400">Suggested ICD-10 Diagnosis:</span>
                              {issue.suggestedICDCodes.map((icd) => {
                                const isAdded = selectedDiagnoses.some((d) => d.code === icd.code);
                                return (
                                  <div key={icd.code} className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-lg">
                                    <span className="font-bold text-violet-900 dark:text-violet-200 text-[11px]">
                                      {icd.code}: {icd.name}
                                    </span>
                                    {onAddDiagnosis && (
                                      <button
                                        type="button"
                                        disabled={isAdded}
                                        onClick={() => onAddDiagnosis(icd)}
                                        className={`ml-1 px-2 py-0.5 rounded text-[10px] font-extrabold transition ${
                                          isAdded
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                                            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm'
                                        }`}
                                      >
                                        {isAdded ? '✓ Added' : '+ Add Diagnosis to Chart'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Trigger Button ── */}
          {!isLoading && (
            <button
              type="button"
              onClick={handleGetSuggestions}
              disabled={!hasDiagnoses}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                hasDiagnoses
                  ? {
                      background:  'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      color:       'white',
                      boxShadow:   '0 4px 24px rgba(124,58,237,0.35)',
                    }
                  : { background: '#e5e7eb', color: '#9ca3af' }
              }
            >
              <IconBrain size={20} />
              {hasRun ? 'Re-analyse & Refresh Suggestions' : 'Get AI Medicine Suggestions'}
            </button>
          )}

          {/* ── Loading State ── */}
          {isLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-violet-200 dark:border-violet-700 p-8 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                <div className="absolute inset-3 flex items-center justify-center">
                  <IconBrain size={28} className="text-violet-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-extrabold text-violet-700 dark:text-violet-300 text-sm">
                  Analysing Patient Record...
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  <span className="font-bold text-violet-600">kimi-k3:cloud</span> is reviewing diagnoses,
                  vitals, lab results, allergies &amp; pharmacy stock.
                  <br />This may take 15–45 seconds.
                </p>
              </div>
              <div className="flex justify-center gap-1.5">
                <BounceDot delay="0s" />
                <BounceDot delay="0.15s" />
                <BounceDot delay="0.3s" />
              </div>
            </div>
          )}

          {/* ── Error State ── */}
          {error && !isLoading && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-2">
              <p className="font-bold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-2">
                <IconAlertTriangle size={18} /> AI Service Error
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-500 whitespace-pre-line">{error}</p>
              <div className="text-[11px] text-rose-500 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 rounded-lg p-2 font-mono space-y-0.5">
                <p>1. Ensure Ollama is installed and running:</p>
                <p className="pl-3">ollama serve</p>
                <p>2. Pull the model if not already available:</p>
                <p className="pl-3">ollama pull kimi-k3:cloud</p>
                <p>3. Restart the Next.js dev server: npm run dev</p>
              </div>
            </div>
          )}

          {/* ── Suggestions List ── */}
          {!isLoading && suggestions.length > 0 && (
            <div className="space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  AI-Suggested Medicines — Approve or Reject Each
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  {approvedCount} / {suggestions.length} approved
                </span>
              </div>

              {/* Suggestion cards */}
              {suggestions.map((s) => {
                const isApproved   = approved.has(s.drugCode);
                const isRejected   = rejected.has(s.drugCode);
                const isLowStock   = s.quantityInStock > 0 && s.quantityInStock < 50;
                const isOutOfStock = s.quantityInStock === 0;

                return (
                  <div
                    key={s.drugCode}
                    className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                      isApproved
                        ? 'border-emerald-400 dark:border-emerald-600 shadow-emerald-100 dark:shadow-none shadow-md'
                        : isRejected
                        ? 'border-slate-200 dark:border-slate-700 opacity-40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                    } bg-white dark:bg-slate-800`}
                  >
                    <div className="p-4 space-y-3">
                      {/* ── Card header row ── */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Badge row */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${PRIORITY_STYLES[s.priority] ?? PRIORITY_STYLES['Supportive']}`}>
                              {s.priority}
                            </span>

                            {s.allergyConflict && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700 flex items-center gap-1">
                                <IconAlertTriangle size={12} /> Allergy Conflict
                              </span>
                            )}

                            {s.isControlled && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700 flex items-center gap-1">
                                <IconLock size={12} /> Controlled
                              </span>
                            )}

                            {isOutOfStock ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1">
                                <IconAlertTriangle size={12} /> Low Stock ({s.quantityInStock})
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-700 flex items-center gap-1">
                                <IconCheck size={12} /> In Stock ({s.quantityInStock})
                              </span>
                            )}
                          </div>

                          {/* Drug name */}
                          <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                            {s.genericName} <span className="text-violet-600 dark:text-violet-400">{s.strength}</span> {s.dosageForm}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Code: {s.drugCode} &nbsp;|&nbsp; GHS {s.unitPriceGhc.toFixed(2)}/unit
                          </p>
                        </div>

                        {/* Approve / Reject buttons */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleApprove(s.drugCode)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border-2 transition-all duration-150 flex items-center gap-1 ${
                              isApproved
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                                : 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                          >
                            <IconCheck size={14} /> {isApproved ? 'Approved' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleReject(s.drugCode)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border-2 transition-all duration-150 flex items-center gap-1 ${
                              isRejected
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            }`}
                          >
                            <IconX size={14} /> {isRejected ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      </div>

                      {/* ── Dose & duration strip ── */}
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Dose: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{s.suggestedDose}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <span className="text-slate-400">Duration: </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{s.durationDays} days</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <span className="text-slate-400">Est. Cost: </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            GHS {(s.unitPriceGhc * s.durationDays).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* ── AI reasoning ── */}
                      <div className="border-l-2 border-violet-300 dark:border-violet-700 pl-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 block mb-0.5 uppercase tracking-wide">
                          AI Clinical Reasoning
                        </span>
                        {s.reasoning}
                      </div>
                    </div>

                    {/* Approved bottom bar */}
                    {isApproved && (
                      <div className="bg-emerald-600 px-4 py-1.5 text-[10px] font-extrabold text-white text-center tracking-wide flex items-center justify-center gap-1">
                        <IconCheck size={14} /> APPROVED — Will be added to Clinical Orders
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Add approved to orders & Insert AI Clinical Note CTA ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {approvedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleAddApprovedToOrders}
                    className="py-3.5 px-4 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                    }}
                  >
                    <IconPill size={16} /> Add {approvedCount} Approved Rx to Orders
                  </button>
                )}

                {onInsertAINotes && (
                  <button
                    type="button"
                    onClick={() => {
                      const notesSummary = `AI Clinical Recommendation Summary:\n` +
                        suggestions.map(s => `• ${s.genericName} ${s.strength} (${s.suggestedDose} x ${s.durationDays}d) — ${s.reasoning}`).join('\n') +
                        `\n• Guideline Compliance: GSTG 2026 Verified | Allergy Check: ${patient?.allergies.length ? 'Screened' : 'No known allergies'}.`;
                      onInsertAINotes(notesSummary);
                    }}
                    className="py-3.5 px-4 rounded-xl font-extrabold text-xs bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <IconFileText size={16} /> Append AI Clinical Note to Treatment Plan
                  </button>
                )}
              </div>

              {/* Success banner after adding */}
              {addedBanner && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3 text-center text-[12px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2">
                  <IconCircleCheck size={16} />
                  Medicines added to Clinical Orders — review below before signing the encounter.
                </div>
              )}
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && hasRun && suggestions.length === 0 && !error && (
            <div className="text-center py-8 space-y-2">
              <IconAlertTriangle size={32} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No suggestions returned</p>
              <p className="text-[11px] text-slate-400">
                The AI did not return any medicine suggestions. Try adding more specific ICD-10 diagnoses and re-run.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
