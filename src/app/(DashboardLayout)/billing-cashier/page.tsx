'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { BillingInvoice, PaymentMethod } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconReceipt,
  IconReceiptTax,
  IconDeviceMobile,
  IconCreditCard,
  IconCash,
  IconPrinter,
  IconX,
  IconCheck
} from '@tabler/icons-react';

export default function BillingCashierPage() {
  return (
    <RoleGuard routePath="/billing-cashier">
      <BillingCashierContent />
    </RoleGuard>
  );
}

function BillingCashierContent() {
  const { invoices } = useHMS();
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(invoices[0] || null);
  const [receiptModal, setReceiptModal] = useState<BillingInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN MoMo');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 12: Billing, Cashier & Multi-Payment
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Billing, Cashier & Revenue Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auto-generated charges from clinical orders, MTN MoMo / Telecel Cash integrations, and cashier shift closing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invoices Directory */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Unbilled & Paid Patient Invoices</h3>
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 text-xs ${
                  selectedInvoice?.id === inv.id
                    ? 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/40'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-emerald-600">{inv.invoiceNo}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inv.paymentStatus}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{inv.patientName} ({inv.mrn})</div>
                <div className="flex justify-between items-center font-mono font-bold">
                  <span className="text-slate-500 text-[10px]">Category: {inv.patientCategory}</span>
                  <span className="text-slate-900 dark:text-white text-sm">GHS {inv.totalAmountGhc.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Invoice Details & Checkout */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          {selectedInvoice ? (
            <div className="space-y-5 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceNo}</h3>
                  <span className="text-slate-500 text-xs">Patient: {selectedInvoice.patientName} ({selectedInvoice.mrn})</span>
                </div>
                <button
                  onClick={() => setReceiptModal(selectedInvoice)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg border flex items-center gap-1"
                >
                  <IconPrinter size={16} /> Print Receipt
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Auto-Generated Line Item Charges:</h4>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2 border">
                  {selectedInvoice.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{item.description}</span>
                        <span className="text-[10px] text-slate-400">Category: {item.category}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 dark:text-white block">GHS {item.amountGhc.toFixed(2)}</span>
                        {item.nhisCoveredGhc > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold block">NHIS Covered: GHS {item.nhisCoveredGhc.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl space-y-2 text-emerald-950 dark:text-emerald-200 border border-emerald-200">
                <div className="flex justify-between">
                  <span>Total Gross Charges:</span>
                  <span className="font-mono font-bold">GHS {selectedInvoice.totalAmountGhc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NHIS Benefit Contribution:</span>
                  <span className="font-mono font-bold text-emerald-600">- GHS {selectedInvoice.totalNhisCoveredGhc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-emerald-200">
                  <span>Patient Payable Outstanding:</span>
                  <span className="font-mono text-emerald-700">GHS {selectedInvoice.totalPatientPayableGhc.toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.paymentStatus !== 'Paid' && (
                <div className="space-y-3 pt-2">
                  <label className="font-bold text-slate-900 dark:text-white block">Select Ghana Payment Channel:</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MTN MoMo')}
                      className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                        paymentMethod === 'MTN MoMo' ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-slate-50'
                      }`}
                    >
                      <IconDeviceMobile size={20} /> MTN MoMo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Telecel Cash')}
                      className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                        paymentMethod === 'Telecel Cash' ? 'bg-rose-100 border-rose-500 text-rose-900' : 'bg-slate-50'
                      }`}
                    >
                      <IconDeviceMobile size={20} /> Telecel Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`p-3 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                        paymentMethod === 'Cash' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-slate-50'
                      }`}
                    >
                      <IconCash size={20} /> Physical Cash
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Payment of GHS ${selectedInvoice.totalPatientPayableGhc.toFixed(2)} processed via ${paymentMethod}! Shift cash ledger updated.`);
                    }}
                    className="w-full py-3 bg-emerald-600 text-white font-extrabold rounded-xl shadow hover:bg-emerald-500 text-sm"
                  >
                    Confirm & Complete Checkout Transaction
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12 text-sm">Select an invoice to process payment.</div>
          )}
        </div>
      </div>

      {/* Printable Receipt Preview Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold">Official HealthEasy-G Hospital Receipt</h3>
              <button onClick={() => setReceiptModal(null)}>
                <IconX size={18} />
              </button>
            </div>

            <div className="text-xs space-y-2 font-mono">
              <div className="text-center font-bold text-sm">RIDGE REGIONAL HOSPITAL</div>
              <div className="text-center text-[10px] text-slate-500">CASTLE ROAD, RIDGE, ACCRA</div>
              <div className="border-b pb-2">
                <div>Receipt No: {receiptModal.invoiceNo}</div>
                <div>Patient: {receiptModal.patientName} ({receiptModal.mrn})</div>
                <div>Date: {receiptModal.timestamp}</div>
              </div>

              <div className="space-y-1">
                {receiptModal.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.description}</span>
                    <span>GHS {item.amountGhc.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 font-bold flex justify-between text-sm">
                <span>Total Paid ({receiptModal.paymentMethod || 'Paid'}):</span>
                <span>GHS {receiptModal.totalAmountGhc.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => alert('Printing Receipt to Thermal Printer...')}
              className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <IconPrinter size={16} /> Send to Thermal Receipt Printer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
