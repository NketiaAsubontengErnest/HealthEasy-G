'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useHMS } from '@/context/HMSContext';

const Profile = () => {
  const { currentUser, currentRole, logout } = useHMS();

  return (
    <div className="relative group/menu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
            <Image
              src="/images/profile/user-1.jpg"
              alt="Profile"
              height={35}
              width={35}
              className="rounded-full"
            />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl p-3 border border-slate-200 dark:border-slate-800">
          <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
            <span className="font-bold text-xs text-slate-900 dark:text-white block">
              {currentUser?.name || 'Authenticated Staff'}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {currentUser?.email || 'staff@ridgehms.gh'}
            </span>
            <span className="inline-block mt-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
              {currentRole}
            </span>
          </div>

          <DropdownMenuItem asChild>
            <Link
              href="/user-profile"
              className="px-3 py-2 flex items-center w-full gap-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-lightprimary hover:text-primary rounded-xl"
            >
              <Icon icon="solar:user-circle-outline" height={18} />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/security-audit"
              className="px-3 py-2 flex items-center w-full gap-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-lightprimary hover:text-primary rounded-xl"
            >
              <Icon icon="solar:shield-check-bold-duotone" height={18} />
              Role & Audit Info
            </Link>
          </DropdownMenuItem>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={logout}
              className="w-full text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2"
            >
              <Icon icon="solar:logout-3-bold-duotone" width="16" />
              Sign Out / Logout
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Profile;
