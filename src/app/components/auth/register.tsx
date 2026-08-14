'use client';

import { useState } from 'react';
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo';
import CardBox from '../shared/CardBox';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Register = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage(''); setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/staff', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form))
    });
    const data = await response.json().catch(() => null);
    setIsSubmitting(false);
    if (!response.ok) return setError(data?.error || 'Unable to create staff account.');
    event.currentTarget.reset(); setMessage('Staff account created successfully.');
  }

  return <div className="min-h-screen w-full flex justify-center items-center bg-slate-50 dark:bg-slate-950 p-4"><div className="max-w-md w-full"><CardBox>
    <div className="flex justify-center mb-4"><FullLogo /></div>
    <h2 className="text-xl font-extrabold text-center text-slate-900 dark:text-white">Staff Account Registration</h2>
    <p className="text-xs text-slate-500 text-center mb-6">Restricted to authorised staff administrators.</p>
    <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" required className="mt-1" /></div>
      <div><Label htmlFor="email">Official Staff Email</Label><Input id="email" name="email" type="email" required className="mt-1" /></div>
      <div><Label htmlFor="staffId">Staff ID</Label><Input id="staffId" name="staffId" required className="mt-1" /></div>
      <div><Label htmlFor="department">Department</Label><Input id="department" name="department" required className="mt-1" /></div>
      <div><Label htmlFor="role">Role</Label><Input id="role" name="role" placeholder="e.g. Nurse" required className="mt-1" /></div>
      <div><Label htmlFor="password">Initial Password</Label><Input id="password" name="password" type="password" minLength={12} required className="mt-1" /></div>
      {error && <p className="text-xs text-rose-600">{error}</p>}{message && <p className="text-xs text-emerald-600">{message}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full bg-primary">{isSubmitting ? 'Creating…' : 'Create Staff Account'}</Button>
    </form>
    <div className="text-center mt-5 text-xs"><Link href="/dashboard" className="font-bold text-primary hover:underline">Return to dashboard</Link></div>
  </CardBox></div></div>;
};
