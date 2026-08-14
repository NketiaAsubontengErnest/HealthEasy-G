'use client';

import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo';
import CardBox from '../shared/CardBox';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Register = () => {
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full">
        <CardBox>
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h2 className="text-xl font-extrabold text-center text-slate-900 dark:text-white">
            Staff Account Registration
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            Register new hospital staff credential into HealthEasy-G
          </p>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name1" className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Full Name
              </Label>
              <Input id="name1" type="text" placeholder="Dr. Kwame Mensah" required className="mt-1 text-xs" />
            </div>
            <div>
              <Label htmlFor="email1" className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Official Staff Email
              </Label>
              <Input id="email1" type="email" placeholder="staff@ridgehms.gh" required className="mt-1 text-xs" />
            </div>
            <div>
              <Label htmlFor="password1" className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <Input id="password1" type="password" placeholder="Create password" required className="mt-1 text-xs" />
            </div>
            <Button className="w-full bg-primary font-bold text-xs py-2.5">
              Submit Staff Registration
            </Button>
            <div className="flex items-center gap-2 justify-center mt-6 flex-wrap text-xs">
              <span className="text-slate-500">Already have a staff account?</span>
              <Link href="/auth/login" className="font-bold text-primary hover:underline">
                Sign In to Portal
              </Link>
            </div>
          </form>
        </CardBox>
      </div>
    </div>
  );
};
