'use client';

import React from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconChartBar,
  IconDownload,
  IconCheck,
  IconAlertTriangle,
  IconFileSpreadsheet
} from '@tabler/icons-react';

export default function Dhims2ReportsPage() {
  return (
    <RoleGuard routePath="/dhims2-reports">
      <Dhims2ReportsContent />
    </RoleGuard>
  );
}

function Dhims2ReportsContent() {
  const { dhimsReport } = useHMS();

  const handleExportDhims2 = () => {
    const payload = JSON.stringify(dhimsReport, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DHIMS2_FACILITY_MONTHLY_REPORT_${dhimsReport.monthYear}.json`;
    a.click();
    alert('DHIMS2-ready API payload exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 14: DHIMS2 & Regulatory Public Health
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            DHIMS2 & GHS Public Health Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated OPD attendance matrices by age/sex, disease surveillance alerts, and DHIMS2 JSON export format.
          </p>
        </div>

        <button
          onClick={handleExportDhims2}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2"
        >
          <IconDownload size={18} /> Export DHIMS2 JSON Payload
        </button>
      </div>

      {/* OPD Attendance Matrix Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Total OPD Attendance</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {dhimsReport.totalOpdAttendance.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Month: {dhimsReport.monthYear}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Under 5 OPD Visits</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">
            {dhimsReport.opdUnder5Male + dhimsReport.opdUnder5Female}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            M: {dhimsReport.opdUnder5Male} | F: {dhimsReport.opdUnder5Female}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Above 5 OPD Visits</span>
          <span className="text-3xl font-extrabold text-blue-600 mt-1 block">
            {dhimsReport.opdAbove5Male + dhimsReport.opdAbove5Female}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            M: {dhimsReport.opdAbove5Male} | F: {dhimsReport.opdAbove5Female}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block uppercase">Maternal Deliveries</span>
          <span className="text-3xl font-extrabold text-rose-600 mt-1 block">{dhimsReport.maternalDeliveries}</span>
          <span className="text-xs text-emerald-600 font-bold mt-1 block">0 Maternal Deaths</span>
        </div>
      </div>

      {/* Top 10 Disease Surveillance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Top Facility Morbidity & Disease Surveillance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Disease / Condition</th>
                <th className="px-4 py-3">Reported Cases</th>
                <th className="px-4 py-3">% of Total OPD Morbidity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {dhimsReport.topDiagnoses.map((diag, index) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-bold font-mono text-emerald-600">#{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{diag.disease}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{diag.cases}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {((diag.cases / dhimsReport.totalOpdAttendance) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
