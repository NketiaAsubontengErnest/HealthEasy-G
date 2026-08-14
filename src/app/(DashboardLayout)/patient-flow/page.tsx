'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconClock,
  IconArrowRight,
  IconDeviceTv,
  IconChecklist,
  IconUserCheck,
  IconStethoscope,
  IconFlask,
  IconPill,
  IconReceiptTax
} from '@tabler/icons-react';

export default function PatientFlowPage() {
  return (
    <RoleGuard routePath="/patient-flow">
      <PatientFlowContent />
    </RoleGuard>
  );
}

function PatientFlowContent() {
  const { queues, updateQueueStatus } = useHMS();
  const [tvMode, setTvMode] = useState(false);

  const journeySteps = [
    { title: '1. Registration', dept: 'Registration', icon: IconUserCheck },
    { title: '2. Triage', dept: 'Triage', icon: IconStethoscope },
    { title: '3. Consultation', dept: 'OPD Consultation', icon: IconChecklist },
    { title: '4. Lab / Rad', dept: 'Laboratory', icon: IconFlask },
    { title: '5. Pharmacy', dept: 'Pharmacy', icon: IconPill },
    { title: '6. Billing', dept: 'Billing', icon: IconReceiptTax }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 3 & 4: Patient Flow Management
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Patient Journey & Real-Time Queue Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track "Patient Currently At" location continuously across every department service point.
          </p>
        </div>

        <button
          onClick={() => setTvMode(!tvMode)}
          className={`font-bold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2 ${
            tvMode ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white dark:bg-slate-700'
          }`}
        >
          <IconDeviceTv size={18} /> {tvMode ? 'Exit OPD TV Screen View' : 'OPD Waiting Lounge Display View'}
        </button>
      </div>

      {/* OPD TV Display Mode */}
      {tvMode ? (
        <div className="bg-slate-950 text-white p-8 rounded-3xl space-y-8 border border-emerald-500/30 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-widest block">
                HealthEasy-G OPD Display
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">Now Serving Queue Numbers</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-slate-400 block">{new Date().toLocaleTimeString()}</span>
              <span className="text-xs text-emerald-400 font-semibold">Live System Update</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {queues.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 text-center shadow-lg"
              >
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">{item.department}</span>
                <div className="text-5xl font-extrabold font-mono text-emerald-400 tracking-wider">
                  {item.queueNumber}
                </div>
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-sm font-bold block text-white">{item.patientName}</span>
                  <span className="text-xs text-amber-400 font-medium">Proceed to: {item.servicePoint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Patient Journey Flow Visualization */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Standard Patient Journey Progression
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {journeySteps.map((step, idx) => {
                const StepIcon = step.icon;
                const count = queues.filter((q) => q.department === step.dept).length;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center relative"
                  >
                    <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                      <StepIcon size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{step.title}</span>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold block mt-1">
                      {count} in queue
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Queue Directory & Location Transfer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Active Patient Queue Directory</h3>
              <span className="text-xs text-slate-500 font-medium">
                Total Active: <strong>{queues.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Queue #</th>
                    <th className="px-4 py-3">Patient Name & MRN</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Current Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Transfer Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {queues.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">{item.queueNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{item.patientName}</span>
                        <span className="text-slate-400 font-mono text-xs">{item.mrn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.patientCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            item.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.department}</td>
                      <td className="px-4 py-3 text-xs text-amber-700 font-medium">{item.currentLocation}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            item.status === 'Waiting'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <Link
                          href={`/emr-consultation?patientId=${item.patientId}`}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded shadow inline-flex items-center gap-1"
                        >
                          Doctor Consultation & AI →
                        </Link>
                        <button
                          onClick={() => updateQueueStatus(item.id, 'Completed', 'Discharged')}
                          className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded border"
                        >
                          Discharge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
