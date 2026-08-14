'use client';

import React from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import { IconBox, IconAlertTriangle } from '@tabler/icons-react';

export default function InventoryProcurementPage() {
  return (
    <RoleGuard routePath="/inventory-procurement">
      <InventoryProcurementContent />
    </RoleGuard>
  );
}

function InventoryProcurementContent() {
  const { inventory } = useHMS();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 13: Stores & Procurement
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Multi-Store Inventory & Supply Chain
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central store vs ward stores, purchase requisitions, and Goods Received Notes (GRN).
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Hospital Store Items Directory</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Store Location</th>
                <th className="px-4 py-3">Batch & Expiry</th>
                <th className="px-4 py-3">On Hand</th>
                <th className="px-4 py-3">Reorder Pt</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold text-teal-600">{item.itemCode}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.storeLocation}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.batchNo} ({item.expiryDate})</td>
                  <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">{item.quantityOnHand}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.reorderPoint}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        item.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
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
