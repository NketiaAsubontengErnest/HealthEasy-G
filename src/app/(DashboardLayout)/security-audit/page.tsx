'use client';

import React, { useState } from 'react';
import { useHMS } from '@/context/HMSContext';
import RoleGuard from '@/components/auth/RoleGuard';
import OrgHierarchyTree from '@/components/rbac/OrgHierarchyTree';
import {
  IconShieldCheck,
  IconLock,
  IconHistory,
  IconFileCertificate,
  IconAlertTriangle,
  IconSitemap
} from '@tabler/icons-react';

export default function SecurityAuditPage() {
  return (
    <RoleGuard routePath="/security-audit">
      <SecurityAuditContent />
    </RoleGuard>
  );
}

function SecurityAuditContent() {
  const { auditLogs } = useHMS();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'audit'>('hierarchy');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.mrn && log.mrn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Module 15: Security, Audit & Data Protection (Act 843)
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Security, Role Hierarchy & Privacy Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organizational hierarchy tree, supervisory bounds, immutable audit trail, and Ghana Data Protection Commission (DPC) compliance audit.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <IconSitemap size={16} /> Role Hierarchy Tree
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <IconHistory size={16} /> Audit Trail Logs
          </button>
        </div>
      </div>

      {/* DPC Compliance Card */}
      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-950 text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm flex items-center gap-2">
            <IconShieldCheck className="text-emerald-600" size={20} /> Ghana Data Protection Commission (DPC) Compliance:
          </span>
          <span className="bg-emerald-200 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
            Act 843 Certified
          </span>
        </div>
        <p>
          All electronic patient records stored within HealthEasy-G comply with the Data Protection Act (Act 843). Access to sensitive health data is restricted by role-scoped permissions, and all modifications produce immutable audit trail entries with recorded justification.
        </p>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'hierarchy' ? (
        <OrgHierarchyTree />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <IconHistory className="text-slate-600" size={22} /> Immutable System Audit Trail Log
            </h3>
            <input
              type="text"
              placeholder="Search audit trail by user, action, or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 text-xs border rounded-xl w-64 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User Name & Role</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Target Patient / MRN</th>
                  <th className="px-4 py-3">Audit Details & Justification</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {log.mrn || 'System Wide'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{log.details}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
