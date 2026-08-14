'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconUserPlus,
  IconBed,
  IconClock,
  IconHeartbeat,
  IconCheck
} from '@tabler/icons-react';

export default function EmergencyPage() {
  return (
    <RoleGuard routePath="/emergency">
      <EmergencyContent />
    </RoleGuard>
  );
}

function EmergencyContent() {
  const { patients, registerPatient, beds, updateBedStatus, currentRole } = useHMS();
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const isDoctor = currentRole === 'Doctor';

  const handleRegisterUnknown = () => {
    const unknownNo = Math.floor(1000 + Math.random() * 9000);
    registerPatient({
      fullName: `UNKNOWN EMERGENCY PATIENT #${unknownNo}`,
      dob: '2000-01-01',
      gender: 'Male',
      phone: '+233 00 000 0000',
      ghanaCardNo: 'UNIDENTIFIED-EMERGENCY',
      patientCategory: 'Exempted',
      gpsAddress: 'GA-EMERGENCY',
      residentialAddress: 'Brought by Ambulance',
      emergencyContact: {
        name: 'Unidentified Good Samaritan / Ambulance',
        relationship: 'Bystander',
        phone: '112'
      },
      allergies: [],
      chronicConditions: [],
      bloodGroup: 'Unknown',
      consentSigned: true
    });

    setShowUnknownModal(false);
    alert('Fast-Track Emergency Patient registered! Immediate resuscitation unlocked per non-blocking emergency care policy.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-900 to-rose-700 p-6 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-500/30 text-rose-200 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-400/30">
              Non-Blocking Care Policy Active
            </span>
            {isDoctor && (
              <span className="bg-amber-400 text-rose-950 text-xs px-2.5 py-1 rounded-full font-extrabold">
                Doctor Read-Only Directory View
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <IconAlertOctagon size={28} /> Emergency Department (ED) Resuscitation
          </h1>
          <p className="text-rose-100 text-xs mt-1">
            Immediate treatment for critical patients without delays for registration or payment.
          </p>
        </div>

        {!isDoctor && (
          <button
            onClick={handleRegisterUnknown}
            className="bg-white text-rose-950 font-extrabold px-4 py-2.5 rounded-xl shadow hover:bg-rose-50 transition text-sm flex items-center gap-2"
          >
            <IconUserPlus size={18} /> + Register Unidentified / Unknown Patient
          </button>
        )}
      </div>

      {/* Emergency Non-blocking Rule Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
        <IconAlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-sm block">Ghana Health Service Policy Mandate:</span>
          Emergency care must proceed immediately. Clinical treatment, resuscitation, and observation bed allocation are prioritized before billing or NHIS verification.
        </div>
      </div>

      {/* Emergency Bays & Resuscitation Beds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beds
          .filter((b) => b.type === 'General' || b.type === 'ICU' || b.type === 'Isolation')
          .map((bed) => (
            <div
              key={bed.id}
              className={`p-6 rounded-2xl border space-y-4 shadow-sm transition ${
                bed.status === 'Occupied'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase">{bed.wardName}</span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    bed.status === 'Occupied'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {bed.status}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{bed.bedNumber}</h3>
                <span className="text-xs text-slate-500 block">Category: {bed.type} Bed</span>
              </div>

              {bed.currentPatientName ? (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border space-y-1 text-xs">
                  <span className="text-slate-400 block text-[10px]">CURRENT OCCUPANT</span>
                  <span className="font-bold text-slate-900 dark:text-white block">{bed.currentPatientName}</span>
                  <span className="font-mono text-slate-500 text-[10px]">MRN: {bed.currentMrn}</span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-400">
                  Ready for Emergency Intake
                </div>
              )}

              {!isDoctor && (
                <div className="pt-2 flex gap-2">
                  {bed.status === 'Available' ? (
                    <button
                      onClick={() =>
                        updateBedStatus(
                          bed.id,
                          'Occupied',
                          patients[0]?.id,
                          patients[0]?.fullName,
                          patients[0]?.mrn
                        )
                      }
                      className="w-full py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-500"
                    >
                      Assign Emergency Patient
                    </button>
                  ) : (
                    <button
                      onClick={() => updateBedStatus(bed.id, 'Available')}
                      className="w-full py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-300"
                    >
                      Discharge / Transfer Bed
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
