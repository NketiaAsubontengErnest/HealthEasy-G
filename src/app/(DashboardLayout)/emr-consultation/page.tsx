'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconStethoscope,
  IconUser,
  IconSearch,
  IconHeartbeat,
  IconChevronRight,
  IconFilter,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconFileText
} from '@tabler/icons-react';

export default function EMRConsultationDirectoryPage() {
  return (
    <RoleGuard routePath="/emr-consultation">
      <EMRConsultationDirectoryContent />
    </RoleGuard>
  );
}

function EMRConsultationDirectoryContent() {
  const { patients, vitals, queues } = useHMS();

  // Search & Filter State
  const [patientSearch, setPatientSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Waiting' | 'Transferred' | 'Completed'>('All');

  // Filter Patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mrn.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.ghanaCardNo.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patientCategory.toLowerCase().includes(patientSearch.toLowerCase());

    const patientQueue = queues.find((q) => q.patientId === p.id);
    const queueStatus = patientQueue ? patientQueue.status : 'Completed';

    if (activeTab === 'Waiting') return matchesSearch && queueStatus === 'Waiting';
    if (activeTab === 'Transferred') return matchesSearch && queueStatus === 'Transferred';
    if (activeTab === 'Completed') return matchesSearch && queueStatus === 'Completed';

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 6: EMR & Doctor Consultation Directory
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <IconStethoscope className="text-indigo-600" size={28} /> OPD Patient Directory & Worklist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search active OPD waiting patients and select a patient to open their dedicated clinical folder & AI assistant workstation on a separate page.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <IconClock size={16} className="text-indigo-600" />
          <span>Total Registered: <strong>{patients.length}</strong></span>
        </div>
      </div>

      {/* Directory Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <IconSearch size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, MRN, Ghana Card, or Category..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs">
            {(['All', 'Waiting', 'Transferred', 'Completed'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'All' ? 'All Patients' : tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient Directory Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-700">
                <th className="p-3.5">PATIENT DETAILS</th>
                <th className="p-3.5">MRN & GHANA CARD</th>
                <th className="p-3.5">CATEGORY</th>
                <th className="p-3.5">LATEST TRIAGE VITALS</th>
                <th className="p-3.5">QUEUE LOCATION</th>
                <th className="p-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => {
                  const pVitals = vitals.find((v) => v.patientId === p.id);
                  const pQueue = queues.find((q) => q.patientId === p.id);
                  const queueStatus = pQueue ? pQueue.status : 'Completed';
                  const location = pQueue ? pQueue.currentLocation : 'Discharged';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                              {p.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {p.gender}, DOB: {p.dob}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-emerald-600 block">{p.mrn}</span>
                        <span className="text-[10px] text-slate-400 block">{p.ghanaCardNo}</span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            p.patientCategory === 'NHIS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.patientCategory}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {pVitals ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              BP {pVitals.systolicBp}/{pVitals.diastolicBp} mmHg
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Temp: {pVitals.temperature}°C · Pulse: {pVitals.pulseRate} bpm
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No vitals recorded</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block mb-1 ${
                              queueStatus === 'Waiting'
                                ? 'bg-indigo-100 text-indigo-800'
                                : queueStatus === 'Transferred'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {queueStatus}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]" title={location}>
                            {location}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/emr-consultation/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow transition group-hover:scale-105"
                        >
                          <span>Open Folder</span>
                          <IconArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No matching patient records found in OPD Directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
