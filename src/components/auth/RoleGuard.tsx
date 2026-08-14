'use client';

import React, { useEffect } from 'react';
import { useHMS } from '@/context/HMSContext';
import { UserRole, Permission, ROLE_DEFINITIONS } from '@/lib/types/rbac';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  children: React.ReactNode;
  routePath?: string;
  requiredPermission?: Permission;
  allowedRoles?: UserRole[];
}

export default function RoleGuard({
  children,
  routePath,
  requiredPermission,
  allowedRoles
}: RoleGuardProps) {
  const { currentRole, canAccessRoute, hasPermission, isAuthenticated, sessionLoading } = useHMS();
  const router = useRouter();

  // This guard is a usability layer, not the security boundary — `middleware.ts`
  // rejects the request and every API route re-checks the session before doing
  // any work. It exists so a staff member sees an explanation instead of a
  // blank screen.
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [sessionLoading, isAuthenticated, router]);

  // Nothing is decided until the server has confirmed who is signed in.
  if (sessionLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Icon icon="solar:shield-check-bold-duotone" className="text-primary animate-pulse" width="48" />
          <p className="text-xs text-slate-500">Verifying your hospital session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Icon icon="solar:lock-password-bold-duotone" className="text-primary animate-pulse" width="48" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Authentication Required</h3>
          <p className="text-xs text-slate-500">Redirecting to Hospital Login Portal...</p>
        </div>
      </div>
    );
  }

  let isAllowed = true;
  let errorReason = '';

  if (routePath) {
    isAllowed = canAccessRoute(routePath);
    if (!isAllowed) {
      errorReason = `Your active role (${currentRole}) does not have permission to access the route "${routePath}".`;
    }
  } else if (requiredPermission) {
    isAllowed = hasPermission(requiredPermission);
    if (!isAllowed) {
      errorReason = `Your active role (${currentRole}) lacks the required permission: ${requiredPermission}.`;
    }
  } else if (allowedRoles && allowedRoles.length > 0) {
    isAllowed = allowedRoles.includes(currentRole);
    if (!isAllowed) {
      errorReason = `Access to this module is restricted to: ${allowedRoles.join(', ')}.`;
    }
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  const roleDef = ROLE_DEFINITIONS[currentRole];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900 shadow-inner">
          <Icon icon="solar:shield-warning-bold-duotone" width="36" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs uppercase tracking-widest font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            Access Denied &bull; 403 Forbidden
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Module Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{errorReason}</p>
        </div>

        {/* Role Information */}
        {roleDef && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Role</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {roleDef.name} ({roleDef.category})
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">{roleDef.description}</p>
            {roleDef.cannot.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                <strong>Enforced Constraint:</strong> {roleDef.cannot.join(' ')}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Icon icon="solar:home-angle-bold-duotone" width="16" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
