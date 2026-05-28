'use client';

import Link from 'next/link';
import {
  Check, Sparkles, Shield, Zap, Crown, Building2, Users,
  BarChart3, Vote, ArrowRight, QrCode, FileSpreadsheet,
  Globe, Fingerprint, Lock, ChevronDown, MessageSquare,
  CreditCard, CalendarClock, Package,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Data ─────────────────────────────────────────────── */

const SOCIAL_FEATURES = [
  'Perfil básico de cada miembro',
  'QR dinámico para identificación',
  'Integración con Google Sheets para asistencia',
  'Diseñador visual de credenciales',
  'Hasta 1.000 miembros por organización',
  'Soporte por correo electrónico',
];

const COMMERCIAL_FEATURES = [
  'Todo lo del plan Social, sin límites',
  'Credenciales verificables en Blockchain',
  'Auditoría de uso de beneficios en tiempo real',
  'Votación electrónica segura',
  'Módulo automático de convenios comerciales',
  'Reportes de cumplimiento para auditorías',
  'Panel analítico avanzado con exportación',
  'Soporte prioritario y onboarding dedicado',
];

const PRICING_TIERS = [
  {
    name: 'Micro',
    range: 'Hasta 200 miembros',
    price: '1,5',
    extra: 'Incluido',
    highlight: false,
  },
  {
    name: 'Pequeño',
    range: '201 – 1.000 miembros',
    price: '4',
    extra: '+ 0,02 UF/extra',
    highlight: false,
  },
  {
    name: 'Mediano',
    range: '1.001 – 5.000 miembros',
    price: '10',
    extra: '+ 0,015 UF/extra',
    highlight: true,
  },
  {
    name: 'Masivo',
    range: '5.000+ miembros',
    price: 'Cotizar',
    extra: 'Escala por volumen',
    highlight: false,
  },
];

const FAQ_ITEMS = [
  {
    icon: CreditCard,
    question: '¿Qué incluye el Setup Fee?',
    answer:
      'Cada implementación incluye un pago único desde 10 UF hasta 50 UF (dependiendo de la complejidad) que cubre: configuración inicial de la plataforma, migración de bases de datos existentes, diseño de identidad digital personalizada y capacitación al equipo administrador.',
  },
  {
    icon: CalendarClock,
    question: '¿Cómo funciona la suscripción SaaS?',
    answer:
      'Ofrecemos facturación mensual (ideal para sindicatos y organizaciones pequeñas) o anual con descuento (ideal para municipalidades y grandes corporaciones). Puedes cambiar de plan en cualquier momento sin penalización.',
  },
  {
    icon: Package,
    question: '¿Qué es el Cobro por Evento?',
    answer:
      'Para emisiones masivas puntuales (por ejemplo, renovación anual de 10.000+ credenciales), aplicamos un cargo por evento opcional que se cotiza según volumen. Esto no afecta tu suscripción mensual.',
  },
  {
    icon: Globe,
    question: '¿Qué significa que las credenciales sean Blockchain?',
    answer:
      'En el plan Comercial, cada credencial genera un registro inmutable en blockchain. Esto garantiza que la identidad no pueda ser falsificada, que el historial de uso sea auditable y que cumplan con estándares internacionales de verificación.',
  },
];

/* ─── Component ────────────────────────────────────────── */

export default function PreciosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-brand-500/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] bg-emerald-500/4 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Planes transparentes, sin letra chica
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5">
            El plan perfecto para{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
              tu organización
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Gratuito para juntas de vecinos en todo Chile. Planes comerciales
            con tecnología blockchain para sindicatos, corporaciones y
            municipalidades.
          </p>
        </div>

        {/* ═══════════════ PRICING CARDS ═══════════════ */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-20">
          {/* ── Social Card (Free) ── */}
          <div className="relative group rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.04] to-surface-900/80 backdrop-blur-xl p-8 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Nivel Social</h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Motor de Impacto Social
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-sm text-slate-500">/para siempre</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                100% gratuito para Juntas de Vecinos en Chile. Sin tarjeta de
                crédito ni compromisos.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15 mb-6">
              <QrCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-300 font-medium">
                Credencial Digital Estándar con QR dinámico
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {SOCIAL_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/contacto"
              className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-center transition-all bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center gap-2"
            >
              Comenzar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ── Commercial Card (Premium) ── */}
          <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-brand-400/50 via-purple-500/30 to-brand-500/20 transition-all hover:shadow-xl hover:shadow-brand-500/10">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-b from-brand-500/20 via-purple-500/10 to-transparent rounded-[20px] blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />

            <div className="relative rounded-[15px] bg-gradient-to-b from-brand-900/40 via-surface-900 to-surface-950 backdrop-blur-xl p-8 h-full flex flex-col">
              {/* Popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  Más Popular
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="w-11 h-11 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Nivel Comercial
                  </h3>
                  <p className="text-xs text-brand-400 font-semibold">
                    Premium Blockchain
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">
                    Desde 1,5
                  </span>
                  <span className="text-sm text-slate-400">UF/mes</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Para sindicatos, bienestar de empresas, cajas de compensación
                  y municipalidades.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/15 mb-6">
                <Fingerprint className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="text-xs text-brand-300 font-medium">
                  Credencial Blockchain verificable e inmutable
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {COMMERCIAL_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contacto"
                className="btn-primary w-full py-3.5 px-6 text-sm font-semibold text-center flex items-center justify-center gap-2"
              >
                <span className="relative z-10">Solicitar Demo</span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════ PRICING TABLE ═══════════════ */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">
              Detalle Comercial
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Escala según tu volumen de miembros
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Precios en UF (Unidad de Fomento) para máxima estabilidad.
              Todos los planes comerciales incluyen tecnología blockchain.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-500/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Rango de Miembros
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Precio Mensual
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Miembro Adicional
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {PRICING_TIERS.map((tier) => (
                  <tr
                    key={tier.name}
                    className={`transition-colors hover:bg-brand-500/[0.03] ${
                      tier.highlight
                        ? 'bg-brand-500/[0.04]'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            tier.highlight ? 'text-brand-400' : 'text-white'
                          }`}
                        >
                          {tier.name}
                        </span>
                        {tier.highlight && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/20">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">
                      {tier.range}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-lg font-bold ${
                          tier.highlight ? 'text-brand-400' : 'text-white'
                        }`}
                      >
                        {tier.price === 'Cotizar' ? (
                          <span className="text-sm font-semibold text-slate-300">
                            Cotización personalizada
                          </span>
                        ) : (
                          <>
                            {tier.price}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              UF/mes
                            </span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400">
                      {tier.extra}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`glass-card p-5 ${
                  tier.highlight ? 'border-brand-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        tier.highlight ? 'text-brand-400' : 'text-white'
                      }`}
                    >
                      {tier.name}
                    </span>
                    {tier.highlight && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/20">
                        Recomendado
                      </span>
                    )}
                  </div>
                  {tier.price !== 'Cotizar' ? (
                    <span className="text-lg font-bold text-white">
                      {tier.price}{' '}
                      <span className="text-xs text-slate-400 font-normal">
                        UF/mes
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-300">
                      Cotizar
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{tier.range}</span>
                  <span>{tier.extra}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ KEY DIFFERENTIATORS ═══════════════ */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Lock,
                title: 'Blockchain Inmutable',
                desc: 'Registros a prueba de manipulación.',
                color: 'text-brand-400',
                bg: 'bg-brand-500/10',
              },
              {
                icon: Vote,
                title: 'Votación Electrónica',
                desc: 'Asambleas con quórum verificado.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: BarChart3,
                title: 'Auditoría en Tiempo Real',
                desc: 'Trazabilidad total de beneficios.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Building2,
                title: 'Multi-Organización',
                desc: 'Un panel, múltiples sedes.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="glass-card p-5 group hover:border-brand-500/25"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ FAQ ═══════════════ */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">
              Preguntas Frecuentes
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Todo lo que necesitas saber
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map(({ icon: Icon, question, answer }, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={question}
                  className={`glass-card overflow-hidden transition-all ${
                    isOpen ? 'border-brand-500/25' : ''
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center gap-4 p-5 text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <span className="text-sm font-semibold text-white flex-1">
                      {question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 pl-[68px]">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════ COMPARISON CHIPS ═══════════════ */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <h3 className="text-base font-bold text-white">
                Comparativa rápida
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Social
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                  Comercial
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-3 pr-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Característica
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
                      Social
                    </th>
                    <th className="py-3 pl-4 text-center text-xs font-semibold text-brand-400 uppercase tracking-wider whitespace-nowrap">
                      Comercial
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Credencial digital con QR', true, true],
                    ['Diseñador visual de tarjetas', true, true],
                    ['Panel de administración', true, true],
                    ['Límite de miembros', '1.000', 'Ilimitado'],
                    ['Verificación Blockchain', false, true],
                    ['Votación electrónica', false, true],
                    ['Auditoría de beneficios', false, true],
                    ['Módulo de convenios', false, true],
                    ['Reportes de cumplimiento', false, true],
                    ['Soporte prioritario', false, true],
                  ].map(([feature, social, commercial]) => (
                    <tr
                      key={feature as string}
                      className="hover:bg-brand-500/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4 text-slate-300 text-sm">
                        {feature as string}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {social === true ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : social === false ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {social as string}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        {commercial === true ? (
                          <Check className="w-4 h-4 text-brand-400 mx-auto" />
                        ) : commercial === false ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span className="text-xs font-semibold text-brand-300">
                            {commercial as string}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═══════════════ BOTTOM CTA ═══════════════ */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/10 via-purple-500/5 to-brand-500/10 rounded-[2.5rem] blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900/40 via-surface-900 to-purple-900/20 border border-brand-500/20 p-8 sm:p-12 text-center">
            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-7 h-7 text-brand-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                ¿Necesitas una solución a medida?
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                Para organizaciones con requerimientos específicos de
                integración, volumen o compliance, diseñamos un plan
                personalizado que se adapte exactamente a tu operación.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contacto"
                  className="btn-primary px-8 py-4 text-sm font-semibold flex items-center gap-2"
                >
                  <span className="relative z-10">
                    Hablar con un Especialista
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10" />
                </Link>
                <Link
                  href="/como-funciona"
                  className="btn-secondary px-8 py-4 text-sm"
                >
                  Ver cómo funciona
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ SETUP FEE FOOTNOTE ═══════════════ */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-start justify-center gap-2 text-xs text-slate-500 leading-relaxed">
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-600" />
            <p>
              <strong className="text-slate-400">Nota:</strong> Todas las
              implementaciones del plan Comercial incluyen un Setup Fee único
              desde 10 UF (hasta 50 UF según complejidad) que cubre la
              configuración inicial, migración de datos y diseño de identidad
              digital personalizada. Los precios están expresados en UF
              (Unidad de Fomento) para mantener estabilidad frente a la
              inflación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
