'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHMS } from '@/context/HMSContext';
import { PatientRecord, PatientCategory } from '@/lib/types/hms';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconSearch,
  IconUserPlus,
  IconId,
  IconBarcode,
  IconGitMerge,
  IconCircleCheck,
  IconX,
  IconPrinter
} from '@tabler/icons-react';

export default function PatientRegistrationPage() {
  return (
    <RoleGuard routePath="/patient-registration">
      <PatientRegistrationContent />
    </RoleGuard>
  );
}

function PatientRegistrationContent() {
  const { patients, registerPatient } = useHMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState<PatientRecord | null>(null);
  const [mergePatientModal, setMergePatientModal] = useState<PatientRecord | null>(null);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [ghanaCardNo, setGhanaCardNo] = useState('');
  const [nhisNumber, setNhisNumber] = useState('');
  const [nhisStatus, setNhisStatus] = useState<'Active' | 'Expired'>('Active');
  const [patientCategory, setPatientCategory] = useState<PatientCategory>('NHIS');
  const [gpsAddress, setGpsAddress] = useState('GA-');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [consentSigned, setConsentSigned] = useState(true);

  // Duplicate warning detector
  const duplicateMatch = patients.find(
    (p) =>
      (ghanaCardNo.length > 5 && p.ghanaCardNo.toLowerCase() === ghanaCardNo.toLowerCase()) ||
      (nhisNumber.length > 5 && p.nhisNumber === nhisNumber)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dob || !phone) return;

    registerPatient({
      fullName,
      dob,
      gender,
      phone,
      ghanaCardNo,
      nhisNumber: nhisNumber || undefined,
      nhisStatus: nhisNumber ? nhisStatus : undefined,
      patientCategory,
      gpsAddress,
      residentialAddress,
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRel,
        phone: emergencyPhone
      },
      allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
      chronicConditions: chronicConditions ? chronicConditions.split(',').map((s) => s.trim()) : [],
      bloodGroup,
      consentSigned
    });

    // Reset Form
    setFullName('');
    setDob('');
    setPhone('');
    setGhanaCardNo('');
    setNhisNumber('');
    setGpsAddress('GA-');
    setResidentialAddress('');
    setEmergencyName('');
    setEmergencyRel('');
    setEmergencyPhone('');
    setAllergies('');
    setChronicConditions('');
    setShowModal(false);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.ghanaCardNo.toLowerCase().includes(q) ||
      (p.nhisNumber && p.nhisNumber.includes(q)) ||
      p.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 2: Core Patient Directory
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Master Patient Index (MPI) & Registration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain one unique Medical Record Number (MRN) per patient identity across all hospital visits.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow transition text-sm flex items-center gap-2"
        >
          <IconUserPlus size={18} /> + Register New Patient
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <IconSearch className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Name, MRN, Ghana Card, NHIS # or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Total Records: <strong className="text-slate-900 dark:text-white">{patients.length}</strong></span>
          <span>NHIS Verified: <strong className="text-emerald-600">{patients.filter((p) => p.patientCategory === 'NHIS').length}</strong></span>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">MRN</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Ghana Card ID</th>
                <th className="px-4 py-3">NHIS No.</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">GPS Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">{patient.mrn}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 dark:text-white block">{patient.fullName}</span>
                    <span className="text-slate-400 text-xs">{patient.gender}, DOB: {patient.dob}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {patient.ghanaCardNo || 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {patient.nhisNumber ? (
                      <span className="text-emerald-700 font-semibold">{patient.nhisNumber} ({patient.nhisStatus})</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {patient.patientCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{patient.gpsAddress}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">{patient.phone}</td>
                  <td className="px-4 py-3 space-x-2 flex items-center">
                    <Link
                      href={`/emr-consultation?patientId=${patient.id}`}
                      className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg shadow transition inline-flex items-center gap-1"
                    >
                      Clinical Folder & AI →
                    </Link>
                    <button
                      onClick={() => setShowCardModal(patient)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1"
                    >
                      <IconBarcode size={14} /> Card
                    </button>
                    <button
                      onClick={() => setMergePatientModal(patient)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1"
                    >
                      <IconGitMerge size={14} /> Merge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Patient Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-700 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconUserPlus className="text-emerald-600" size={22} />
                Register New Patient Identity (Master Patient Index)
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <IconX size={20} />
              </button>
            </div>

            {duplicateMatch && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs space-y-1">
                <span className="font-bold block text-sm">Potential Duplicate Patient Alert!</span>
                <p>
                  A patient named <strong>{duplicateMatch.fullName}</strong> ({duplicateMatch.mrn}) already exists with Ghana Card / NHIS ID matching your entry. Avoid creating duplicate records per GHS guidelines.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kofi Owusu Ansah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Ghana Card ID</label>
                  <input
                    type="text"
                    placeholder="GHA-721098412-4"
                    value={ghanaCardNo}
                    onChange={(e) => setGhanaCardNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">NHIS Membership No.</label>
                  <input
                    type="text"
                    placeholder="39482019"
                    value={nhisNumber}
                    onChange={(e) => setNhisNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Patient Category *</label>
                  <select
                    value={patientCategory}
                    onChange={(e) => setPatientCategory(e.target.value as PatientCategory)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="NHIS">NHIS</option>
                    <option value="Cash">Cash</option>
                    <option value="Private Insurance">Private Insurance</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Exempted">Exempted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">GhanaPost GPS Address</label>
                  <input
                    type="text"
                    placeholder="GA-029-3829"
                    value={gpsAddress}
                    onChange={(e) => setGpsAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+233 24 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Allergies (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Name & Phone"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentSigned}
                  onChange={(e) => setConsentSigned(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="consent" className="text-slate-600 dark:text-slate-300">
                  Data Protection Act (Act 843) Consent: Patient consents to electronic health data processing.
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                >
                  Save & Assign MRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Barcode Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Patient Identity Card</h3>
              <button onClick={() => setShowCardModal(null)} className="text-slate-400">
                <IconX size={18} />
              </button>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl space-y-4 border border-emerald-800 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">HealthEasy-G</span>
                  <span className="text-sm font-bold block">{showCardModal.fullName}</span>
                  <span className="text-xs text-slate-300 font-mono">MRN: {showCardModal.mrn}</span>
                </div>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded">
                  {showCardModal.patientCategory}
                </span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-300">
                <div>Ghana Card: {showCardModal.ghanaCardNo || 'N/A'}</div>
                <div>NHIS No: {showCardModal.nhisNumber || 'N/A'}</div>
                <div>GPS: {showCardModal.gpsAddress}</div>
              </div>

              <div className="bg-white p-3 rounded-lg text-center font-mono text-slate-900 font-bold tracking-widest text-sm shadow-inner">
                |||| ||| ||||||| ||| |||
                <span className="text-[10px] font-normal block tracking-normal text-slate-600 mt-1">{showCardModal.mrn}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => alert('Printing Patient Barcode Card...')}
                className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <IconPrinter size={16} /> Print Card Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Merging Modal */}
      {mergePatientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IconGitMerge className="text-slate-700" size={20} /> Duplicate Record Merging Workflow
            </h3>
            <p className="text-xs text-slate-500">
              Authorised Records Officers can merge secondary duplicate patient folders into the primary MRN: <strong>{mergePatientModal.mrn}</strong> ({mergePatientModal.fullName}).
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-2">
              <span className="font-semibold block">Select Secondary Duplicate MRN to merge:</span>
              <select className="w-full p-2 border rounded-lg font-mono">
                {patients
                  .filter((p) => p.id !== mergePatientModal.id)
                  .map((p) => (
                    <option key={p.id} value={p.mrn}>
                      {p.mrn} - {p.fullName} ({p.ghanaCardNo})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setMergePatientModal(null)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Successfully merged duplicate records under ${mergePatientModal.mrn}`);
                  setMergePatientModal(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg"
              >
                Execute Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
