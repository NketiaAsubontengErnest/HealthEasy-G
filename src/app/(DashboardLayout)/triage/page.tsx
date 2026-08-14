'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { EmergencySeverity } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconHeartbeat,
  IconAlertCircle,
  IconCircleCheck,
  IconActivity,
  IconUser,
  IconStethoscope
} from '@tabler/icons-react';

export default function TriagePage() {
  return (
    <RoleGuard routePath="/triage">
      <TriageContent />
    </RoleGuard>
  );
}

function TriageContent() {
  const { patients, vitals, recordVitals } = useHMS();
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  
  // Vital Form Inputs
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [pulseRate, setPulseRate] = useState<number>(72);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(16);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(98);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [glucose, setGlucose] = useState<number>(5.5);
  const [painScore, setPainScore] = useState<number>(0);
  const [esiSeverity, setEsiSeverity] = useState<EmergencySeverity>('ESI-3 Urgent');
  const [nursingNotes, setNursingNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('Nurse Abena Osei');

  // Dynamic BMI Calculation
  const bmi = heightCm > 0 ? parseFloat((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1)) : 0;

  // Dynamic Abnormal Vital Detector
  const abnormalAlerts: string[] = [];
  if (systolicBp >= 140) abnormalAlerts.push('Elevated Systolic BP (Hypertension Risk)');
  if (diastolicBp >= 90) abnormalAlerts.push('Elevated Diastolic BP');
  if (temperature >= 38.0) abnormalAlerts.push('Fever / Pyrexia (Temp >= 38.0°C)');
  if (oxygenSaturation < 95) abnormalAlerts.push('Hypoxia Warning (SpO2 < 95%)');
  if (pulseRate > 100) abnormalAlerts.push('Tachycardia (Pulse > 100 bpm)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordVitals({
      patientId: selectedPatientId,
      encounterId: `enc-${Date.now()}`,
      systolicBp,
      diastolicBp,
      pulseRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weightKg,
      heightCm,
      bmi,
      bloodGlucoseMmoles: glucose,
      painScore,
      esiSeverity,
      nursingNotes,
      abnormalAlerts,
      recordedBy
    });

    setNursingNotes('');
    alert('Structured Vital Signs & Nursing Assessment saved into FHIR Observation format!');
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 5: Clinical Triage & FHIR Vitals
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Triage & Nursing Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture vital signs as structured numeric observations (FHIR Observation model) with automatic clinical alerts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vital Entry Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IconHeartbeat className="text-rose-600" size={22} />
              Record Vital Signs & Triage Score
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Select Queue Patient *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.mrn} - {p.fullName} ({p.patientCategory})
                  </option>
                ))}
              </select>
            </div>

            {/* Abnormal Alert Bar */}
            {abnormalAlerts.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <IconAlertCircle size={16} className="text-rose-600" /> Automatic Clinical Warnings Detected:
                </span>
                <ul className="list-disc pl-5 font-semibold text-[11px] space-y-0.5">
                  {abnormalAlerts.map((alt, i) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Oxygen Sat. SpO2 (%)</label>
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Calculated BMI</label>
                <input
                  type="text"
                  readOnly
                  value={bmi}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border rounded-lg font-bold font-mono text-emerald-600"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Blood Glucose (mmol/L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={glucose}
                  onChange={(e) => setGlucose(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Emergency Severity Index (ESI) *</label>
                <select
                  value={esiSeverity}
                  onChange={(e) => setEsiSeverity(e.target.value as EmergencySeverity)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold text-rose-700"
                >
                  <option value="ESI-1 Resuscitation">ESI-1 Resuscitation (Immediate Life Threat)</option>
                  <option value="ESI-2 Emergency">ESI-2 Emergency (High Risk / Confused / Severe Pain)</option>
                  <option value="ESI-3 Urgent">ESI-3 Urgent (Requires Multiple Resources)</option>
                  <option value="ESI-4 Less Urgent">ESI-4 Less Urgent (One Resource)</option>
                  <option value="ESI-5 Non-Urgent">ESI-5 Non-Urgent (No Resources)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Assigned Triage Nurse</label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Nursing Clinical Notes & Presenting Complaints</label>
              <textarea
                rows={3}
                placeholder="Write initial nursing notes, pain description, or chief complaint..."
                value={nursingNotes}
                onChange={(e) => setNursingNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-500 transition text-sm"
            >
              Save Vitals & Transfer to Doctor Queue
            </button>
          </form>
        </div>

        {/* Vital Sign Audit Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Recorded Vital Signs Log</h3>
            <div className="space-y-4">
              {vitals.map((v) => {
                const pat = patients.find((p) => p.id === v.patientId);
                return (
                  <div key={v.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">{pat?.fullName || 'Patient'} ({pat?.mrn})</span>
                      <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                        {v.esiSeverity}
                      </span>
                    </div>
                    <span className="text-slate-400 block text-[10px]">{v.timestamp} by {v.recordedBy}</span>

                    <div className="grid grid-cols-3 gap-2 py-2 font-mono text-center bg-white dark:bg-slate-800 p-2 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 block">BP</span>
                        <span className="font-bold text-slate-900 dark:text-white">{v.systolicBp}/{v.diastolicBp}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pulse</span>
                        <span className="font-bold text-slate-900 dark:text-white">{v.pulseRate} bpm</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Temp</span>
                        <span className="font-bold text-slate-900 dark:text-white">{v.temperature}°C</span>
                      </div>
                    </div>

                    {v.nursingNotes && (
                      <p className="text-slate-600 dark:text-slate-300 italic">{v.nursingNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
