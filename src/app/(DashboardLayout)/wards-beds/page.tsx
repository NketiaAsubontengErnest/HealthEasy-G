'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconBed,
  IconClock,
  IconChecklist,
  IconPill,
  IconAlertCircle,
  IconUserCheck
} from '@tabler/icons-react';

export default function WardsBedsPage() {
  return (
    <RoleGuard routePath="/wards-beds">
      <WardsBedsContent />
    </RoleGuard>
  );
}

function WardsBedsContent() {
  const { beds, mar, updateBedStatus, currentRole } = useHMS();
  const [activeTab, setActiveTab] = useState<'grid' | 'mar'>('grid');
  const isDoctor = currentRole === 'Doctor';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Module 8: Inpatient Wards & MAR
            </span>
            {isDoctor && (
              <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                Doctor Read-Only Inpatient View
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Inpatient, Ward & Bed Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ward occupancy grid, nursing care plans, and Medication Administration Records (MAR).
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          onClick={() => setActiveTab('grid')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'grid'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Visual Bed Occupancy Grid ({beds.length} Total)
        </button>
        <button
          onClick={() => setActiveTab('mar')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'mar'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Medication Administration Record (MAR)
        </button>
      </div>

      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {beds.map((bed) => (
            <div
              key={bed.id}
              className={`p-5 rounded-2xl border space-y-3 shadow-sm transition ${
                bed.status === 'Occupied'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : bed.status === 'Available'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider">{bed.wardName}</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/70">
                  {bed.status}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold">{bed.bedNumber}</h4>
                {!isDoctor && <span className="text-xs opacity-75 block">Rate: GHS {bed.dailyRateGhc}/day</span>}
              </div>

              {bed.currentPatientName && (
                <div className="bg-white/80 p-2.5 rounded-xl text-xs space-y-0.5 text-slate-900">
                  <span className="font-bold block">{bed.currentPatientName}</span>
                  <span className="font-mono text-[10px] text-slate-500">{bed.currentMrn}</span>
                </div>
              )}

              {!isDoctor && (
                <div className="pt-2">
                  {bed.status === 'Occupied' ? (
                    <button
                      onClick={() => updateBedStatus(bed.id, 'Cleaning')}
                      className="w-full py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700"
                    >
                      Discharge & Clean
                    </button>
                  ) : bed.status === 'Cleaning' ? (
                    <button
                      onClick={() => updateBedStatus(bed.id, 'Available')}
                      className="w-full py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700"
                    >
                      Mark Cleaned & Ready
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-bold block text-center">Ready for Admission</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mar' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <IconPill className="text-teal-600" size={22} /> Inpatient Medication Administration Log (MAR)
            </h3>
            <span className="text-xs font-mono bg-teal-100 text-teal-800 font-bold px-2 py-1 rounded">
              Shift Medication Schedule
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Patient & Bed</th>
                  <th className="px-4 py-3">Prescribed Drug</th>
                  <th className="px-4 py-3">Dosage & Route</th>
                  <th className="px-4 py-3">Scheduled Due Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Administered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {mar.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{item.patientName}</span>
                      <span className="text-xs font-mono text-teal-600 font-semibold">{item.bedNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.drugName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.dosage} ({item.route})</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 text-xs">{item.dueTime}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          item.status === 'Administered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.administeredBy || 'Pending Shift Nurse'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
