'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  Menu,
  X,
  ChevronDown,
  Building2,
  Landmark,
  Users,
  Briefcase,
} from 'lucide-react';

const SOLUTIONS = [
  { href: '/soluciones/juntas-de-vecinos', label: 'Juntas de Vecinos', icon: Users, desc: 'Carnets y beneficios vecinales' },
  { href: '/soluciones/bienestar-empresas', label: 'Bienestar de Empresas', icon: Briefcase, desc: 'Gestión de beneficios corporativos' },
  { href: '/soluciones/sindicatos', label: 'Sindicatos', icon: Building2, desc: 'Credenciales y padrón digital' },
  { href: '/soluciones/corporaciones-municipales', label: 'Corporaciones Municipales', icon: Landmark, desc: 'Identidad digital ciudadana' },
];

const NAV_LINKS = [
  { href: '/como-funciona', label: 'Cómo Funciona' },
  { href: '/precios', label: 'Precios' },
  { href: '/blog', label: 'Blog' },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
      setSolutionsOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface-950/90 backdrop-blur-xl border-b border-brand-500/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative">
              {/* Logo Background Aura */}
              <div className="absolute -inset-2 bg-brand-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-brand-500/30 transition-all">
                <img 
                  src="/images/skardkey-icon.png" 
                  alt="SkardKey" 
                  className="w-full h-full object-contain scale-[1.6] drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" 
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter leading-none">Skard<span className="text-brand-400">Key</span></span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-1 font-bold">Secure ID</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Solutions dropdown */}
            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onMouseEnter={() => setSolutionsOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname.startsWith('/soluciones')
                    ? 'text-brand-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Soluciones
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {solutionsOpen && (
                <div
                  onMouseLeave={() => setSolutionsOpen(false)}
                  className="absolute top-full left-0 mt-2 w-80 bg-surface-900/95 backdrop-blur-xl border border-brand-500/15 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in"
                >
                  <div className="p-2">
                    {SOLUTIONS.map(({ href, label, icon: Icon, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-500/10 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors flex-shrink-0 mt-0.5">
                          <Icon className="w-4.5 h-4.5 text-brand-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regular links */}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === href
                    ? 'text-brand-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Acceder
            </Link>
            <Link
              href="/contacto"
              className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <span className="relative z-10">Solicitar Demo</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-surface-950/98 backdrop-blur-xl border-t border-brand-500/10 animate-fade-in">
          <div className="px-4 py-6 space-y-2">
            {/* Solutions */}
            <div className="pb-2 border-b border-brand-500/10 mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Soluciones</p>
              {SOLUTIONS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-brand-500/10 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4 text-brand-400" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Links */}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-brand-500/10 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <div className="pt-4 space-y-2 border-t border-brand-500/10 mt-4">
              <Link
                href="/login"
                className="block text-center px-4 py-2.5 text-sm text-slate-300 border border-brand-500/20 rounded-xl hover:bg-brand-500/10"
              >
                Acceder
              </Link>
              <Link
                href="/contacto"
                className="btn-primary block text-center px-4 py-3 text-sm font-semibold"
              >
                <span className="relative z-10">Solicitar Demo Gratis</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
