import Link from 'next/link';
import {
  ArrowLeft,
  ScrollText,
  Target,
  UserCheck,
  ShieldCheck,
  KeyRound,
  ServerCrash,
  Scale,
} from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | SkardKey',
  description:
    'Términos y Condiciones de uso de la plataforma SkardKey para la emisión y verificación de identidades digitales.',
};

const SECTIONS = [
  {
    id: 'objeto',
    number: '01',
    title: 'Objeto',
    icon: Target,
    content:
      'Los presentes Términos y Condiciones regulan el acceso, navegación y uso del sitio web oficial www.skardkey.cl y de la plataforma de software para la emisión y verificación de identidades digitales de SkardKey. Todo usuario acepta estos términos de forma irrevocable al utilizar el Sitio.',
  },
  {
    id: 'edad-y-capacidad',
    number: '02',
    title: 'Requisitos de Edad y Capacidad',
    icon: UserCheck,
    content: null,
    subsections: [
      {
        subtitle: 'Emisores',
        text: 'Deben ser mayores de 18 años y contar con las facultades legales necesarias para contratar servicios en nombre de sus respectivas organizaciones.',
      },
      {
        subtitle: 'Beneficiarios',
        text: 'La plataforma está dirigida a usuarios de al menos 16 años de edad. En caso de incorporarse menores de esa edad, la organización Emisora será la única responsable de obtener de forma previa el consentimiento verificado de los padres o tutores legales.',
      },
    ],
  },
  {
    id: 'propiedad-intelectual',
    number: '03',
    title: 'Propiedad Intelectual y Restricciones',
    icon: ShieldCheck,
    content:
      'Todo el contenido, soluciones lógicas, interfaces, marcas, logotipos, código fuente y código objeto del Sitio son propiedad exclusiva de SkardKey. Queda estrictamente prohibido intentar realizar ingeniería inversa, descompilar, duplicar o explotar comercialmente cualquier sección de la plataforma sin autorización expresa y por escrito.',
  },
  {
    id: 'responsabilidad-cuentas',
    number: '04',
    title: 'Responsabilidad de las Cuentas',
    icon: KeyRound,
    content:
      'El Emisor es responsable exclusivo de mantener la estricta confidencialidad de su cuenta y contraseña de acceso corporativa. SkardKey no responderá por perjuicios ocasionados debido a la suplantación de identidad generada por descuidos en la seguridad del lado del Usuario.',
  },
  {
    id: 'limitacion-responsabilidad',
    number: '05',
    title: 'Limitación de Responsabilidad Tecnológica',
    icon: ServerCrash,
    content:
      'SkardKey no se hace responsable por interrupciones puntuales del servicio derivadas de casos fortuitos, fuerza mayor, ataques cibernéticos externos distribuidos o por la inexactitud de los datos que los Emisores decidan registrar para la creación de credenciales.',
  },
  {
    id: 'ley-aplicable',
    number: '06',
    title: 'Ley Aplicable y Jurisdicción',
    icon: Scale,
    content:
      'Este acuerdo se rige en su totalidad por las leyes de la República de Chile. Para cualquier controversia legal, las partes fijan su domicilio en la ciudad de Santiago de Chile y se someten a la competencia de sus Tribunales Ordinarios de Justicia.',
  },
];

export default function TerminosYCondicionesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#020617]">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 font-medium mb-4">
            <ScrollText className="w-3.5 h-3.5 text-brand-400" />
            Versión 1.0 — 28 de mayo de 2026
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Términos y{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
              Condiciones
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed">
            Los presentes términos regulan el acceso y uso de la plataforma
            SkardKey. Al utilizar nuestros servicios, aceptas íntegramente las
            siguientes disposiciones.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 stagger-children">
          {SECTIONS.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.id}
                id={section.id}
                className="glass-card p-6 sm:p-8"
              >
                {/* Section header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest text-brand-400 font-bold block mb-1">
                      Artículo {section.number}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Section content */}
                {section.content && (
                  <p className="text-sm text-slate-400 leading-relaxed pl-14">
                    {section.content}
                  </p>
                )}

                {/* Subsections */}
                {section.subsections && (
                  <div className="pl-14 space-y-4 mt-2">
                    {section.subsections.map((sub) => (
                      <div
                        key={sub.subtitle}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <h3 className="text-sm font-semibold text-white mb-1.5">
                          {sub.subtitle}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {sub.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer metadata */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface-900 border border-white/5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Versión 1.0 — Última actualización: 28 de mayo de 2026
          </div>
          <p className="text-xs text-slate-600 mt-4">
            © {new Date().getFullYear()} SkardKey SpA. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
