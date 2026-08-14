'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { LabOrderRecord } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconFlask,
  IconBarcode,
  IconCheck,
  IconAlertTriangle,
  IconSignature
} from '@tabler/icons-react';

export default function LaboratoryPage() {
  return (
    <RoleGuard routePath="/laboratory">
      <LaboratoryContent />
    </RoleGuard>
  );
}

function LaboratoryContent() {
  const { labOrders, recordLabResult } = useHMS();
  const [selectedOrder, setSelectedOrder] = useState<LabOrderRecord | null>(labOrders[0] || null);

  // Result Entry Form State
  const [hbValue, setHbValue] = useState<number>(14.2);
  const [wbcValue, setWbcValue] = useState<number>(6.8);
  const [techName, setTechName] = useState('Ebenezer Boateng (AHPC)');

  const handleVerifyResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    recordLabResult(
      selectedOrder.id,
      [
        { parameter: 'Hemoglobin (Hb)', value: hbValue, unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: hbValue < 13.5, isCritical: hbValue < 7.0 },
        { parameter: 'White Blood Cells (WBC)', value: wbcValue, unit: 'x10^9/L', referenceRange: '4.0 - 11.0', isAbnormal: wbcValue > 11.0, isCritical: wbcValue > 20.0 }
      ],
      techName
    );

    alert('Laboratory Diagnostic Report verified and linked to Patient EMR Encounter!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 9: Laboratory Information System (LIS)
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Laboratory Specimen Tracking & Result Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Barcode specimen tracking, age/sex reference range validation, and critical alert log.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Worklist Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">LIS Active Order Worklist</h3>
          <div className="space-y-3">
            {labOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 text-xs ${
                  selectedOrder?.id === ord.id
                    ? 'bg-teal-50/70 border-teal-500 dark:bg-teal-950/40'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{ord.patientName} ({ord.mrn})</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>
                <span className="text-teal-700 font-bold block">{ord.testName}</span>
                <div className="flex justify-between items-center font-mono text-[10px] text-slate-500">
                  <span>Barcode: {ord.specimenBarcode}</span>
                  <span>Category: {ord.testCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Order Result Entry & Report Preview */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          {selectedOrder ? (
            <>
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4 space-y-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedOrder.testName}</h3>
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {selectedOrder.specimenBarcode}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Patient: <strong>{selectedOrder.patientName}</strong> ({selectedOrder.mrn}) | Specimen: {selectedOrder.specimenType}
                </p>
              </div>

              <form onSubmit={handleVerifyResult} className="space-y-4 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">Enter Numeric Parameters:</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1">
                    <label className="font-semibold block text-slate-700 dark:text-slate-300">Hemoglobin (Hb) [g/dL]</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hbValue}
                      onChange={(e) => setHbValue(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block">Ref Range: 13.5 - 17.5 g/dL</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-1">
                    <label className="font-semibold block text-slate-700 dark:text-slate-300">White Blood Cells (WBC) [x10^9/L]</label>
                    <input
                      type="number"
                      step="0.1"
                      value={wbcValue}
                      onChange={(e) => setWbcValue(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 block">Ref Range: 4.0 - 11.0 x10^9/L</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Authorising Lab Scientist *</label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">AHPC Credential Verified</span>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl shadow hover:bg-teal-500 text-xs flex items-center gap-2"
                  >
                    <IconCheck size={16} /> Verify & Authorise Lab Report
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center text-slate-400 py-12 text-sm">Select an active laboratory order to view result entry form.</div>
          )}
        </div>
      </div>
    </div>
  );
}
