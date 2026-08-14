'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconArrowNarrowRight,
  IconHeartHandshake,
  IconMail,
  IconMapPin,
  IconMenu2,
  IconPhone,
  IconX
} from '@tabler/icons-react';
import Reveal from './components/home/Reveal';
import ThemeToggle from './components/home/ThemeToggle';

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ */

const NAV_LINKS = [
  { id: 'about', label: 'Why it exists' },
  { id: 'platform', label: 'Platform' },
  { id: 'team', label: 'Team' },
  { id: 'contact', label: 'Contact' }
];

const COMPLIANCE = [
  { short: 'HeFRA', full: 'Health Facilities Regulatory Agency licensing' },
  { short: 'GHS', full: 'Ghana Health Service service standards' },
  { short: 'NHIA G-DRG', full: 'National Health Insurance tariff and claims' },
  { short: 'DHIMS2', full: 'District Health Information Management System' },
  { short: 'DPC', full: 'Data Protection Commission, Act 843' }
];

const PRINCIPLES = [
  {
    number: '01',
    title: 'One patient, one record',
    body: 'A Ghana Card number resolves to a single Master Patient Index entry. Registration refuses a duplicate card outright and offers a merge instead, so the same person cannot accumulate three folders across three visits.'
  },
  {
    number: '02',
    title: 'The record follows the patient',
    body: 'Triage vitals, the consultation note, the laboratory request, the dispensed medicine and the bill are one chain. A clinician opening a folder sees what the last department actually did, not a summary someone retyped.'
  },
  {
    number: '03',
    title: 'Authority is enforced, not advertised',
    body: 'Nineteen roles, each with an explicit set of permissions and an explicit set of things it may not do. Those limits are checked on the server for every request — including the rule that bars the system administrator from clinical records.'
  },
  {
    number: '04',
    title: 'Claims are built from care, not retyped',
    body: 'An NHIS claim line is assembled from the diagnosis the doctor coded and the tariff attached to the service. Demographics come from the patient record, so a claim can never disagree with the folder it came from.'
  }
];

const MODULES = [
  { group: 'Front office', items: ['Patient registration & MPI', 'Ghana Card and NHIS validation', 'Appointments and queue routing', 'Records retrieval and merge'] },
  { group: 'Clinical care', items: ['Triage vitals and ESI scoring', 'OPD and emergency consultation', 'ICD-10 coding and orders', 'Discharge and sick-leave notes'] },
  { group: 'Diagnostics', items: ['Laboratory orders and worklist', 'Specimen barcoding and results', 'PACS imaging requests', 'Radiology reporting and sign-off'] },
  { group: 'Wards & theatre', items: ['Bed board and occupancy', 'Admission, discharge, transfer', 'Medication administration chart', 'Theatre preparation'] },
  { group: 'Pharmacy & stores', items: ['FEFO batch stock control', 'Prescription verification', 'Dispensing and counselling', 'Procurement and central stores'] },
  { group: 'Revenue & governance', items: ['Cashier shifts and receipts', 'NHIS G-DRG claim batches', 'DHIMS2 monthly returns', 'Immutable audit trail'] }
];

const NUMBERS = [
  { value: '19', label: 'Staff roles', note: 'each with enforced limits' },
  { value: '24', label: 'Feature modules', note: 'front desk to claims' },
  { value: '3', label: 'Facility branches', note: 'managed from one system' },
  { value: '100%', label: 'Server-side RBAC', note: 'no browser-trusted access' }
];

const LEAD = {
  name: 'Ernest Nketia Asubonterng',
  id: '22424715',
  role: 'Lead System Architect & AI Integrator',
  focus:
    'Software architecture, the Ollama clinical assistant and GSTG rule engine, Next.js App Router, PostgreSQL and Prisma, HeFRA/GHS compliance, and multi-facility management.'
};

const TEAM = [
  { name: 'Nana Kwabena Asare', id: '22424817', role: 'Software Engineer', focus: 'Clinical EMR consultation and ICD-10 diagnosis engine' },
  { name: 'Casper Kosi Asense', id: '22425080', role: 'Software Engineer', focus: 'Master Patient Index, Ghana Card and NHIS validation' },
  { name: 'Aubrey Owusu Amoah', id: '22424666', role: 'Senior Software Engineer', focus: 'PACS radiology orders and diagnostic workflows' },
  { name: 'Thomas Nii Armah Okai', id: '22425782', role: 'Senior Software Engineer', focus: 'Pharmacy FEFO stock control and prescription dispensing' },
  { name: 'Abubakari Zubeiru', id: '22425115', role: 'QA & Security Engineer', focus: 'Inpatient bed management and DPC audit-log compliance' },
  { name: 'Frank Tandoh', id: '22425049', role: 'UI/UX & Frontend Engineer', focus: 'Responsive layouts, design system and accessibility' }
];

/** Rows for the hero call board. */
const QUEUE_PREVIEW = [
  { ticket: 'TRG-014', name: 'A. Serwaa Akoto', at: 'Triage station 1', state: 'In triage', tone: 'amber' as const },
  { ticket: 'OPD-032', name: 'K. Owusu Ansah', at: 'Consulting room 2', state: 'With doctor', tone: 'green' as const },
  { ticket: 'LAB-009', name: 'A. Nyarko', at: 'Phlebotomy bay', state: 'Waiting', tone: 'slate' as const },
  { ticket: 'PHM-021', name: 'Y. Addo-Danquah', at: 'Dispensary 1', state: 'Ready', tone: 'green' as const }
];

const TONE_STYLES = {
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
  slate: 'bg-stone-100 text-stone-600 ring-stone-200 dark:bg-white/5 dark:text-stone-300 dark:ring-white/10'
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);

      const marker = window.scrollY + 200;
      let current = '';
      for (const { id } of NAV_LINKS) {
        const element = document.getElementById(id);
        if (element && marker >= element.offsetTop) current = id;
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 antialiased dark:bg-[#0b0f0e] dark:text-stone-100">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? 'border-b border-stone-200/80 bg-[#fbfaf8]/85 backdrop-blur-md dark:border-white/10 dark:bg-[#0b0f0e]/85'
            : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d6b4e] text-white">
              <IconHeartHandshake size={21} stroke={2} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-extrabold tracking-tight">
                HealthEasy<span className="text-[#0d6b4e] dark:text-emerald-400">-G</span>
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                Hospital Management
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`relative text-[13px] font-medium transition-colors ${
                  activeSection === id
                    ? 'text-stone-900 dark:text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                }`}
              >
                {label}
                {activeSection === id && (
                  <span className="absolute -bottom-1.5 left-0 h-px w-full bg-[#0d6b4e] dark:bg-emerald-400" />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="hidden rounded-full bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d6b4e] sm:inline-flex dark:bg-white dark:text-stone-900 dark:hover:bg-emerald-400"
            >
              Staff sign in
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 md:hidden dark:border-white/15 dark:text-stone-200"
            >
              {menuOpen ? <IconX size={17} /> : <IconMenu2 size={17} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-stone-200 bg-[#fbfaf8] px-6 py-4 md:hidden dark:border-white/10 dark:bg-[#0b0f0e]">
            <ul className="space-y-3">
              {NAV_LINKS.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm font-medium text-stone-600 dark:text-stone-300"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/auth/login"
                  className="inline-flex rounded-full bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white dark:bg-white dark:text-stone-900"
                >
                  Staff sign in
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* A single soft wash rather than a full-bleed gradient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#0d6b4e]/[0.07] blur-3xl dark:bg-emerald-500/10"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                <span className="h-px w-8 bg-[#0d6b4e] dark:bg-emerald-400" />
                Ridge Regional Hospital, Accra
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="font-display mt-6 text-[2.6rem] leading-[1.08] tracking-[-0.02em] sm:text-6xl">
                The whole hospital,
                <br />
                <span className="italic text-[#0d6b4e] dark:text-emerald-400">on one record.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-stone-600 dark:text-stone-300">
                HealthEasy-G carries a patient from the registration desk through triage,
                consultation, the laboratory, the pharmacy and the cashier without anyone
                retyping a name. Built to the standards Ghanaian facilities are actually
                measured against.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#0d6b4e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a5740]"
                >
                  Sign in to the portal
                  <IconArrowNarrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#platform"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 dark:border-white/15 dark:text-stone-200 dark:hover:border-white/30 dark:hover:text-white"
                >
                  See what it covers
                </a>
              </div>
            </Reveal>
          </div>

          {/* Live call board — a real product surface, not decoration. */}
          <Reveal delay={320} className="lg:col-span-5">
            <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_24px_60px_-32px_rgba(28,25,23,0.35)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 dark:border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                  Patient flow
                </p>
                <span className="flex items-center gap-2 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  <span className="hms-live-dot h-1.5 w-1.5 rounded-full bg-[#0d6b4e] dark:bg-emerald-400" />
                  Live
                </span>
              </div>

              <ul className="divide-y divide-stone-100 dark:divide-white/5">
                {QUEUE_PREVIEW.map((row, index) => (
                  <li
                    key={row.ticket}
                    className="hms-queue-row flex items-center justify-between gap-3 px-5 py-3.5"
                    style={{ animationDelay: `${index * 900}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                        {row.ticket}
                      </p>
                      <p className="truncate text-[13px] font-semibold">{row.name}</p>
                      <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">{row.at}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${TONE_STYLES[row.tone]}`}
                    >
                      {row.state}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="border-t border-stone-200 px-5 py-3 text-[11px] text-stone-500 dark:border-white/10 dark:text-stone-400">
                Every movement is written to the audit trail with the staff member who made it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Compliance strip ───────────────────────────────────── */}
      <section className="border-y border-stone-200 px-6 py-7 dark:border-white/10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              Aligned to
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-4">
              {COMPLIANCE.map(({ short, full }) => (
                <li key={short} title={full} className="group">
                  <span className="font-display text-lg tracking-tight text-stone-700 transition-colors group-hover:text-[#0d6b4e] dark:text-stone-200 dark:group-hover:text-emerald-400">
                    {short}
                  </span>
                  <span className="ml-2 hidden text-[11px] text-stone-400 lg:inline dark:text-stone-500">
                    {full}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Why it exists ──────────────────────────────────────── */}
      <section id="about" className="px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  Why it exists
                </p>
                <h2 className="font-display mt-5 text-3xl leading-[1.15] tracking-[-0.015em] sm:text-[2.5rem]">
                  Paper folders lose people.
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-stone-600 dark:text-stone-300">
                  A patient seen three times can hold three folders, three NHIS numbers and
                  three versions of an allergy list. Four decisions shape this system, and
                  each is enforced in code rather than in a policy document.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-8">
              <dl className="divide-y divide-stone-200 dark:divide-white/10">
                {PRINCIPLES.map(({ number, title, body }, index) => (
                  <Reveal key={number} delay={index * 90} className="grid gap-4 py-7 sm:grid-cols-12">
                    <dt className="sm:col-span-4">
                      <span className="font-mono text-[11px] font-semibold text-[#0d6b4e] dark:text-emerald-400">
                        {number}
                      </span>
                      <p className="mt-1.5 text-[15px] font-bold tracking-tight">{title}</p>
                    </dt>
                    <dd className="text-[14px] leading-[1.72] text-stone-600 sm:col-span-8 dark:text-stone-300">
                      {body}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform ───────────────────────────────────────────── */}
      <section id="platform" className="border-t border-stone-200 px-6 py-24 sm:py-28 dark:border-white/10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Platform
              </p>
              <h2 className="font-display mt-5 text-3xl leading-[1.15] tracking-[-0.015em] sm:text-[2.5rem]">
                Every department, one chain of custody.
              </h2>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ group, items }, index) => (
              <Reveal key={group} delay={index * 70}>
                <h3 className="border-b border-stone-200 pb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:border-white/10 dark:text-stone-400">
                  {group}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-stone-700 dark:text-stone-300">
                      <span
                        aria-hidden
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#0d6b4e] dark:bg-emerald-400"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers ────────────────────────────────────────────── */}
      <section className="border-y border-stone-200 px-6 py-16 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {NUMBERS.map(({ value, label, note }, index) => (
            <Reveal
              key={label}
              delay={index * 80}
              className="border-stone-200 lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0 dark:border-white/10"
            >
              <p className="font-display text-4xl tracking-tight sm:text-5xl">{value}</p>
              <p className="mt-2 text-[13px] font-bold tracking-tight">{label}</p>
              <p className="mt-0.5 text-[12px] text-stone-500 dark:text-stone-400">{note}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────────── */}
      <section id="team" className="px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                CSCD602 Capstone · Advance Software Development
              </p>
              <h2 className="font-display mt-5 text-3xl leading-[1.15] tracking-[-0.015em] sm:text-[2.5rem]">
                The people who built it.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-12 border-l-2 border-[#0d6b4e] py-1 pl-6 dark:border-emerald-400">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0d6b4e] dark:text-emerald-400">
                Lead developer
              </p>
              <h3 className="font-display mt-2 text-2xl tracking-tight sm:text-3xl">{LEAD.name}</h3>
              <p className="mt-1 text-[13px] font-semibold text-stone-700 dark:text-stone-200">
                {LEAD.role}
                <span className="ml-2 font-mono text-[11px] font-normal text-stone-400 dark:text-stone-500">
                  {LEAD.id}
                </span>
              </p>
              <p className="mt-3 max-w-2xl text-[14px] leading-[1.72] text-stone-600 dark:text-stone-300">
                {LEAD.focus}
              </p>
            </div>
          </Reveal>

          <ul className="mt-12 divide-y divide-stone-200 dark:divide-white/10">
            {TEAM.map(({ name, id, role, focus }, index) => (
              <Reveal
                as="li"
                key={id}
                delay={index * 60}
                className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6"
              >
                <div className="sm:col-span-4">
                  <p className="text-[14px] font-bold tracking-tight">{name}</p>
                  <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">{id}</p>
                </div>
                <p className="text-[13px] font-semibold text-stone-700 sm:col-span-3 dark:text-stone-200">
                  {role}
                </p>
                <p className="text-[13px] leading-relaxed text-stone-500 sm:col-span-5 dark:text-stone-400">
                  {focus}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <section id="contact" className="border-t border-stone-200 px-6 py-24 sm:py-28 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                Contact
              </p>
              <h2 className="font-display mt-5 text-3xl leading-[1.15] tracking-[-0.015em] sm:text-[2.5rem]">
                Talk to the deployment team.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.75] text-stone-600 dark:text-stone-300">
                For facility installations, HeFRA licensing alignment and Ghana Health
                Service integrations.
              </p>

              <ul className="mt-9 space-y-4 text-[14px]">
                <li className="flex items-start gap-3">
                  <IconMapPin size={17} className="mt-0.5 shrink-0 text-[#0d6b4e] dark:text-emerald-400" />
                  <span className="text-stone-600 dark:text-stone-300">
                    Castle Road, Ridge, Accra
                    <span className="mt-0.5 block font-mono text-[11px] text-stone-400 dark:text-stone-500">
                      GA-029-3829
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <IconPhone size={17} className="shrink-0 text-[#0d6b4e] dark:text-emerald-400" />
                  <a href="tel:+233302228311" className="text-stone-600 hover:underline dark:text-stone-300">
                    +233 30 222 8311
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <IconMail size={17} className="shrink-0 text-[#0d6b4e] dark:text-emerald-400" />
                  <a href="mailto:info@ridgehms.gh" className="text-stone-600 hover:underline dark:text-stone-300">
                    info@ridgehms.gh
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-7">
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 px-6 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d6b4e] text-white">
              <IconHeartHandshake size={17} stroke={2} />
            </span>
            <p className="text-[13px] font-semibold">
              HealthEasy<span className="text-[#0d6b4e] dark:text-emerald-400">-G</span>
              <span className="ml-2 font-normal text-stone-500 dark:text-stone-400">
                Hospital Management System
              </span>
            </p>
          </div>
          <p className="text-[12px] text-stone-500 dark:text-stone-400">
            CSCD602 Capstone Project · University of Ghana · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Contact form
 * ------------------------------------------------------------------ */

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    'w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors placeholder:text-stone-400 focus:border-[#0d6b4e] focus:ring-2 focus:ring-[#0d6b4e]/15 dark:border-white/15 dark:bg-white/[0.04] dark:placeholder:text-stone-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20';

  const labelClass = 'mb-1.5 block text-[12px] font-semibold text-stone-600 dark:text-stone-300';

  if (submitted) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-start justify-center rounded-2xl border border-stone-200 bg-white p-8 dark:border-white/10 dark:bg-white/[0.03]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d6b4e]/10 text-[#0d6b4e] dark:bg-emerald-400/10 dark:text-emerald-400">
          <IconMail size={19} />
        </span>
        <h3 className="font-display mt-4 text-2xl tracking-tight">Enquiry noted.</h3>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-stone-600 dark:text-stone-300">
          This is a capstone demonstration, so nothing was sent. Reach the team directly at{' '}
          <a href="mailto:info@ridgehms.gh" className="font-semibold text-[#0d6b4e] hover:underline dark:text-emerald-400">
            info@ridgehms.gh
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-[13px] font-semibold text-stone-600 underline underline-offset-4 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
      className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="contact-facility">
            Facility name
          </label>
          <input id="contact-facility" name="facility" required placeholder="Ridge Regional Hospital" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-region">
            Region
          </label>
          <input id="contact-region" name="region" required placeholder="Greater Accra" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-name">
            Your name
          </label>
          <input id="contact-name" name="name" required placeholder="Dr. Ama Boateng" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contact-email">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required placeholder="you@facility.gh" className={inputClass} />
        </div>
      </div>

      <div className="mt-5">
        <label className={labelClass} htmlFor="contact-message">
          What do you need?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          placeholder="Bed count, departments to roll out first, and any existing systems to integrate with."
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0d6b4e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a5740]"
      >
        Send enquiry
        <IconArrowNarrowRight size={18} />
      </button>

      <p className="mt-4 text-[12px] text-stone-500 dark:text-stone-400">
        Capstone demonstration — submissions are not delivered anywhere.
      </p>
    </form>
  );
}
