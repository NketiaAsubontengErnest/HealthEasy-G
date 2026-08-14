'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (action: string | ((prevTheme: string) => string)) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = useState<string>(defaultTheme);

  // The blocking script in `app/layout.tsx` has already put the right class on
  // <html> before paint. This only syncs React state to that decision, so the
  // toggle button starts out showing the correct icon.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('hms_theme') || defaultTheme;
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } catch {
      document.documentElement.classList.remove('dark');
    }
  }, [defaultTheme]);

  const setTheme = (action: string | ((prevTheme: string) => string)) => {
    setThemeState((prevTheme) => {
      const nextTheme = typeof action === 'function' ? action(prevTheme) : action;
      try {
        localStorage.setItem('hms_theme', nextTheme);
      } catch (e) {}

      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}