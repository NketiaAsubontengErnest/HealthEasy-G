'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconReceiptTax,
  IconDownload,
  IconCheck,
  IconAlertCircle,
  IconShieldCheck
} from '@tabler/icons-react';

export default function NhisClaimsPage() {
  return (
    <RoleGuard routePath="/nhis-claims">
      <NhisClaimsContent />
    </RoleGuard>
  );
}

function NhisClaimsContent() {
  const { nhisClaims, nhisBatches } = useHMS();
  const [activeTab, setActiveTab] = useState<'claims' | 'batches' | 'export'>('claims');

  const handleClaimItExport = () => {
    const claimData = JSON.stringify(nhisClaims, null, 2);
    const blob = new Blob([claimData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NHIA_CLAIM_IT_EXPORT_FACILITY_GAR_RIDGE_01_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    alert('CLAIM-it compatible JSON export generated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-1 rounded-full font-bold border border-purple-400/30">
            NHIA Official Workflow Compatible
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <IconReceiptTax size={28} /> NHIS & Multi-Payer Claims Engine
          </h1>
          <p className="text-purple-100 text-xs mt-1">
            Automated claim line extraction, tariff validation, and CLAIM-it electronic batch exporter.
          </p>
        </div>

        <button
          onClick={handleClaimItExport}
          className="bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow hover:bg-emerald-300 transition text-sm flex items-center gap-2"
        >
          <IconDownload size={18} /> Export for CLAIM-it Software
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'claims'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Extracted Claim Lines ({nhisClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'batches'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Claim Batches ({nhisBatches.length})
        </button>
      </div>

      {activeTab === 'claims' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Validated Clinical Claim Lines</h3>
            <span className="text-xs font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full">
              NHIA Base Tariff Tables V2026.1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Claim Ref #</th>
                  <th className="px-4 py-3">Patient & MRN</th>
                  <th className="px-4 py-3">NHIS Number</th>
                  <th className="px-4 py-3">NIA Verification Ref</th>
                  <th className="px-4 py-3">ICD Diagnosis</th>
                  <th className="px-4 py-3">Service Code</th>
                  <th className="px-4 py-3">Claimed Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {nhisClaims.map((clm) => (
                  <tr key={clm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{clm.claimId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{clm.mrn}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{clm.nhisNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{clm.verificationRef}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {clm.diagnosisCode}: {clm.diagnosisName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{clm.tariffServiceCode}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">GHS {clm.totalClaimAmountGhc.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                        {clm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nhisBatches.map((b) => (
            <div key={b.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 block">Facility: {b.facilityCode}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{b.batchNo}</h3>
                  <span className="text-xs text-slate-500 block">Period: {b.monthYear}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {b.status}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Enclosed Claims:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{b.claimCount} Claims</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Receivable Value:</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">GHS {b.totalAmountGhc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
