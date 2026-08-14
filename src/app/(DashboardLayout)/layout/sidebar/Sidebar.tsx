'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import SidebarContent from './Sidebaritems';
import SimpleBar from 'simplebar-react';
import { Icon } from '@iconify/react';
import { useHMS } from '@/context/HMSContext';
import { ROLE_DEFINITIONS } from '@/lib/types/rbac';
import {
  AMLogo,
  AMMenu,
  AMMenuItem,
  AMSidebar,
  AMSubmenu,
} from 'tailwind-sidebar';
import 'tailwind-sidebar/styles.css';

const renderSidebarItems = (
  items: any[],
  currentPath: string,
  onClose?: () => void,
  isSubItem: boolean = false
) => {
  return items.map((item, index) => {
    const IconComp = item.icon || null;

    const iconElement = IconComp ? (
      <Icon icon={IconComp} height={21} width={21} />
    ) : (
      <Icon icon={'ri:checkbox-blank-circle-line'} height={9} width={9} />
    );

    // Heading
    if (item.heading) {
      return (
        <div className="mb-1" key={item.heading}>
          <AMMenu
            subHeading={item.heading}
            ClassName={`hide-menu leading-21 text-charcoal font-bold uppercase text-xs dark:text-darkcharcoal`}
          />
        </div>
      );
    }

    // Submenu
    if (item.children?.length) {
      return (
        <AMSubmenu
          key={item.id}
          icon={iconElement}
          title={item.name}
          ClassName={`mt-1.5 text-link dark:text-darklink`}
        >
          {renderSidebarItems(item.children, currentPath, onClose, true)}
        </AMSubmenu>
      );
    }

    // Regular menu item
    const linkTarget = item.url?.startsWith('https') ? '_blank' : '_self';

    const isSelected =
      !!item?.url &&
      (currentPath === item.url ||
        (item.url !== '/dashboard' && item.url !== '/' && currentPath?.startsWith(item.url)));

    const itemClassNames = isSubItem
      ? `mt-1.5 text-link dark:text-darklink !hover:bg-transparent ${item?.isPro && '!text-gray-400'} ${
          isSelected ? '!bg-lightprimary !text-primary font-bold' : ''
        } !px-1.5 `
      : `hover:bg-lightprimary! hover:text-primary! mt-1.5 ${
          item?.isPro && '!text-gray-400'
        } text-link dark:text-darklink ${
          isSelected ? '!bg-lightprimary !text-primary !hover-bg-lightprimary font-bold' : ' '
        }`;

    return (
      <div onClick={onClose} key={index}>
        <AMMenuItem
          key={item.id}
          component={Link}
          link={item.url || '#'}
          icon={iconElement}
          isSelected={isSelected}
          badgeColor="bg-lightsecondary"
          badgeTextColor="text-secondary"
          disabled={item.disabled}
          badgeContent={item.isPro ? 'Pro' : undefined}
          className={`${itemClassNames}`}
        >
          <span className="truncate flex-1">{item.title || item.name}</span>
        </AMMenuItem>
      </div>
    );
  });
};

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { currentRole, logout } = useHMS();

  const roleDef = ROLE_DEFINITIONS[currentRole];

  // Only allow "light" or "dark" for AMSidebar
  const sidebarMode = theme === 'light' || theme === 'dark' ? theme : undefined;

  // Filter sidebar sections and items based on currentRole
  const filteredSidebarContent = SidebarContent.map((section) => {
    const filteredChildren = section.children?.filter((child) => {
      if (!child.allowedRoles) return true;
      return child.allowedRoles.includes(currentRole);
    });

    if (!filteredChildren || filteredChildren.length === 0) {
      return null;
    }

    return {
      ...section,
      children: filteredChildren
    };
  }).filter(Boolean);

  return (
    <AMSidebar
      collapsible="none"
      animation={true}
      showProfile={false}
      width={'270px'}
      showTrigger={false}
      mode={sidebarMode}
      className="fixed left-0 top-0 border-none bg-background z-10 h-screen flex flex-col justify-between"
    >
      {/* Logo */}
      <div>
        <div className="px-4 flex items-center brand-logo overflow-hidden">
          <AMLogo component={Link} href="/dashboard" img="">
            <Image
              src="/images/logos/dark-logo.svg"
              alt="logo"
              width={135}
              height={40}
              className="rtl:scale-x-[-1]"
            />
          </AMLogo>
        </div>

        {/* Sidebar items */}
        <SimpleBar className="h-[calc(100vh-180px)]">
          <div className="px-6">
            {filteredSidebarContent.map((section: any, index: number) => (
              <div key={index}>
                {renderSidebarItems(
                  [
                    ...(section.heading ? [{ heading: section.heading }] : []),
                    ...(section.children || []),
                  ],
                  pathname,
                  onClose
                )}
              </div>
            ))}
          </div>
        </SimpleBar>
      </div>

      {/* Active Role Footer & Logout */}
      <div className="p-3 mx-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
        {roleDef && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary font-bold">
              <Icon icon="solar:shield-user-bold-duotone" width="16" />
              <span className="truncate max-w-[130px]">{currentRole}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">L{roleDef.level}</span>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all border border-rose-200 dark:border-rose-900"
        >
          <Icon icon="solar:logout-3-bold-duotone" width="14" />
          Sign Out / Logout
        </button>
      </div>
    </AMSidebar>
  );
};

export default SidebarLayout;
