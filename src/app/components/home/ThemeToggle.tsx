'use client';

import React from 'react';
import { useTheme } from '@/components/theme-provider';
import { IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Light/dark switch for the public site. The dashboard has its own in the
 * header; both write the same `hms_theme` key, so the choice follows the user
 * across the whole application.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 dark:border-white/15 dark:text-stone-300 dark:hover:border-white/30 dark:hover:text-white ${className}`}
    >
      {isDark ? <IconSun size={17} stroke={1.8} /> : <IconMoon size={17} stroke={1.8} />}
    </button>
  );
}
