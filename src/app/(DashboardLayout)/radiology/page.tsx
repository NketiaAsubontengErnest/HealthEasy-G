'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { RadiologyOrderRecord } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconScan,
  IconCheck,
  IconAlertTriangle,
  IconFileText
} from '@tabler/icons-react';

export default function RadiologyPage() {
  return (
    <RoleGuard routePath="/radiology">
      <RadiologyContent />
    </RoleGuard>
  );
}

function RadiologyContent() {
  const { radiologyOrders } = useHMS();
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrderRecord | null>(radiologyOrders[0] || null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 10: Radiology & Diagnostic Imaging
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Radiology Order Tracking & Diagnostic Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            X-Ray, Ultrasound, CT, and MRI orders with pregnancy safety screening and radiologist report verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Radiology Imaging Queue</h3>
          <div className="space-y-3">
            {radiologyOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 text-xs ${
                  selectedOrder?.id === ord.id
                    ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/40'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{ord.patientName}</span>
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {ord.modality}
                  </span>
                </div>
                <span className="text-blue-700 font-bold block">{ord.bodyPart}</span>
                <span className="text-slate-500 text-[10px] block">Indication: {ord.clinicalIndication}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          {selectedOrder ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedOrder.modality}: {selectedOrder.bodyPart}</h3>
                  <span className="text-slate-500 text-xs">Patient: {selectedOrder.patientName} ({selectedOrder.mrn})</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs">
                  {selectedOrder.status}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <span>Pregnancy Safety Screening Completed:</span>
                <span className="font-bold">{selectedOrder.pregnancyScreened ? 'PASSED (Safe)' : 'ATTENTION'}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-2 border">
                <span className="font-bold text-slate-900 dark:text-white block">Radiographer Technical Notes:</span>
                <p className="text-slate-600 dark:text-slate-300 italic">{selectedOrder.radiographerNotes || 'Full inspiration achieved. High contrast image.'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-2 border">
                <span className="font-bold text-slate-900 dark:text-white block">Verified Radiologist Diagnostic Report:</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {selectedOrder.radiologistReport || 'Lungs clear bilaterally. No focal opacity or consolidation.'}
                </p>
                <div className="pt-2 border-t text-[10px] text-slate-400 flex justify-between">
                  <span>Authorised by: {selectedOrder.verifiedBy}</span>
                  <span>Timestamp: {selectedOrder.verificationTimestamp}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12 text-sm">Select an imaging order from queue.</div>
          )}
        </div>
      </div>
    </div>
  );
}
