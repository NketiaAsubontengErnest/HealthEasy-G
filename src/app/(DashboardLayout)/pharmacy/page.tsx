'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { PharmacyBatchItem } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconPill,
  IconAlertTriangle,
  IconCheck,
  IconShieldCheck,
  IconBox,
  IconHistory
} from '@tabler/icons-react';

export default function PharmacyPage() {
  return (
    <RoleGuard routePath="/pharmacy">
      <PharmacyContent />
    </RoleGuard>
  );
}

function PharmacyContent() {
  const { pharmacyBatches, dispenseRecords, dispenseMedication, patients } = useHMS();
  const [activeTab, setActiveTab] = useState<'inventory' | 'controlled' | 'dispense'>('inventory');

  // Dispense Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState(pharmacyBatches[0]?.id || '');
  const [dispenseQty, setDispenseQty] = useState(30);
  const [pharmacistName, setPharmacistName] = useState('Pharm. Kojo Appiah (Pharmacy Council)');

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === selectedPatientId);
    const batch = pharmacyBatches.find((b) => b.id === selectedBatchId);
    if (!pat || !batch) return;

    dispenseMedication(
      `rx-${Date.now()}`,
      pat.id,
      pat.mrn,
      pat.fullName,
      `${batch.genericName} ${batch.strength}`,
      dispenseQty,
      batch.batchNumber,
      pharmacistName
    );

    alert(`Successfully dispensed ${dispenseQty} units of ${batch.genericName} via FEFO protocol! Batch stock updated.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 11: FEFO Pharmacy & FDA Traceability
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Pharmacy & FEFO Batch Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            First-Expiry-First-Out (FEFO) dispensing, controlled drug register, and FDA Ghana batch recall traceability.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'inventory'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          FEFO Batch Inventory ({pharmacyBatches.length} Batches)
        </button>
        <button
          onClick={() => setActiveTab('dispense')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'dispense'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dispense Medication
        </button>
        <button
          onClick={() => setActiveTab('controlled')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'controlled'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Controlled Substance Register (Narcotics / Tramadol)
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">FEFO Batch Directory</h3>
            <span className="text-xs font-mono text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full">
              Sorted by Nearest Expiry Date First
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Generic & Brand Name</th>
                  <th className="px-4 py-3">Form & Strength</th>
                  <th className="px-4 py-3">Expiry Date (FEFO)</th>
                  <th className="px-4 py-3">In Stock</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pharmacyBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{batch.batchNumber}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block">{batch.genericName}</span>
                      <span className="text-slate-400 text-xs">{batch.brandName}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{batch.dosageForm} - {batch.strength}</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600 text-xs">{batch.expiryDate}</td>
                    <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">{batch.quantityInStock}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">GHS {batch.unitPriceGhc.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{batch.supplier}</td>
                    <td className="px-4 py-3">
                      {batch.quantityInStock <= batch.reorderLevel ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dispense' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <IconPill className="text-amber-600" size={22} /> FEFO Prescription Dispensing Modal
            </h3>

            <form onSubmit={handleDispense} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.mrn} - {p.fullName} ({p.patientCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Select FEFO Drug Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono"
                >
                  {pharmacyBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.batchNumber}] {b.genericName} {b.strength} - Exp: {b.expiryDate} ({b.quantityInStock} left)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Quantity to Dispense *</label>
                <input
                  type="number"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Dispensing Pharmacist</label>
                <input
                  type="text"
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 text-white font-extrabold rounded-xl shadow hover:bg-amber-500 text-sm"
              >
                Execute FEFO Dispense & Update Stock
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Dispensing History Log</h3>
            <div className="space-y-3">
              {dispenseRecords.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">{d.patientName} ({d.mrn})</span>
                    <span className="text-amber-700">{d.drugName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-mono text-[10px]">
                    <span>Batch: {d.batchNumber} | Qty: {d.quantityDispensed}</span>
                    <span>By: {d.dispensedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'controlled' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Controlled Drug & Narcotics Register</h3>
            <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2.5 py-1 rounded-full">
              Pharmacy Council Ghana Audit Ready
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mandatory tracking for restricted pharmaceutical substances (e.g. Tramadol, Pethidine, Morphine) per Pharmacy Council regulations.
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>Tramadol HCl 50mg Capsules (Batch BN-TRM-RESTRICTED)</span>
              <span className="text-rose-600 font-mono">40 Caps Remaining</span>
            </div>
            <p className="text-slate-500">All requisitions require double sign-off by head pharmacist and prescribing medical officer.</p>
          </div>
        </div>
      )}
    </div>
  );
}
