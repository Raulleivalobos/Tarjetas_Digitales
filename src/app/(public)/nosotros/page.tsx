import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users, Building2, Briefcase, Landmark,
  Target, Eye, ShieldCheck, FileText, Rocket, Heart,
  ChevronRight, Sparkles, CheckCircle2, ArrowRight, Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | SkardKey - Identidad Digital Inteligente en Chile',
  description:
    'Conoce SkardKey: plataforma tecnológica dedicada a transformar la gestión de organizaciones mediante identidad digital inteligente, credenciales QR y tecnología Blockchain en Chile.',
};

const REASONS = [
  {
    icon: Heart,
    title: 'Impacto Social y Comunitario Real',
    description:
      'Creemos en el poder de la tecnología como motor de cambio social. Por ello, ofrecemos nuestro servicio de forma 100% gratuita para las Juntas de Vecinos de Chile, permitiendo que las organizaciones comunitarias accedan a herramientas de nivel profesional sin barreras económicas.',
    color: 'emerald',
  },
  {
    icon: FileText,
    title: 'Preparados para la Ley de Transformación Digital',
    description:
      'Apoyamos activamente el cumplimiento de la Ley N° 21.180 (Cero Papel), facilitando que las Corporaciones Municipales e instituciones del Estado migren sus padrones de subsidios y atenciones sociales hacia un formato íntegramente electrónico y auditable en tiempo real.',
    color: 'blue',
  },
  {
    icon: ShieldCheck,
    title: 'Trazabilidad y Seguridad Avanzada con Blockchain',
    description:
      'Nuestra infraestructura no solo resuelve las necesidades actuales de emisión de credenciales y escaneo QR, sino que está construida sobre bases tecnológicas preparadas para el futuro (Web3), garantizando que los datos de bienestar, membresías y validaciones cuenten con los más altos estándares de inmutabilidad.',
    color: 'amber',
  },
];

const SECTORS = [
  {
    icon: Users,
    name: 'Juntas de Vecinos',
    description: 'Modernización de padrones territoriales y control de beneficios vecinales.',
    href: '/como-funciona?tab=vecinos',
    color: 'emerald',
  },
  {
    icon: Building2,
    name: 'Sindicatos y Asociaciones',
    description: 'Gestión de asambleas, control de asistencia mediante QR y comunicación directa.',
    href: '/como-funciona?tab=sindicatos',
    color: 'amber',
  },
  {
    icon: Briefcase,
    name: 'Bienestar de Empresas',
    description: 'Trazabilidad absoluta en la entrega de convenios, bonos corporativos y beneficios internos.',
    href: '/como-funciona?tab=bienestar',
    color: 'blue',
  },
  {
    icon: Landmark,
    name: 'Corporaciones Municipales',
    description: 'Optimización logística de programas sociales, asignación de subsidios y atenciones en terreno.',
    href: '/como-funciona?tab=municipios',
    color: 'indigo',
  },
];

const colorMap: Record<string, { icon: string; bg: string; border: string; glow: string }> = {
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
  indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#020617]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/4 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ═══════════════ HERO SECTION ═══════════════ */}
        <section className="mb-20 animate-fade-in">
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Sobre SkardKey
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              Redefiniendo la{' '}
              <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
                Identidad Digital Inteligente
              </span>{' '}
              en Chile
            </h1>
          </div>

          {/* Hero Image */}
          <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 mb-10">
            <Image
              src="/images/skardkey-about-hero.png"
              alt="SkardKey - Identidad Digital y Beneficios"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/40 to-transparent" />
          </div>

          {/* Intro paragraphs */}
          <div className="max-w-4xl mx-auto space-y-5">
            <p className="text-lg text-slate-300 leading-relaxed text-justify hyphens-auto">
              En SkardKey, somos una plataforma tecnológica dedicada a transformar la gestión de
              organizaciones y empresas a través de soluciones avanzadas de identidad digital
              inteligente y administración de beneficios. Nacimos con el propósito de erradicar la
              burocracia, optimizar los procesos de auditoría interna y acelerar la modernización
              comunitaria y corporativa en Chile.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed text-justify hyphens-auto">
              Desarrollamos un ecosistema robusto que conecta a instituciones con sus miembros de
              manera segura, transparente y eficiente. Mediante el uso de credenciales con códigos QR
              dinámicos y arquitectura preparada para la descentralización con tecnología Blockchain,
              elevamos el estándar de control, auditoría logística y seguridad de la información.
            </p>
          </div>
        </section>

        {/* ═══════════════ MISIÓN & VISIÓN ═══════════════ */}
        <section className="mb-24 grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Misión */}
          <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-surface-900/80 to-surface-950/60 border border-white/[0.06] hover:border-brand-500/20 transition-all duration-500 overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Nuestra Misión</h2>
              </div>

              <blockquote className="text-slate-300 leading-relaxed text-justify hyphens-auto border-l-2 border-brand-500/30 pl-5 italic">
                &ldquo;Nuestra misión es acelerar la transformación digital en Chile proporcionando a
                comunidades, sindicatos, departamentos de bienestar y corporaciones municipales una
                herramienta de identidad digital accesible y de alta seguridad. Nos comprometemos a
                profesionalizar la gestión social y corporativa, eliminando el uso de papel, reduciendo
                duplicidades y asegurando que cada beneficio llegue de forma transparente a quien
                realmente le corresponde.&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Visión */}
          <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-surface-900/80 to-surface-950/60 border border-white/[0.06] hover:border-purple-500/20 transition-all duration-500 overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Nuestra Visión</h2>
              </div>

              <blockquote className="text-slate-300 leading-relaxed text-justify hyphens-auto border-l-2 border-purple-500/30 pl-5 italic">
                &ldquo;Nos proyectamos como la plataforma líder de identidad digital y Web3 en
                Latinoamérica, reconocidos por democratizar el acceso a tecnología de clase mundial.
                Aspiramos a ser el estándar de verificación e inmutabilidad de datos en el ecosistema
                corporativo y gubernamental, impulsando comunidades más conectadas, seguras y
                preparadas para los desafíos del futuro digital.&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* ═══════════════ ¿POR QUÉ ELEGIR SKARDKEY? ═══════════════ */}
        <section className="mb-24 animate-fade-in">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2 block">
              Ventajas Competitivas
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              ¿Por qué elegir la plataforma{' '}
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                SkardKey
              </span>
              ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REASONS.map((reason, index) => {
              const colors = colorMap[reason.color];
              const Icon = reason.icon;
              return (
                <div
                  key={index}
                  className={`group relative p-7 rounded-3xl bg-gradient-to-br from-surface-900/80 to-surface-950/60 border border-white/[0.06] hover:${colors.border} transition-all duration-500 overflow-hidden`}
                >
                  {/* Number badge */}
                  <div className="absolute top-5 right-5 text-6xl font-black text-white/[0.03] select-none leading-none">
                    {index + 1}
                  </div>

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-3">{reason.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed text-justify hyphens-auto">
                      {reason.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════ SECTORES QUE IMPULSAMOS ═══════════════ */}
        <section className="mb-24 animate-fade-in">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2 block">
              Alcance e Impacto
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Sectores que{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-brand-400 bg-clip-text text-transparent">
                impulsamos
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SECTORS.map((sector, index) => {
              const colors = colorMap[sector.color];
              const Icon = sector.icon;
              return (
                <Link
                  key={index}
                  href={sector.href}
                  className={`group relative p-6 rounded-2xl bg-surface-900/60 border border-white/[0.06] hover:${colors.border} transition-all duration-300 hover:scale-[1.02] block`}
                >
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{sector.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{sector.description}</p>

                  <span className={`text-xs font-semibold ${colors.icon} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                    Ver solución <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ═══════════════ CTA FINAL ═══════════════ */}
        <section className="animate-fade-in">
          <div className="relative p-10 md:p-14 rounded-3xl bg-gradient-to-br from-brand-500/10 via-surface-900/80 to-purple-500/10 border border-brand-500/15 overflow-hidden text-center">
            {/* Glows */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/8 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-7 h-7 text-brand-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                ¿Listo para transformar tu organización?
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                Únete a las organizaciones que ya confían en SkardKey para digitalizar sus procesos,
                emitir credenciales inteligentes y gestionar beneficios con total transparencia.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contacto"
                  className="px-8 py-3.5 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 flex items-center gap-2"
                >
                  Contactar al equipo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/como-funciona"
                  className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  Ver cómo funciona
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
