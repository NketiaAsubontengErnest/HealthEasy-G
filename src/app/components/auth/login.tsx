'use client';

import React, { useState } from 'react';
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo';
import CardBox from '../shared/CardBox';
import { useRouter } from 'next/navigation';
import { useHMS } from '@/context/HMSContext';
import { UserRole } from '@/lib/types/rbac';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';

export const Login = () => {
  const router = useRouter();
  const { setCurrentRole, loginUser, staff } = useHMS();

  const [email, setEmail] = useState('admin@ridgehms.gh');
  const [password, setPassword] = useState('Password123!');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testAccounts = [
    { role: 'Super Admin' as UserRole, email: 'admin@ridgehms.gh' },
    { role: 'Hospital Director' as UserRole, email: 'director@ridgehms.gh' },
    { role: 'Hospital Admin' as UserRole, email: 'admin.ops@ridgehms.gh' },
    { role: 'OPD / Medical Records' as UserRole, email: 'reception@ridgehms.gh' },
    { role: 'Doctor' as UserRole, email: 'kwame.mensah@ridgehms.gh' },
    { role: 'Nurse' as UserRole, email: 'abena.osei@ridgehms.gh' },
    { role: 'Pharmacist' as UserRole, email: 'kojo.appiah@ridgehms.gh' },
    { role: 'Laboratory Technician' as UserRole, email: 'ebenezer.b@ridgehms.gh' },
    { role: 'Cashier' as UserRole, email: 'cashier@ridgehms.gh' },
    { role: 'HR Officer' as UserRole, email: 'hr@ridgehms.gh' },
    { role: 'System Auditor' as UserRole, email: 'auditor@ridgehms.gh' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. Attempt API authentication via POST /api/auth/login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          loginUser(data.user);
          router.push('/dashboard');
          return;
        } else if (!res.ok && data.error) {
          setErrorMsg(data.error);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback client-side staff matching if API endpoint returns non-JSON or offline
      const matchedStaff = staff.find((s) => s.email?.toLowerCase() === email.toLowerCase().trim());
      if (matchedStaff || email.trim() === 'admin@ridgehms.gh' || email.includes('@ridgehms.gh')) {
        const fallbackRole = (matchedStaff?.role as UserRole) || 'Super Admin';
        loginUser({
          id: matchedStaff?.id || 'usr-local-001',
          name: matchedStaff?.name || 'Hospital Administrator',
          email: email.trim(),
          role: fallbackRole,
          staffId: matchedStaff?.staffId || 'SYS-0001',
          department: matchedStaff?.department || 'Administration'
        });
        router.push('/dashboard');
        return;
      }

      setErrorMsg('Invalid email address or password. Please verify credentials.');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Login process error:', err);
      // Client-side fallback authentication
      if (email.trim().length > 0 && password === 'Password123!') {
        loginUser({
          id: 'usr-fallback',
          name: 'Authenticated Staff',
          email: email.trim(),
          role: 'Super Admin',
          staffId: 'SYS-0001',
          department: 'Executive IT'
        });
        router.push('/dashboard');
        return;
      }
      setErrorMsg('Authentication error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full">
        <CardBox>
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h2 className="text-xl font-extrabold text-center text-slate-900 dark:text-white">
            HealthEasy-G HMS Login
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            Authenticate staff credentials & active role permissions
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Icon icon="solar:danger-triangle-bold" width="18" className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Staff Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@ridgehms.gh"
                required
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="font-normal text-slate-600 dark:text-slate-400">
                  Remember device
                </Label>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">Default Password: Password123!</span>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-primary font-bold text-xs py-2.5">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Icon icon="solar:loading-bold" className="animate-spin" width="16" /> Authenticating...
                </span>
              ) : (
                'Sign In to Hospital Portal'
              )}
            </Button>
          </form>

          {/* Quick Fill Demo Roles */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2 text-center">
              Quick Test Credentials (Click to Autofill & Sign In)
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {testAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password123!');
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200 dark:border-slate-700"
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </CardBox>
      </div>
    </div>
  );
};
