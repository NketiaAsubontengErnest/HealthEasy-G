import React from 'react';
import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import './css/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { HMSProvider } from '@/context/HMSContext';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });

// An editorial serif for display headings. Pairing it with Manrope gives the
// public site a considered, institutional voice instead of the single-sans
// look every dashboard template ships with.
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display'
});

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
        {/*
          Applies the saved theme before the first paint. Without this the page
          renders in light, then flips to dark once the provider's effect runs —
          a visible flash on every navigation for anyone using dark mode.
          Light is the default when nothing has been chosen.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('hms_theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${newsreader.variable} ${manrope.className}`}
        suppressHydrationWarning
      >
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
