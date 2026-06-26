'use client';

import Link from 'next/link';
import {
  CreditCard, QrCode, Shield, BarChart3, ChevronRight, Sparkles,
  Users, Briefcase, Building2, Landmark, ArrowRight, Zap, Lock, Globe,
  CheckCircle2, Star, Wallet, FileText,
} from 'lucide-react';

const AUDIENCES = [
  { icon: Users, title: 'Juntas de Vecinos', desc: '100% Gratuito en Chile. Carnets vecinales digitales con QR, control de socios y asambleas.', href: '/como-funciona?tab=vecinos', color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
  { icon: Briefcase, title: 'Bienestar de Empresas', desc: 'Gestión de beneficios corporativos con trazabilidad y reportes automáticos.', href: '/como-funciona?tab=bienestar', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
  { icon: Building2, title: 'Sindicatos', desc: 'Credenciales digitales para afiliados. Padrón actualizado y control de asambleas.', href: '/como-funciona?tab=sindicatos', color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
  { icon: Landmark, title: 'Corporaciones Municipales', desc: 'Alineado a Ley N° 21.180 (Cero Papel). Digitaliza subsidios, beneficios sociales e identidad comunal.', href: '/como-funciona?tab=municipios', color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
];

const FEATURES = [
  { icon: CreditCard, title: 'Credenciales digitales con QR', desc: 'Cada socio recibe una tarjeta digital única con código QR verificable en tiempo real.' },
  { icon: Shield, title: 'Verificación instantánea', desc: 'Escanea el QR con cualquier celular para validar identidad y estado del socio.' },
  { icon: BarChart3, title: 'Panel de control completo', desc: 'Dashboard con analíticas, gestión de socios, carga masiva y reportes en tiempo real.' },
  { icon: Zap, title: 'Diseñador de credenciales', desc: 'Editor visual drag & drop para personalizar el diseño de tus tarjetas sin código.' },
  { icon: Lock, title: 'Seguridad empresarial', desc: 'Autenticación segura, datos encriptados y preparado para verificación blockchain.' },
  { icon: Wallet, title: 'Control financiero integrado', desc: 'Registra ingresos y gastos de caja y banco. Genera reportes PDF para comités de revisión y auditoría.' },
];

const STEPS = [
  { num: '01', title: 'Crea tu cuenta', desc: 'Registra tu organización en minutos. Sin tarjeta de crédito.' },
  { num: '02', title: 'Diseña tu credencial', desc: 'Usa el editor visual para personalizar colores, logo, atributos y formato.' },
  { num: '03', title: 'Carga socios', desc: 'Importa tu padrón con Excel/CSV o agrega uno por uno.' },
  { num: '04', title: 'Emite y valida', desc: 'Cada socio recibe su tarjeta digital con QR verificable.' },
];

const TESTIMONIALS = [
  { quote: 'Dejamos de imprimir 600 carnets al año. Ahora todo es digital y verificable al instante.', name: 'María González', role: 'Presidenta Junta de Vecinos Los Olivos', stars: 5 },
  { quote: 'La trazabilidad de beneficios nos permitió reducir duplicidades en un 90%.', name: 'Carlos Muñoz', role: 'Jefe de Bienestar, Empresa Constructora', stars: 5 },
  { quote: 'El escaneo QR en asambleas agilizó todo. Sabemos quién está y quién no.', name: 'Patricia Rojas', role: 'Secretaria Sindicato de Trabajadores', stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Plataforma de identidad digital inteligente
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Gratis para Juntas de Vecinos
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Identidad digital{' '}
                <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
                  inteligente
                </span>{' '}
                para tu organización
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mb-8 leading-relaxed">
                Emite credenciales digitales, gestiona beneficios y valida identidades con QR en tiempo real. 
                Para juntas de vecinos, sindicatos, empresas y municipios.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/contacto" className="btn-primary px-8 py-4 text-base font-semibold flex items-center justify-center gap-2">
                  <span className="relative z-10">Solicitar Demo Gratis</span>
                  <ArrowRight className="w-5 h-5 relative z-10" />
                </Link>
                <Link href="/como-funciona" className="btn-secondary px-8 py-4 text-base flex items-center justify-center gap-2">
                  Ver cómo funciona
                </Link>
              </div>

              {/* Trust bar */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sin tarjeta de crédito</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Setup en 5 minutos</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Soporte incluido</div>
              </div>
            </div>

            {/* Hero visual — card mockup */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-[420px]">
                {/* Glow */}
                <div className="absolute -inset-8 bg-gradient-to-r from-brand-500/20 via-purple-500/15 to-brand-500/10 rounded-[40px] blur-3xl" />
                {/* Card */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-surface-800 to-surface-900 border border-brand-500/20 shadow-2xl shadow-brand-500/10 p-8">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                      <img 
                        src="/images/skardkey-icon.png" 
                        alt="SkardKey" 
                        className="w-full h-full object-contain scale-[2] drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                      />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white tracking-tighter leading-none">SkardKey</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-brand-400 mt-1 font-bold">Identidad Digital</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="h-3 bg-brand-500/20 rounded-full w-3/4" />
                    <div className="h-5 bg-white/15 rounded-lg w-full" />
                    <div className="h-3 bg-slate-700/50 rounded-full w-1/2" />
                    <div className="h-4 bg-brand-400/20 rounded-lg w-2/3" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">Válida desde</p>
                      <p className="text-xs text-slate-300">25 Abril 2026</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-xl p-1.5">
                      <QrCode className="w-full h-full text-surface-900" />
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SOBRE NOSOTROS (PREVIEW) ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Sobre SkardKey</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Redefiniendo la{' '}
              <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
                Identidad Digital Inteligente
              </span>{' '}
              en Chile
            </h2>
          </div>

          {/* Image + Text */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
            {/* Hero Image */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <img
                src="/images/skardkey-about-hero.png"
                alt="SkardKey - Identidad Digital y Beneficios"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent" />
            </div>

            {/* Text */}
            <div className="space-y-5">
              <p className="text-lg text-slate-300 leading-relaxed text-justify hyphens-auto">
                En SkardKey, somos una plataforma tecnológica dedicada a transformar la gestión de
                organizaciones y empresas a través de soluciones avanzadas de identidad digital
                inteligente y administración de beneficios. Nacimos con el propósito de erradicar la
                burocracia, optimizar los procesos de auditoría interna y acelerar la modernización
                comunitaria y corporativa en Chile.
              </p>
              <p className="text-base text-slate-400 leading-relaxed text-justify hyphens-auto">
                Desarrollamos un ecosistema robusto que conecta a instituciones con sus miembros de
                manera segura, transparente y eficiente. Mediante el uso de credenciales con códigos QR
                dinámicos y arquitectura preparada para la descentralización con tecnología Blockchain,
                elevamos el estándar de control, auditoría logística y seguridad de la información.
              </p>
              <Link
                href="/nosotros"
                className="inline-flex items-center gap-2 text-sm text-brand-400 font-semibold hover:text-brand-300 transition-colors mt-2"
              >
                Conoce más sobre nosotros <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Misión & Visión Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Misión */}
            <div className="group relative p-7 rounded-3xl bg-gradient-to-br from-surface-900/80 to-surface-950/60 border border-white/[0.06] hover:border-brand-500/20 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Nuestra Misión</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed text-justify hyphens-auto border-l-2 border-brand-500/30 pl-4 italic">
                  &ldquo;Acelerar la transformación digital en Chile proporcionando a comunidades,
                  sindicatos, departamentos de bienestar y corporaciones municipales una herramienta
                  de identidad digital accesible y de alta seguridad.&rdquo;
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="group relative p-7 rounded-3xl bg-gradient-to-br from-surface-900/80 to-surface-950/60 border border-white/[0.06] hover:border-purple-500/20 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Nuestra Visión</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed text-justify hyphens-auto border-l-2 border-purple-500/30 pl-4 italic">
                  &ldquo;Ser la plataforma líder de identidad digital y Web3 en Latinoamérica,
                  reconocidos por democratizar el acceso a tecnología de clase mundial e impulsar
                  comunidades más conectadas, seguras y preparadas para el futuro digital.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PARA QUIÉN ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Soluciones por sector</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Diseñado para <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">tu organización</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Cada tipo de organización tiene necesidades únicas. SkardKey se adapta a cada una.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCES.map(({ icon: Icon, title, desc, href, color, border, iconColor }) => (
              <Link key={href} href={href} className={`group relative rounded-2xl bg-gradient-to-b ${color} border ${border} p-6 hover:border-brand-400/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-500/5`}>
                <div className="mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-surface-900/60 flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{desc}</p>
                <span className="text-xs text-brand-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver solución <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="relative py-24 lg:py-32 bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Desde la emisión de credenciales hasta la validación en terreno, todo integrado.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="glass-card p-6 hover:border-brand-500/25 group">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CÓMO FUNCIONA ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Proceso simple</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Comienza en minutos, no en semanas</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={i} className="relative text-center">
                <div className="text-5xl font-black text-brand-400/40 mb-3">{num}</div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-brand-500/30 to-transparent" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/como-funciona" className="btn-secondary px-8 py-3 text-sm inline-flex items-center gap-2">
              Ver más detalles <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ LEY 21.180 (CERO PAPEL) ═══════════════ */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900/40 via-surface-900 to-purple-900/20 border border-brand-500/20 p-8 md:p-12 lg:p-16 shadow-2xl shadow-brand-500/10">
            {/* Elemento decorativo de fondo */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Landmark className="w-[400px] h-[400px]" />
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold mb-6 tracking-wide uppercase">
                <CheckCircle2 className="w-4 h-4" />
                Colaboración Estatal y Social
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight">
                Impulsa la Ley de Transformación Digital del Estado
              </h2>
              
              <p className="text-lg text-slate-300 leading-relaxed mb-10">
                La <strong className="text-white">Ley N° 21.180 (Cero Papel)</strong> exige a los órganos de la Administración del Estado en Chile realizar sus procedimientos en formato electrónico. SkardKey es la herramienta perfecta para liderar este cambio.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8 mb-10">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-surface-900/50 border border-white/5 hover:bg-surface-800/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
                    <Building2 className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Para Municipalidades</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Moderniza padrones, subsidios y atenciones sociales. Elimina el gasto en credenciales físicas y acelera el servicio al vecino con validaciones QR en terreno.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-surface-900/50 border border-white/5 hover:bg-surface-800/50 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 relative z-10">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-base font-bold text-emerald-400 mb-2">Gratis para Juntas de Vecinos</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Apoyamos a las comunidades de Chile ofreciendo acceso total <strong className="text-slate-200">sin costo alguno</strong>. Profesionaliza tu junta, controla beneficios y empodera a tus vecinos.</p>
                  </div>
                </div>
              </div>
              
              <Link href="/contacto" className="btn-primary px-8 py-4 text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25">
                <span className="relative z-10">Inicia tu Transformación Digital</span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINANCE MODULE SHOWCASE ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Módulo de Finanzas</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Control financiero{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-brand-400 to-emerald-300 bg-clip-text text-transparent">
                total
              </span>{' '}
              para tu organización
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Registra ingresos y egresos de caja y banco, controla el flujo financiero y genera informes listos para comités de auditoría y fiscalización.
            </p>
          </div>

          {/* Charts grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-14">
            {/* Bar Chart — Flujo de Caja Mensual */}
            <div className="glass-card p-6 group hover:border-brand-500/25">
              <h3 className="text-sm font-bold text-white mb-1">Flujo de Caja Mensual</h3>
              <p className="text-[11px] text-slate-500 mb-4">Ingresos vs Gastos del ejercicio contable 2026</p>
              <svg viewBox="0 0 400 200" className="w-full h-auto">
                {/* Grid lines */}
                <line x1="50" y1="20" x2="50" y2="170" stroke="#1e293b" strokeWidth="1" />
                <line x1="50" y1="170" x2="380" y2="170" stroke="#1e293b" strokeWidth="1" />
                {/* Horizontal grid */}
                {[45, 70, 95, 120, 145].map((y, i) => (
                  <g key={i}>
                    <line x1="50" y1={y} x2="380" y2={y} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4,4" />
                    <text x="45" y={y + 4} textAnchor="end" className="fill-slate-500" fontSize="9">{(200000 - i * 50000).toLocaleString('es-CL')}</text>
                  </g>
                ))}
                {/* Bars - Income (emerald) + Expenses (rose) */}
                {[
                  { month: 'Ene', income: 80, expense: 40, x: 75 },
                  { month: 'Feb', income: 60, expense: 35, x: 130 },
                  { month: 'Mar', income: 120, expense: 55, x: 185 },
                  { month: 'Abr', income: 90, expense: 45, x: 240 },
                  { month: 'May', income: 100, expense: 60, x: 295 },
                  { month: 'Jun', income: 70, expense: 30, x: 350 },
                ].map(({ month, income, expense, x }) => (
                  <g key={month}>
                    <rect x={x - 12} y={170 - income} width="11" height={income} rx="2" className="fill-emerald-400/80" />
                    <rect x={x + 2} y={170 - expense} width="11" height={expense} rx="2" className="fill-rose-400/80" />
                    <text x={x} y="184" textAnchor="middle" className="fill-slate-500" fontSize="9">{month}</text>
                  </g>
                ))}
                {/* Legend */}
                <rect x="130" y="194" width="8" height="8" rx="2" className="fill-emerald-400" />
                <text x="142" y="202" className="fill-slate-400" fontSize="9">Ingresos</text>
                <rect x="195" y="194" width="8" height="8" rx="2" className="fill-rose-400" />
                <text x="207" y="202" className="fill-slate-400" fontSize="9">Gastos</text>
              </svg>
            </div>

            {/* Donut Chart — Distribución de Gastos */}
            <div className="glass-card p-6 group hover:border-brand-500/25">
              <h3 className="text-sm font-bold text-white mb-1">Distribución de Gastos</h3>
              <p className="text-[11px] text-slate-500 mb-4">Estructura por categorías acumuladas</p>
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48 mb-4">
                  {/* Donut segments using stroke-dasharray */}
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#6366f1" strokeWidth="30" strokeDasharray="175 265" strokeDashoffset="0" className="opacity-80" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="30" strokeDasharray="88 352" strokeDashoffset="-175" className="opacity-80" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#34d399" strokeWidth="30" strokeDasharray="66 374" strokeDashoffset="-263" className="opacity-80" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#a78bfa" strokeWidth="30" strokeDasharray="55 385" strokeDashoffset="-329" className="opacity-80" />
                  {/* Center text */}
                  <text x="100" y="93" textAnchor="middle" className="fill-slate-500" fontSize="9" fontWeight="500">GASTOS TOTAL</text>
                  <text x="100" y="112" textAnchor="middle" className="fill-white" fontSize="16" fontWeight="800">$214.645</text>
                </svg>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" />  <span className="text-slate-400">Servicios Básicos</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />  <span className="text-slate-400">Gastos Operacionales</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />  <span className="text-slate-400">Materiales</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" />  <span className="text-slate-400">Alimentación</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: 'Dashboard en Tiempo Real', desc: 'Saldos actualizados de caja y banco consolidados en un solo panel.' },
              { icon: FileText, title: 'Reportes de Auditoría', desc: 'Informes en PDF listos para Comités de Revisión y Fiscalización.' },
              { icon: Wallet, title: 'Registro Dual', desc: 'Controla ingresos y egresos tanto de efectivo como de cuenta corriente bancaria.' },
              { icon: Zap, title: 'Gráficos Inteligentes', desc: 'Visualiza flujos mensuales y distribución de gastos con gráficas interactivas.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="glass-card p-5 hover:border-emerald-500/25 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ BLOCKCHAIN BANNER ═══════════════ */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/40 via-purple-900/30 to-brand-900/40 border border-brand-500/15 p-8 md:p-12">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-8 h-8 text-brand-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-1">Preparados para el futuro: Identidad verificable en Blockchain</h3>
                <p className="text-sm text-slate-400">Nuestra arquitectura está diseñada para integrar verificación descentralizada. Tus credenciales estarán listas para Web3.</p>
              </div>
              <Link href="/contacto" className="btn-primary px-6 py-3 text-sm flex-shrink-0">
                <span className="relative z-10">Conocer más</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="relative py-24 lg:py-32 bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Testimonios</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role, stars }, i) => (
              <div key={i} className="glass-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Digitaliza la identidad de tu organización hoy
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Sin compromisos, sin tarjeta de crédito. Agenda una demo personalizada y descubre cómo SkardKey puede transformar tu gestión.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contacto" className="btn-primary px-10 py-4 text-base font-semibold flex items-center gap-2">
              <span className="relative z-10">Solicitar Demo Gratis</span>
              <ArrowRight className="w-5 h-5 relative z-10" />
            </Link>
            <Link href="/precios" className="btn-secondary px-8 py-4 text-base">
              Ver planes y precios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
