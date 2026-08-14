'use client';

import React from 'react';
import Link from 'next/link';
import { useHMS } from '@/context/HMSContext';
import {
  IconUsers,
  IconClock,
  IconBed,
  IconReceiptTax,
  IconAlertTriangle,
  IconChecklist,
  IconBuildingHospital,
  IconShieldCheck,
  IconFlask,
  IconPill,
  IconStethoscope,
  IconAlertOctagon,
  IconArrowRight,
  IconHeartbeat,
  IconFileText
} from '@tabler/icons-react';

export default function Dashboard() {
  const {
    facilities,
    patients,
    queues,
    beds,
    nhisClaims,
    labOrders,
    pharmacyBatches,
    encounters,
    staff,
    currentRole
  } = useHMS();

  // Role Checks
  const isSuperAdmin = currentRole === 'Super Admin';
  const isDoctor = currentRole === 'Doctor';

  // Computations
  const activeQueues = queues.filter((q) => q.status === 'Waiting' || q.status === 'In Consultation');
  const waitingQueues = queues.filter((q) => q.status === 'Waiting');
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied');
  const emergencyBeds = beds.filter((b) => b.status === 'Occupied' && (b.type === 'General' || b.type === 'ICU' || b.type === 'Isolation'));
  const bedOccupancyRate = beds.length > 0 ? Math.round((occupiedBeds.length / beds.length) * 100) : 0;
  
  const pendingNhisGhc = nhisClaims
    .filter((c) => c.status !== 'Paid')
    .reduce((acc, c) => acc + c.totalClaimAmountGhc, 0);

  const lowStockItems = pharmacyBatches.filter((b) => b.quantityInStock <= b.reorderLevel);
  const pendingLabResults = labOrders.filter((l) => l.status === 'Ordered' || l.status === 'Specimen Collected' || l.status === 'In Analysis');
  const myEncountersToday = encounters.filter((e) => e.signed);
  const expiringLicenses = staff.filter((s) => s.status === 'Expiring Soon' || s.status === 'Expired');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-400/30">
              {isSuperAdmin ? 'Multi-Hospital Tenant Governor' : isDoctor ? 'Doctor Clinical Workstation Active' : 'GHS & HeFRA Compliant'}
            </span>
            <span className="bg-amber-500/30 text-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-400/30">
              {isSuperAdmin ? 'DPC Privacy Shield Active' : isDoctor ? 'Patient Privacy Shield' : 'NHIS CLAIM-it Ready'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {isSuperAdmin
              ? 'HealthEasy-G Multi-Hospital Governance Portal'
              : isDoctor
              ? 'OPD Consultation & Clinical Decision Workstation'
              : (facilities[0]?.name || 'HealthEasy-G Ghana HMS')}
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            {isSuperAdmin
              ? 'System-wide Multi-Tenancy Management & Regulatory Governance Center'
              : isDoctor
              ? 'Physician Portal: OPD Consultation Waiting List, Emergency Care & Clinical Decision Support'
              : 'Integrated Hospital Management Platform for Ghana Health Service Facilities'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-right border border-white/20">
            <span className="text-xs text-emerald-200 block">{isSuperAdmin ? 'Active Role' : 'Current Facility Code'}</span>
            <span className="text-sm font-bold">{isSuperAdmin ? 'Super Admin (Level 1)' : facilities[0]?.code}</span>
          </div>
          {isSuperAdmin ? (
            <Link
              href="/hospitals-management"
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2"
            >
              <IconBuildingHospital size={18} /> Manage Hospitals
            </Link>
          ) : isDoctor ? (
            <Link
              href="/emr-consultation"
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2"
            >
              <IconStethoscope size={18} /> + Start OPD Consultation
            </Link>
          ) : (
            <Link
              href="/patient-registration"
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2"
            >
              + Register Patient
            </Link>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
          <IconShieldCheck className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Data Protection Commission (DPC) Compliance Notice</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Super Admin access is strictly governed by patient data privacy protocols. Super Admin can manage facility onboarding, HeFRA licensing, user credentials, and aggregate analytics, but is restricted from accessing confidential individual patient medical histories, clinical diagnoses, and patient index records.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {isDoctor ? (
          <>
            {/* Doctor Card 1: Waiting OPD Patients */}
            <Link href="/emr-consultation" className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-indigo-500 transition group">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting OPD Patients</span>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {waitingQueues.length} <span className="text-xs font-normal text-slate-500">in queue</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Ready for consultation</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                <IconStethoscope size={28} />
              </div>
            </Link>

            {/* Doctor Card 2: Active Emergency Patients */}
            <Link href="/emergency" className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-rose-500 transition group">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency ED Cases</span>
                <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {emergencyBeds.length} <span className="text-xs font-normal text-slate-500">active beds</span>
                </div>
                <span className="text-xs text-rose-500 font-medium mt-1 inline-block">Resuscitation & Observation</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
                <IconAlertOctagon size={28} />
              </div>
            </Link>

            {/* Doctor Card 3: Signed Consultations Today */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed Consultations</span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {myEncountersToday.length} <span className="text-xs font-normal text-slate-500">completed</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Signed & dispatched</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IconFileText size={28} />
              </div>
            </div>

            {/* Doctor Card 4: Pending Diagnostic Orders */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Lab & Imaging</span>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {pendingLabResults.length} <span className="text-xs font-normal text-slate-500">orders</span>
                </div>
                <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Awaiting lab verification</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <IconFlask size={28} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* General Administrative / Financial KPI Cards */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Queue</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeQueues.length} <span className="text-xs font-normal text-slate-500">patients</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Avg wait: 18 mins</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IconClock size={28} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bed Occupancy</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {bedOccupancyRate}% <span className="text-xs font-normal text-slate-500">({occupiedBeds.length}/{beds.length})</span>
                </div>
                <span className="text-xs text-teal-600 font-medium mt-1 inline-block">General & ICU</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <IconBed size={28} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending NHIS Receivables</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  GHS {pendingNhisGhc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Batched for CLAIM-it</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <IconReceiptTax size={28} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regulatory Alerts</span>
                <div className="text-3xl font-extrabold text-rose-600 mt-1">
                  {expiringLicenses.length + lowStockItems.length} <span className="text-xs font-normal text-slate-500">action items</span>
                </div>
                <span className="text-xs text-rose-500 font-medium mt-1 inline-block">License & Stock Alerts</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <IconAlertTriangle size={28} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {isSuperAdmin ? (
          <>
            <Link href="/hospitals-management" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconBuildingHospital size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Hospitals Portal</span>
            </Link>

            <Link href="/facility-config" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconShieldCheck size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">HeFRA & Facility Config</span>
            </Link>

            <Link href="/dhims2-reports" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconChecklist size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">DHIMS2 Aggregate</span>
            </Link>

            <Link href="/security-audit" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconAlertTriangle size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Security Audit Logs</span>
            </Link>

            <Link href="/inventory-procurement" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconFlask size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Central Stores</span>
            </Link>

            <Link href="/hospitals-management" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconUsers size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Master Accounts</span>
            </Link>
          </>
        ) : isDoctor ? (
          <>
            <Link href="/emr-consultation" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconStethoscope size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Start Consultation</span>
            </Link>

            <Link href="/emr-consultation" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconUsers size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Patient Directory</span>
            </Link>

            <Link href="/patient-flow" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconClock size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Patient Queues</span>
            </Link>

            <Link href="/emergency" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-800 hover:border-rose-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconAlertOctagon size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Emergency Cases</span>
            </Link>

            <Link href="/wards-beds" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconBed size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Inpatient Wards</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/patient-registration" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconUsers size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Master Patient Index</span>
            </Link>

            <Link href="/triage" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconStethoscope size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Triage & Vitals</span>
            </Link>

            <Link href="/emr-consultation" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconChecklist size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">EMR Consultation</span>
            </Link>

            <Link href="/laboratory" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconFlask size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Lab Worklist</span>
            </Link>

            <Link href="/pharmacy" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconPill size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">FEFO Pharmacy</span>
            </Link>

            <Link href="/nhis-claims" className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition text-center group shadow-sm">
              <div className="w-10 h-10 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <IconReceiptTax size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">NHIS Claims</span>
            </Link>
          </>
        )}
      </div>

      {/* Main Operational Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Hospital Tenants for Super Admin or Live Queue for Clinicians */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isSuperAdmin
                    ? 'Managed Hospital Branches & Tenants'
                    : isDoctor
                    ? 'Active OPD Consultation Waiting Queue'
                    : 'Live OPD Patient Flow Journey'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin
                    ? 'Registered healthcare facility branches under system governance'
                    : isDoctor
                    ? 'Patients currently queued for OPD doctor consultation'
                    : 'Real-time status tracking across hospital departments'}
                </p>
              </div>
              <Link
                href={isSuperAdmin ? '/hospitals-management' : '/emr-consultation'}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                {isSuperAdmin ? 'Add New Hospital →' : 'Open Consultation Directory →'}
              </Link>
            </div>

            <div className="overflow-x-auto">
              {isSuperAdmin ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Facility Code</th>
                      <th className="px-4 py-3">Hospital Name</th>
                      <th className="px-4 py-3">Region</th>
                      <th className="px-4 py-3">HeFRA License</th>
                      <th className="px-4 py-3">Bed Capacity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {facilities.map((fac) => (
                      <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">{fac.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fac.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fac.region || 'Greater Accra'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{fac.hefraLicenseNo}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{fac.bedCapacity || 150} beds</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {fac.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Queue #</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">MRN</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      {isDoctor && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {queues.slice(0, 6).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">{item.queueNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.patientName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.mrn}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              item.patientCategory === 'NHIS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.patientCategory === 'Private Insurance'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.patientCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{item.department}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              item.status === 'Waiting'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : item.status === 'In Consultation'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        {isDoctor && (
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/emr-consultation/${item.patientId}`}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow inline-flex items-center gap-1"
                            >
                              <span>Consult</span>
                              <IconArrowRight size={12} />
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Bed Status Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ward Bed Occupancy Status</h2>
              <Link href="/wards-beds" className="text-xs font-semibold text-emerald-600 hover:underline">
                View Inpatient Beds →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className={`p-3 rounded-xl border text-center transition ${
                    bed.status === 'Occupied'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : bed.status === 'Available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="text-[10px] font-semibold block uppercase text-slate-500">{bed.wardName}</span>
                  <span className="text-sm font-bold block mt-1">{bed.bedNumber}</span>
                  <span
                    className={`text-[10px] font-extrabold mt-1 inline-block px-1.5 py-0.5 rounded ${
                      bed.status === 'Occupied'
                        ? 'bg-rose-200 text-rose-800'
                        : bed.status === 'Available'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}
                  >
                    {bed.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Stock & Regulatory Compliance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Facility Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <IconBuildingHospital size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">HeFRA Facility Status</h3>
                <span className="text-xs text-slate-500">Health Facilities Regulatory Agency</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">License No:</span>
                <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                  {facilities[0]?.hefraLicenseNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Expiry Date:</span>
                <span className="font-semibold text-xs text-emerald-600">{facilities[0]?.hefraExpiryDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">GPS Address:</span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{facilities[0]?.gpsAddress}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">Staff Professional Credentials</span>
              <div className="space-y-2">
                {staff.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-750">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{s.name}</span>
                      <span className="text-slate-400 text-[10px]">{s.licensingBody}: {s.licenseNumber}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formularies & Stock Availability */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Hospital Formulary Stock</h3>
              <span className="text-xs text-slate-400 font-semibold">Available Medicines</span>
            </div>
            <div className="space-y-2">
              {pharmacyBatches.slice(0, 5).map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{b.genericName} ({b.brandName})</span>
                    <span className="text-slate-500 text-[10px]">Batch: {b.batchNumber} | Exp: {b.expiryDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{b.quantityInStock} left</span>
                    {b.quantityInStock <= b.reorderLevel && (
                      <span className="text-[10px] font-bold text-rose-600">Low Stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
