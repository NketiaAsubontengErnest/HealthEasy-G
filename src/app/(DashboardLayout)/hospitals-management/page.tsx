'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import { FacilityBranch } from '@/lib/types/hms';
import {
  IconBuildingHospital,
  IconPlus,
  IconSearch,
  IconCheck,
  IconBan,
  IconShieldCheck,
  IconMapPin,
  IconPhone,
  IconMail,
  IconBed,
  IconUser,
  IconClock,
  IconBuilding
} from '@tabler/icons-react';

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
] as const;

const FACILITY_TYPES = [
  'Teaching/Tertiary',
  'Regional',
  'District',
  'Polyclinic',
  'Private Specialist',
  'CHPS Compound',
] as const;

export default function MultiHospitalManagementPage() {
  return (
    <RoleGuard routePath="/hospitals-management">
      <MultiHospitalContent />
    </RoleGuard>
  );
}

function MultiHospitalContent() {
  const { facilities, activeFacilityId, setActiveFacilityId, addFacility, updateFacilityStatus } = useHMS();

  // Local UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Hospital Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hefraLicenseNo: '',
    hefraExpiryDate: '',
    hefraStatus: 'Active' as const,
    location: '',
    gpsAddress: '',
    phone: '',
    email: '',
    region: 'Greater Accra' as (typeof GHANA_REGIONS)[number],
    facilityType: 'Regional' as (typeof FACILITY_TYPES)[number],
    status: 'Active' as const,
    adminName: '',
    adminEmail: '',
    bedCapacity: 100,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Statistics
  const totalHospitals = facilities.length;
  const activeHospitals = facilities.filter((f) => f.status === 'Active').length;
  const totalBeds = facilities.reduce((sum, f) => sum + (f.bedCapacity || 0), 0);
  const uniqueRegions = new Set(facilities.map((f) => f.region)).size;
  const activeHefra = facilities.filter((f) => f.hefraStatus === 'Active').length;

  // Filtered List
  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.hefraLicenseNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = regionFilter === 'all' || fac.region === regionFilter;
    const matchesType = typeFilter === 'all' || fac.facilityType === typeFilter;
    const matchesStatus = statusFilter === 'all' || fac.status === statusFilter;

    return matchesSearch && matchesRegion && matchesType && matchesStatus;
  });

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Hospital Name and Facility Code are required.');
      return;
    }

    if (!formData.hefraLicenseNo.trim()) {
      setFormError('HeFRA License Number is required for legal compliance.');
      return;
    }

    try {
      const created = await addFacility({
        ...formData,
        bedCapacity: Number(formData.bedCapacity) || 50,
      });

      if (created) {
        setIsAddModalOpen(false);
        setSuccessBanner(`Successfully registered ${created.name} (${created.code}) in ${created.location}!`);
        setTimeout(() => setSuccessBanner(null), 5000);
      }

      // Reset form
      setFormData({
        name: '',
        code: '',
        hefraLicenseNo: '',
        hefraExpiryDate: '',
        hefraStatus: 'Active',
        location: '',
        gpsAddress: '',
        phone: '',
        email: '',
        region: 'Greater Accra',
        facilityType: 'Regional',
        status: 'Active',
        adminName: '',
        adminEmail: '',
        bedCapacity: 100,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create hospital.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <IconBuildingHospital width={32} height={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Super Admin Multi-Tenancy Portal
              </span>
              <span className="text-[11px] font-bold text-slate-400">HeFRA & GHS Aligned</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Multi-Hospital System Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, configure, and monitor health facilities across Ghana. Switch active hospital context or view cross-hospital metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 shrink-0 transition-all duration-200 active:scale-95"
        >
          <IconPlus width={18} height={18} />
          Add New Hospital
        </button>
      </div>

      {/* ── Success Alert Banner ── */}
      {successBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <IconCheck width={18} height={18} className="text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {/* ── Executive Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center font-bold">
            <IconBuilding width={24} height={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Hospitals</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalHospitals} <span className="text-xs font-semibold text-emerald-600">({activeHospitals} Active)</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 flex items-center justify-center font-bold">
            <IconMapPin width={24} height={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Regional Coverage</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {uniqueRegions} <span className="text-xs font-semibold text-slate-400">/ 16 Regions</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center font-bold">
            <IconBed width={24} height={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Bed Capacity</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalBeds.toLocaleString()} <span className="text-xs font-semibold text-slate-400">Beds</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center font-bold">
            <IconShieldCheck width={24} height={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">HeFRA Compliant</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeHefra} <span className="text-xs font-semibold text-emerald-600">Active Licenses</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input
            type="text"
            placeholder="Search hospital name, code, HeFRA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Facility Tiers</option>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Onboarding">Onboarding</option>
          </select>
        </div>
      </div>

      {/* ── Hospital Directory Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFacilities.map((fac) => {
          const isActiveSelected = activeFacilityId === fac.id;
          const isSuspended = fac.status === 'Suspended';

          return (
            <div
              key={fac.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden ${
                isActiveSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header Row */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        {fac.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {fac.facilityType}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      {fac.name}
                    </h3>
                  </div>

                  {/* Status badge */}
                  <button
                    type="button"
                    onClick={() =>
                      updateFacilityStatus(fac.id, fac.status === 'Active' ? 'Suspended' : 'Active')
                    }
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all ${
                      fac.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title="Click to toggle hospital status"
                  >
                    {fac.status === 'Active' ? '● Active' : '○ Suspended'}
                  </button>
                </div>

                {/* HeFRA Compliance Tag */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <IconShieldCheck width={15} height={15} className="text-emerald-600" />
                      HeFRA License
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{fac.hefraLicenseNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Expiry: {fac.hefraExpiryDate}</span>
                    <span className="font-extrabold text-emerald-600">{fac.hefraStatus}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <IconMapPin width={16} height={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">{fac.location} ({fac.region})</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">GPS: {fac.gpsAddress}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <IconPhone width={14} height={14} className="text-slate-400" />
                      <span className="truncate">{fac.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <IconMail width={14} height={14} className="text-slate-400" />
                      <span className="truncate">{fac.email}</span>
                    </div>
                  </div>

                  {fac.adminName && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[11px]">
                      <IconUser width={14} height={14} className="text-slate-400" />
                      <span>Admin: <strong className="text-slate-800 dark:text-slate-200">{fac.adminName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <IconBed width={16} height={16} className="text-violet-500" />
                  <span>{fac.bedCapacity || 0} Beds</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFacilityId(fac.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 ${
                    isActiveSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {isActiveSelected ? (
                    <>
                      <IconCheck width={16} height={16} /> Active Facility Context
                    </>
                  ) : (
                    'Set Active Hospital Context'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center space-y-3 border border-slate-100 dark:border-slate-700">
          <IconBuildingHospital width={48} height={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Hospitals Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No health facilities match your search or filter parameters. Try adjusting filters or click "Add New Hospital" to register one.
          </p>
        </div>
      )}

      {/* ── Add New Hospital Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded text-white">
                  Ghana Health Service / HeFRA
                </span>
                <h2 className="text-xl font-black mt-1">Register New Health Facility</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateHospital} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <IconBan width={16} height={16} />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hospital Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hospital / Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HealthEasy-G Cape Coast Teaching Hospital"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Facility Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Facility Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CR-CCTH-04"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghana Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value as (typeof GHANA_REGIONS)[number] })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Facility Tier */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Facility Tier / Category</label>
                  <select
                    value={formData.facilityType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facilityType: e.target.value as (typeof FACILITY_TYPES)[number],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {FACILITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bed Capacity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Bed Capacity</label>
                  <input
                    type="number"
                    min={5}
                    max={2000}
                    value={formData.bedCapacity}
                    onChange={(e) => setFormData({ ...formData, bedCapacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* HeFRA License No */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    HeFRA License Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HEFRA-CR-2026-0922"
                    value={formData.hefraLicenseNo}
                    onChange={(e) => setFormData({ ...formData, hefraLicenseNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* HeFRA Expiry Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">HeFRA Expiry Date</label>
                  <input
                    type="date"
                    value={formData.hefraExpiryDate || '2027-12-31'}
                    onChange={(e) => setFormData({ ...formData, hefraExpiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Physical Address / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Interburton Road, Cape Coast"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* GPS Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghana Post Digital Address</label>
                  <input
                    type="text"
                    placeholder="e.g. CC-012-4491"
                    value={formData.gpsAddress}
                    onChange={(e) => setFormData({ ...formData, gpsAddress: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 33 213 2400"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Admin Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Hospital Director / Admin</label>
                  <input
                    type="text"
                    placeholder="Dr. Samuel Annan"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Admin Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Email</label>
                  <input
                    type="email"
                    placeholder="info@ccth.gh"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value, adminEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2"
                >
                  <IconBuildingHospital width={18} height={18} />
                  Register Hospital Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
