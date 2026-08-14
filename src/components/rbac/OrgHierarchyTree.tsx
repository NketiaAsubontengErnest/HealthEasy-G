'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import { UserRole, ROLE_DEFINITIONS } from '@/lib/types/rbac';
import { Icon } from '@iconify/react';

export default function OrgHierarchyTree() {
  const { currentRole } = useHMS();

  // Selecting a node inspects that role's definition. It no longer reassigns
  // the session's own role — access is decided by the signed session cookie on
  // the server, so a click here could never have granted anything anyway.
  const [inspectedRole, setInspectedRole] = useState<UserRole>(currentRole);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Super Admin': true,
    'Hospital Director': true,
    'Hospital Admin': true
  });

  const toggleNode = (role: string) => {
    setExpandedNodes((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const levelBadges: Record<number, { bg: string; label: string }> = {
    1: { bg: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300', label: 'L1 Root Admin' },
    2: { bg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300', label: 'L2 Executive / Audit' },
    3: { bg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300', label: 'L3 Admin & Clinical Lead' },
    4: { bg: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300', label: 'L4 Staff Specialist' }
  };

  const activeRoleDef = ROLE_DEFINITIONS[inspectedRole];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            System Architecture & Supervisory Tree
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Icon icon="solar:structure-bold-duotone" className="text-primary" width="24" />
            HMS Organizational Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical reporting tree, supervisory bounds, and permission inheritance for all 20 roles.
          </p>
        </div>

        {/* Selected Role Summary Chip */}
        {activeRoleDef && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left max-w-xs w-full">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {inspectedRole}
                {inspectedRole === currentRole && (
                  <span className="ml-1.5 text-[10px] font-semibold text-primary">(your role)</span>
                )}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${levelBadges[activeRoleDef.level].bg}`}>
                Level {activeRoleDef.level}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">Reports to: <strong>{activeRoleDef.reportsTo}</strong></p>
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="space-y-4">
        {/* LEVEL 1: Super Admin */}
        <div className="space-y-3">
          <TreeNodeCard
            role="Super Admin"
            isExpanded={expandedNodes['Super Admin']}
            onToggle={() => toggleNode('Super Admin')}
            isSelected={inspectedRole === 'Super Admin'}
            onSelect={() => setInspectedRole('Super Admin')}
          />

          {/* LEVEL 2 BRANCHES */}
          {expandedNodes['Super Admin'] && (
            <div className="pl-6 sm:pl-10 border-l-2 border-slate-200 dark:border-slate-800 space-y-4 relative ml-3">
              {/* Branch 2A: System Auditor */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-10 top-5 w-6 sm:w-10 h-0.5 bg-slate-200 dark:bg-slate-800" />
                <TreeNodeCard
                  role="System Auditor"
                  isExpanded={false}
                  onToggle={() => {}}
                  isSelected={inspectedRole === 'System Auditor'}
                  onSelect={() => setInspectedRole('System Auditor')}
                  badgeText="Direct Audit Oversight"
                />
              </div>

              {/* Branch 2B: Hospital Director */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-10 top-5 w-6 sm:w-10 h-0.5 bg-slate-200 dark:bg-slate-800" />
                <TreeNodeCard
                  role="Hospital Director"
                  isExpanded={expandedNodes['Hospital Director']}
                  onToggle={() => toggleNode('Hospital Director')}
                  isSelected={inspectedRole === 'Hospital Director'}
                  onSelect={() => setInspectedRole('Hospital Director')}
                  badgeText="Executive Hospital Leadership"
                />

                {/* LEVEL 3 BRANCHES UNDER HOSPITAL DIRECTOR */}
                {expandedNodes['Hospital Director'] && (
                  <div className="pl-6 sm:pl-10 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-4 mt-4 relative ml-3">
                    {/* Level 3 Branch: Hospital Admin */}
                    <div className="relative">
                      <div className="absolute -left-6 sm:-left-10 top-5 w-6 sm:w-10 h-0.5 bg-indigo-200 dark:bg-indigo-900/60" />
                      <TreeNodeCard
                        role="Hospital Admin"
                        isExpanded={expandedNodes['Hospital Admin']}
                        onToggle={() => toggleNode('Hospital Admin')}
                        isSelected={inspectedRole === 'Hospital Admin'}
                        onSelect={() => setInspectedRole('Hospital Admin')}
                        badgeText="Operations & Admin Management"
                      />

                      {/* LEVEL 4 SUBORDINATES UNDER HOSPITAL ADMIN */}
                      {expandedNodes['Hospital Admin'] && (
                        <div className="pl-6 sm:pl-10 border-l-2 border-teal-200 dark:border-teal-900/60 space-y-2 mt-3 relative ml-3">
                          {[
                            'HR Officer',
                            'Finance Officer',
                            'Claims Officer',
                            'Procurement Officer',
                            'Store Keeper'
                          ].map((roleName) => (
                            <div key={roleName} className="relative">
                              <div className="absolute -left-6 sm:-left-10 top-4 w-6 sm:w-10 h-0.5 bg-teal-200 dark:bg-teal-900/60" />
                              <TreeNodeCard
                                role={roleName as UserRole}
                                isExpanded={false}
                                onToggle={() => {}}
                                isSelected={inspectedRole === roleName}
                                onSelect={() => setInspectedRole(roleName as UserRole)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Level 3/4 Clinical & Operational Specialists under Hospital Director */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                        Clinical & Technical Services (Direct Oversight by Hospital Director)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
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
                        ].map((roleName) => (
                          <TreeNodeCard
                            key={roleName}
                            role={roleName as UserRole}
                            isExpanded={false}
                            onToggle={() => {}}
                            isSelected={inspectedRole === roleName}
                            onSelect={() => setInspectedRole(roleName as UserRole)}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TreeNodeCardProps {
  role: UserRole;
  isExpanded: boolean;
  onToggle: () => void;
  isSelected: boolean;
  onSelect: () => void;
  badgeText?: string;
  compact?: boolean;
}

function TreeNodeCard({
  role,
  isExpanded,
  onToggle,
  isSelected,
  onSelect,
  badgeText,
  compact = false
}: TreeNodeCardProps) {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return null;

  const hasSubordinates = def.subordinateRoles.length > 0;

  const categoryIcons: Record<string, string> = {
    Administration: 'solar:shield-user-bold-duotone',
    Clinical: 'solar:stethoscope-bold-duotone',
    Diagnostics: 'solar:test-tube-bold-duotone',
    Pharmacy: 'solar:medical-kit-bold-duotone',
    Finance: 'solar:bill-list-bold-duotone',
    Operations: 'solar:box-minimalistic-bold-duotone'
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl border transition-all ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/20'
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {hasSubordinates && !compact && (
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            >
              <Icon
                icon={isExpanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
                width="18"
              />
            </button>
          )}

          <div
            onClick={onSelect}
            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isSelected ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
            }`}>
              <Icon icon={categoryIcons[def.category] || 'solar:user-bold'} width="20" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-xs sm:text-sm truncate ${
                  isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'
                }`}>
                  {def.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  L{def.level}
                </span>
                {badgeText && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                    {badgeText}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Reports to: {def.reportsTo}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onSelect}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isSelected
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {isSelected ? 'Active Role' : 'Switch Role'}
        </button>
      </div>
    </div>
  );
}
