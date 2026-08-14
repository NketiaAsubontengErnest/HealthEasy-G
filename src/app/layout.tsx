import React from 'react';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './css/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { HMSProvider } from '@/context/HMSContext';

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HealthEasy-G HMS | Hospital Management System',
  description: 'Enterprise Multi-Role Hospital Management System for Ghana Facilities',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${manrope.className}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <HMSProvider>{children}</HMSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
