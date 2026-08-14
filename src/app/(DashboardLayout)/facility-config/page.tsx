'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconBuildingHospital,
  IconShieldCheck,
  IconClock,
  IconReceiptTax,
  IconAlertTriangle,
  IconUserCheck
} from '@tabler/icons-react';

export default function FacilityConfigPage() {
  return (
    <RoleGuard routePath="/facility-config">
      <FacilityConfigContent />
    </RoleGuard>
  );
}

function FacilityConfigContent() {
  const { facilities, staff, beds } = useHMS();
  const [activeTab, setActiveTab] = useState<'facilities' | 'hefra' | 'tariffs' | 'rooms'>('facilities');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 1: Admin & Compliance
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Facility Configuration & HeFRA Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure hospital branches, consulting rooms, service tariffs, and monitor HeFRA & professional licensing status.
          </p>
        </div>
        <a
          href="/hospitals-management"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
        >
          🏥 Manage Hospitals & Multi-Tenancy →
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'facilities'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Facility Branches ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('hefra')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'hefra'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          HeFRA & Staff Credentials
        </button>
        <button
          onClick={() => setActiveTab('tariffs')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'tariffs'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Multi-Payer Tariffs
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'rooms'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Consulting Rooms & Wards ({beds.length} Beds)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facilities.map((fac) => (
            <div key={fac.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 font-bold">
                    {fac.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{fac.name}</h3>
                  <p className="text-xs text-slate-500">{fac.location}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {fac.hefraStatus}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">HeFRA License No:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{fac.hefraLicenseNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HeFRA Renewal Expiry:</span>
                  <span className="font-bold text-emerald-600">{fac.hefraExpiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GhanaPost GPS Address:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{fac.gpsAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Contact:</span>
                  <span className="text-slate-800 dark:text-slate-200">{fac.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'hefra' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Staff Credential & License Audit Log</h3>
            <p className="text-xs text-slate-500">
              HeFRA compliance rules mandate valid MDC, NMC, Pharmacy Council, and AHPC professional licenses for all practitioners.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Staff Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Licensing Board</th>
                  <th className="px-4 py-3">License No.</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.role}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.department}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{s.licensingBody}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.licenseNumber}</td>
                    <td className="px-4 py-3 text-xs font-bold">{s.licenseExpiry}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          s.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tariffs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Payer Service Tariff Catalogue</h3>
          <p className="text-xs text-slate-500">
            Version-controlled price lists for Cash, NHIS GHS Tariffs, and Private Health Insurance.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Service Code</th>
                  <th className="px-4 py-3">Service Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Cash Tariff (GHS)</th>
                  <th className="px-4 py-3">NHIS Tariff (GHS)</th>
                  <th className="px-4 py-3">Private Ins. Tariff (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">GHS-OPD-CON-01</td>
                  <td className="px-4 py-3 font-medium">General Medical Consultation</td>
                  <td className="px-4 py-3 text-xs text-slate-500">Consultation</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">GHS 50.00</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">GHS 35.00</td>
                  <td className="px-4 py-3 font-bold text-blue-600">GHS 80.00</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">LAB-FBC-02</td>
                  <td className="px-4 py-3 font-medium">Full Blood Count (FBC)</td>
                  <td className="px-4 py-3 text-xs text-slate-500">Laboratory</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">GHS 60.00</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">GHS 45.00</td>
                  <td className="px-4 py-3 font-bold text-blue-600">GHS 90.00</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">MED-AML-10</td>
                  <td className="px-4 py-3 font-medium">Tab Amlodipine 10mg x 30</td>
                  <td className="px-4 py-3 text-xs text-slate-500">Pharmacy</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">GHS 40.00</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">GHS 36.00</td>
                  <td className="px-4 py-3 font-bold text-blue-600">GHS 55.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beds.map((bed) => (
            <div key={bed.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">{bed.wardName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    bed.status === 'Occupied'
                      ? 'bg-rose-100 text-rose-800'
                      : bed.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {bed.status}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{bed.bedNumber}</h4>
              <p className="text-xs text-slate-500 mt-1">Rate: GHS {bed.dailyRateGhc}/day</p>
              {bed.currentPatientName && (
                <div className="mt-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg text-xs">
                  <span className="text-slate-500 block">Occupants:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{bed.currentPatientName} ({bed.currentMrn})</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
