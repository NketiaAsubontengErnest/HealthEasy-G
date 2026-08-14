'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const sections = ['home', 'about', 'services', 'team', 'contact'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#050d1a] text-white overflow-x-hidden scroll-smooth">
      {/* ── Top Navigation Bar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#050d1a]/85">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="#home" onClick={() => setActiveSection('home')} className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#16a34a,#0ea5e9)' }}
            >
              H
            </div>
            <span className="font-extrabold text-white tracking-tight text-lg">
              HealthEasy<span className="text-emerald-400">-G</span>
            </span>
          </Link>

          {/* Navigation Links with Active State Indicator */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'services', label: 'Services' },
              { id: 'team', label: 'Team' },
              { id: 'contact', label: 'Contact' },
            ].map(({ id, label }) => {
              const isActive = activeSection === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setActiveSection(id)}
                  className={`transition-all duration-200 py-1 border-b-2 text-sm ${
                    isActive
                      ? 'text-emerald-400 border-emerald-400 font-extrabold shadow-xs'
                      : 'text-slate-300 border-transparent font-semibold hover:text-white hover:border-slate-500'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>

          {/* Enter HMS Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: 'linear-gradient(135deg,#16a34a,#0ea5e9)',
                boxShadow: '0 0 20px rgba(22,163,74,0.3)',
              }}
            >
              Enter HMS →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 1. HOME / HERO SECTION ── */}
      <section id="home" className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow blobs */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[750px] h-[420px] rounded-full opacity-20 blur-[130px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#16a34a 0%,#0ea5e9 60%,transparent 100%)' }}
        />

        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ghana Health Service · HeFRA · NHIS &amp; Multi-Hospital Compliant
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
            Multi-Hospital System
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg,#34d399,#38bdf8)' }}
            >
              Built for Ghana Healthcare
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            HealthEasy-G is an enterprise hospital management ecosystem — unifying patient MPI, AI clinical decision support, LIS, PACS radiology, FEFO pharmacy, NHIS G-DRG claims, and DPC audit compliance across multiple facilities.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-base text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#16a34a,#0ea5e9)',
                boxShadow: '0 8px 40px rgba(22,163,74,0.35)',
              }}
            >
              🏥 Launch HMS Dashboard
            </Link>
            <a
              href="#about"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              Explore Architecture ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Quick Stats Strip ── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '19', label: 'Staff Roles Supported', color: '#34d399' },
            { value: '16', label: 'Feature Modules', color: '#38bdf8' },
            { value: '100%', label: 'HeFRA & NHIS Aligned', color: '#a78bfa' },
            { value: 'AI-Powered', label: 'Ollama kimi-k3 Assistant', color: '#fb923c' },
          ].map(({ value, label, color }) => (
            <div key={label} className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black" style={{ color }}>
                {value}
              </p>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. ABOUT SECTION ── */}
      <section id="about" className="py-24 px-6 border-b border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              About HealthEasy-G
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Transforming Hospital Operations Across Ghana
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              HealthEasy-G was designed specifically for Ghanaian health facilities — addressing real-world challenges in patient registration, long OPD queues, manual lab paper trails, insurance claim rejections, and multi-tenant hospital branch administration.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our system enforces strict **Role-Based Access Control (RBAC)** across 19 distinct staff roles, integrates local payment methods like **MTN MoMo** and **Telecel Cash**, and provides an **AI Clinical Assistant** trained on Ghana Standard Treatment Guidelines (GSTG).
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Multi-Hospital Branch Management
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Ghana Card (NIA) &amp; NHIS Validation
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> AI Medicine Suggestion Engine
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> DHIMS2 &amp; DPC Audit Compliance
              </div>
            </div>
          </div>

          {/* Cards Visual */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">Super Admin Multi-Tenancy</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  GAR-RIDGE-01
                </span>
              </div>
              <p className="text-sm font-extrabold text-white">Ridge Regional Hospital &amp; Kumasi South Annex</p>
              <p className="text-xs text-slate-500">
                Super Admins can register new facilities, assign directors, monitor HeFRA licensing status, and switch active hospital contexts globally.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-400">Clinical Decision Support</span>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  kimi-k3:cloud
                </span>
              </div>
              <p className="text-sm font-extrabold text-white">GSTG-Aligned AI Prescribing Partner</p>
              <p className="text-xs text-slate-500">
                Analyses patient ICD-10 diagnoses, vitals, lab results, allergies, and real-time hospital pharmacy stock to suggest appropriate medications for doctor approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES SECTION ── */}
      <section id="services" className="py-24 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              End-to-End Hospital Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Complete Clinical &amp; Administrative Services
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Integrated modules connecting every department in your hospital from reception to finance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '🪪',
                title: 'Master Patient Index (MPI)',
                desc: 'Patient registration with Ghana Card (NIA), NHIS number verification, duplicate detection, and demographic updates.',
                color: '#34d399',
              },
              {
                icon: '🤖',
                title: 'AI Consultation & EMR',
                desc: 'OPD notes, ICD-10 coding, clinical orders, and AI medicine suggestions powered by Ollama kimi-k3:cloud.',
                color: '#38bdf8',
              },
              {
                icon: '🔬',
                title: 'Laboratory Information System (LIS)',
                desc: 'Specimen barcode tracking, lab result verification, critical value alerts, and hematology/biochemistry logs.',
                color: '#a78bfa',
              },
              {
                icon: '📡',
                title: 'Radiology & PACS Imaging',
                desc: 'X-Ray, Ultrasound, CT, and MRI order workflows, DICOM image attachment, and verified radiologist reporting.',
                color: '#fb923c',
              },
              {
                icon: '💊',
                title: 'Pharmacy & FEFO Inventory',
                desc: 'First-Expired-First-Out drug dispensing, controlled substance logs, reorder alerts, and automated stock deduction.',
                color: '#f472b6',
              },
              {
                icon: '🏥',
                title: 'Inpatient Wards & Beds (ADT)',
                desc: 'Real-time bed availability board, bed transfer management, fluid balance charts, and nursing MAR scheduling.',
                color: '#34d399',
              },
              {
                icon: '🧾',
                title: 'Billing & Cashier Services',
                desc: 'MoMo, Cash, and Card payments, invoice auto-generation, shift reconciliation, and itemized patient receipts.',
                color: '#38bdf8',
              },
              {
                icon: '📋',
                title: 'NHIS G-DRG Claims Engine',
                desc: 'Tariff code mapping, CLAIM-it batch file export, NHIA audit validation, and claim status reconciliation.',
                color: '#a78bfa',
              },
              {
                icon: '🛡️',
                title: 'Security & DPC Audit Trail',
                desc: 'Immutable, IP-stamped audit logs compliant with Ghana Data Protection Commission standards across all 19 roles.',
                color: '#fb923c',
              },
            ].map(({ icon, title, desc, color }) => (
              <div
                key={title}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-extrabold text-white text-base mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TEAM SECTION ── */}
      <section id="team" className="py-24 px-6 border-b border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              CSCD602 Capstone Project Development Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Advance Software Development Group
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">
              Meet the software engineering team behind HealthEasy-G HMS — building an enterprise healthcare system for Ghana.
            </p>
          </div>

          {/* 🌟 HIGHLIGHTED LEAD DEVELOPER (RANK 1) 🌟 */}
          <div className="max-w-3xl mx-auto">
            <div className="p-8 rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-sky-950/40 shadow-2xl relative overflow-hidden group hover:border-emerald-400 transition-all duration-300">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-extrabold text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-lg">
                ★ Lead Developer &amp; AI Integrator
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 p-1 flex-shrink-0 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-4xl">
                    🤖
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl font-black text-white">Ernest Nketia Asubonterng</h3>
                    <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      ID: 22424715
                    </span>
                  </div>
                  <p className="text-emerald-400 font-extrabold text-sm tracking-wide">
                    Lead System Architect, AI Integrator &amp; Software Engineer
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Lead Developer directing software architecture, Ollama AI Clinical Assistant &amp; GSTG Engine integration, Next.js 16 App Router, PostgreSQL / Prisma ORM, HeFRA/GHS compliance, and multi-hospital system management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 8 GROUP DEVELOPERS GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: 'Nana Kwabena Asare',
                id: '22424817',
                role: 'Senior Software Engineer',
                specialty: 'Clinical EMR Consultation & ICD-10 Diagnosis Engine',
                avatar: '👨‍⚕️',
                tag: 'Clinical',
              },
              {
                name: 'Casper Kosi Asense',
                id: '22425080',
                role: 'Software Engineer',
                specialty: 'Master Patient Index (MPI), Ghana Card & NHIS Validation',
                avatar: '💻',
                tag: 'MPI Core',
              },
              {
                name: 'Richard Gyebi',
                id: '22424822',
                role: 'FinTech & Billing Engineer',
                specialty: 'Cashier Shift Systems, MoMo Payments & NHIS G-DRG Claims',
                avatar: '👨‍💼',
                tag: 'Billing',
              },
              {
                name: 'Aubrey Owusu Amoah',
                id: '22424666',
                role: 'Full-Stack Engineer',
                specialty: 'PACS Radiology Imaging Orders & Diagnostic Workflows',
                avatar: '📡',
                tag: 'Radiology',
              },
              {
                name: 'Thomas Nii Armah Okai',
                id: '22425782',
                role: 'Software Engineer',
                specialty: 'Pharmacy FEFO Stock Inventory & Prescription Dispensing',
                avatar: '💊',
                tag: 'Pharmacy',
              },
              {
                name: 'Abubakari Zubeiru',
                id: '22425115',
                role: 'QA & Security Engineer',
                specialty: 'Inpatient Bed Management (ADT) & DPC Audit Log Compliance',
                avatar: '🛡️',
                tag: 'Wards & Security',
              },
              {
                name: 'Frank Tandoh',
                id: '22425049',
                role: 'UI/UX & Frontend Engineer',
                specialty: 'Responsive Layouts, Glassmorphism Aesthetics & Accessibility',
                avatar: '🎨',
                tag: 'UI/UX',
              },
            ].map(({ name, id, role, specialty, avatar, tag }) => (
              <div
                key={id}
                className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-white/10 flex items-center justify-center text-2xl">
                    {avatar}
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-snug">{name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">ID: {id}</p>
                  <p className="text-xs font-bold text-sky-400 mt-1">{role}</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                  {specialty}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CONTACT SECTION ── */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Ready to Upgrade Your Health Facility?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Contact our deployment team for custom hospital installations, HeFRA licensing alignment, and GHS system integrations across Ghana.
            </p>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-bold text-white">Primary Demo Facility</p>
                  <p className="text-slate-400">Ridge Regional Hospital, Castle Road, Ridge, Accra</p>
                  <p className="text-emerald-400 font-mono text-[11px]">GPS: GA-029-3829</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-xl">📞</span>
                <div>
                  <p className="font-bold text-white">System Support Hotline</p>
                  <p className="text-slate-400">+233 30 222 8311 / +233 32 206 1420</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="font-bold text-white">Email Enquiries</p>
                  <p className="text-slate-400">support@healtheasy-g.gh / info@ridgehms.gh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] space-y-4">
            <h3 className="text-xl font-extrabold text-white">Request Facility Onboarding</h3>
            <p className="text-xs text-slate-400">
              Submit your hospital details to schedule a demonstration with our technical team.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g. Korle-Bu Teaching Hospital Annex"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Region</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b172a] border border-white/10 text-white focus:outline-none focus:border-emerald-500">
                    <option>Greater Accra</option>
                    <option>Ashanti</option>
                    <option>Western</option>
                    <option>Northern</option>
                    <option>Volta</option>
                    <option>Eastern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Facility Type</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b172a] border border-white/10 text-white focus:outline-none focus:border-emerald-500">
                    <option>Regional Hospital</option>
                    <option>Teaching / Tertiary</option>
                    <option>District Hospital</option>
                    <option>Private Specialist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="director@hospital.gh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-98"
                style={{
                  background: 'linear-gradient(135deg,#16a34a,#0ea5e9)',
                  boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
                }}
              >
                Submit Onboarding Request →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-slate-600">
          © 2026 HealthEasy-G HMS · Built with Next.js 15 · Advance Software Development Group Project
        </p>
      </footer>
    </main>
  );
}
