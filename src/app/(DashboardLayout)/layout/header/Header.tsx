'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Icon } from '@iconify/react';
import Profile from './Profile';
import Notifications from './Notifications';
import SidebarLayout from '../sidebar/Sidebar';
import FullLogo from '../shared/logo/FullLogo';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useHMS } from '@/context/HMSContext';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { currentUser, currentRole } = useHMS();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMode = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <>
      <header
        className={`sticky top-0 z-2 ${
          isSticky ? 'bg-background shadow-md fixed w-full' : 'bg-transparent'
        }`}
      >
        <nav className="rounded-none py-4 sm:ps-6 max-w-full! sm:pe-10 dark:bg-dark flex justify-between items-center px-6">
          {/* Mobile Toggle Icon */}
          <div
            onClick={() => {
              setIsOpen(true);
            }}
            className="px-3.5 hover:text-primary dark:hover:text-primary text-link dark:text-darklink relative after:absolute after:w-10 after:h-10 after:rounded-full hover:after:bg-lightprimary after:bg-transparent rounded-full xl:hidden flex justify-center items-center cursor-pointer"
          >
            <Icon icon="tabler:menu-2" height={20} width={20} />
          </div>

          <div className="block xl:hidden">
            <FullLogo />
          </div>

          <div className="flex xl:hidden items-center">
            <div
              className="hover:text-primary px-2 md:px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative"
              onClick={toggleMode}
            >
              <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary">
                {theme === 'light' ? (
                  <Icon icon="tabler:moon" width="20" />
                ) : (
                  <Icon icon="solar:sun-bold-duotone" width="20" className="group-hover:text-primary" />
                )}
              </span>
            </div>

            <div className="xl:block">
              <div className="flex gap-0 items-center relative">
                <Notifications />
              </div>
            </div>

            {/* Profile Dropdown */}
            <Profile />
          </div>

          <div className="hidden xl:flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-linear"
                  width={18}
                  height={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input type="text" placeholder="Search HMS modules & records..." className="rounded-xl pl-10" />
              </div>

              {/* Hospital Switcher */}
              <HospitalSelector />
            </div>

            <div className="flex w-full justify-end items-center gap-3">
              {/* Authenticated Staff Badge (Role Switcher Removed) */}
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                    {currentUser?.name || 'Authenticated Staff'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-primary/20">
                      {currentRole}
                    </span>
                    {currentUser?.department && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        &bull; {currentUser.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-0 items-center">
                {/* Dark/Light Toggle */}
                <div
                  className="hover:text-primary px-3 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative"
                  onClick={toggleMode}
                >
                  <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary">
                    {theme === 'light' ? (
                      <Icon icon="tabler:moon" width="20" />
                    ) : (
                      <Icon icon="solar:sun-bold-duotone" width="20" className="group-hover:text-primary" />
                    )}
                  </span>
                </div>

                <div className="xl:block">
                  <div className="flex gap-0 items-center relative">
                    <Notifications />
                  </div>
                </div>

                {/* Profile Dropdown */}
                <Profile />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

function HospitalSelector() {
  const { facilities, activeFacilityId, setActiveFacilityId, currentRole } = useHMS();
  const activeFac = facilities.find((f) => f.id === activeFacilityId) || facilities[0];

  const isMultiFacilityAdmin = currentRole === 'Super Admin';

  if (!isMultiFacilityAdmin) {
    // For single-hospital staff (Doctor, Nurse, Pharmacist, Lab Tech, etc.) render a clean static hospital badge
    return (
      <div className="relative flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xs">
        <Icon icon="solar:hospital-bold-duotone" className="text-indigo-600 dark:text-indigo-400 shrink-0" width={18} />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
            Hospital Facility
          </span>
          <span className="font-bold text-xs text-slate-900 dark:text-white max-w-[200px] truncate" title={activeFac?.name}>
            {activeFac?.name || 'HealthEasy-G Ridge Regional Hospital'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 shadow-xs">
      <Icon icon="solar:hospital-bold-duotone" className="text-emerald-600 dark:text-emerald-400 shrink-0" width={20} />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400">
          Active Facility
        </span>
        <select
          value={activeFacilityId}
          onChange={(e) => setActiveFacilityId(e.target.value)}
          className="bg-transparent font-bold text-xs text-slate-900 dark:text-white border-none p-0 cursor-pointer focus:ring-0 focus:outline-none max-w-[200px] truncate"
        >
          <option value="all" className="dark:bg-slate-800 text-slate-900 dark:text-white font-semibold">
            🌐 All Hospitals (Global View)
          </option>
          {facilities.map((fac) => (
            <option key={fac.id} value={fac.id} className="dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
              🏥 {fac.name} ({fac.region})
            </option>
          ))}
        </select>
      </div>
      {activeFacilityId !== 'all' && activeFac && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0 ml-1">
          {activeFac.facilityType}
        </span>
      )}
    </div>
  );
}

export default Header;
