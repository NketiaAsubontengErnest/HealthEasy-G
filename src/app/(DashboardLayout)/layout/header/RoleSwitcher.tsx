'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { UserRole, ROLE_DEFINITIONS } from '@/lib/types/rbac';
import { Icon } from '@iconify/react';

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole, staff } = useHMS();
  const [isOpen, setIsOpen] = useState(false);

  const activeDef = ROLE_DEFINITIONS[currentRole];
  // Allow role switching ONLY if logged in as Super Admin or in guest preview mode
  const canSwitchRole = currentRole === 'Super Admin' || !staff;

  const hierarchyGroups = [
    {
      title: 'Level 1 — System Root',
      roles: ['Super Admin'] as UserRole[]
    },
    {
      title: 'Level 2 — Executive & Audit Oversight',
      roles: ['System Auditor', 'Hospital Director'] as UserRole[]
    },
    {
      title: 'Level 3 — Hospital Operations Management',
      roles: ['Hospital Admin'] as UserRole[]
    },
    {
      title: 'Level 4 — Administrative & Finance Officers (Under Hospital Admin)',
      roles: [
        'HR Officer',
        'Finance Officer',
        'Claims Officer',
        'Procurement Officer',
        'Store Keeper'
      ] as UserRole[]
    },
    {
      title: 'Level 3/4 — Clinical & Technical Specialists (Under Hospital Director)',
      roles: [
        'OPD / Medical Records',
        'Cashier',
        'Nurse',
        'Ward Manager',
        'Doctor',
        'Laboratory Technician',
        'Radiographer',
        'Radiologist',
        'Pharmacist',
        'Theatre Nurse'
      ] as UserRole[]
    }
  ];

  // Static badge for non-Super Admin logged-in users (no role switching allowed)
  if (!canSwitchRole) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-100">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
          <Icon icon="solar:user-speak-bold-duotone" width="14" />
        </span>
        <div className="text-left hidden sm:block">
          <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-none">Role</span>
          <span className="font-semibold text-slate-900 dark:text-white leading-tight">{currentRole}</span>
        </div>
        <span className="text-xs font-semibold text-slate-900 dark:text-white sm:hidden">{currentRole}</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      {/* Role Switcher Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
          <Icon icon="solar:user-speak-bold-duotone" width="14" />
        </span>
        <div className="text-left hidden sm:block">
          <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-none">Active Role</span>
          <span className="font-semibold text-slate-900 dark:text-white leading-tight">{currentRole}</span>
        </div>
        <span className="text-xs font-semibold text-primary sm:hidden">{currentRole}</span>
        <Icon icon="solar:alt-arrow-down-linear" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} width="14" />
      </button>

      {/* Modal / Dropdown Overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon icon="solar:structure-bold-duotone" className="text-primary" width="18" />
                  HMS Role Hierarchy Switcher
                </h3>
                <p className="text-[11px] text-slate-500">Structured by Standardized Reporting Tree</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <Icon icon="solar:close-circle-bold" width="18" />
              </button>
            </div>

            {/* Active Role Summary Card */}
            {activeDef && (
              <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeDef.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                    Level {activeDef.level}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1">Reports to: <strong>{activeDef.reportsTo}</strong></p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2">{activeDef.description}</p>
                {activeDef.cannot.length > 0 && (
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-900">
                    <strong>Enforced Constraint:</strong> {activeDef.cannot.join(' ')}
                  </div>
                )}
              </div>
            )}

            {/* Grouped Hierarchical Tree List */}
            <div className="space-y-4">
              {hierarchyGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 px-1 border-b border-slate-100 dark:border-slate-800/60 pb-1">
                    {group.title}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.roles.map((role) => {
                      const isSelected = currentRole === role;
                      const roleDef = ROLE_DEFINITIONS[role];
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            setCurrentRole(role);
                            setIsOpen(false);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/40 text-primary font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              icon={isSelected ? 'solar:check-circle-bold' : 'solar:user-circle-linear'}
                              className={isSelected ? 'text-primary' : 'text-slate-400'}
                              width="16"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-medium block truncate">{role}</span>
                              {roleDef && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {roleDef.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            L{roleDef?.level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
