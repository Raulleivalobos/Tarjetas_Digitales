import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Globe,
  Handshake,
  FileText,
  Lock,
  Database,
  ShieldAlert,
  CalendarClock,
} from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | SkardKey',
  description:
    'Política de Privacidad y Acuerdo de Confidencialidad y Protección de Datos Personales (DPA) de la plataforma SkardKey.',
};

const RETENTION_ITEMS = [
  {
    id: 'retencion',
    title: 'Retención de Datos',
    icon: Clock,
    content:
      'Los datos personales se conservan únicamente mientras se mantenga vigente la relación contractual con la institución emisora o durante el periodo necesario para cumplir con los fines del tratamiento. Los datos de contacto de consultas pasadas se eliminarán de forma segura transcurridos 2 años desde su captura.',
  },
  {
    id: 'transferencias',
    title: 'Transferencias Internacionales y Terceros',
    icon: Globe,
    content:
      'SkardKey no vende, cede ni comercializa bases de datos personales. El almacenamiento se realiza en servidores seguros que cumplen con certificaciones de seguridad equivalentes (tales como ISO/IEC 27001 o SOC 2).',
  },
];

const DPA_CLAUSES = [
  {
    id: 'primera',
    number: '01',
    title: 'Primera — Objeto',
    icon: FileText,
    content:
      'Garantizar la máxima reserva, secreto profesional y protección de los datos personales (nombres, RUN, correos electrónicos, datos institucionales) que el Responsable ponga a disposición de SkardKey para la provisión del servicio de emisión, gestión y validación de identidades digitales.',
  },
  {
    id: 'segunda',
    number: '02',
    title: 'Segunda — Obligaciones del Procesador',
    icon: Lock,
    content: null,
    obligations: [
      'Utilizar los datos personales única y exclusivamente para cumplir con las funcionalidades del servicio contratado.',
      'No ceder, vender, transferir ni divulgar bajo ninguna circunstancia las bases de datos a terceras personas.',
      'Mantener el deber de secreto profesional respecto de toda la información manejada, incluso después de terminada la vigencia del contrato de servicios.',
    ],
  },
  {
    id: 'tercera',
    number: '03',
    title: 'Tercera — Propiedad de las Bases de Datos',
    icon: Database,
    content:
      'La base de datos es propiedad exclusiva del Responsable. SkardKey actúa estrictamente como un Procesador Técnico de Datos. En cualquier momento, el Responsable podrá solicitar la exportación de sus datos o la eliminación integral de sus registros.',
  },
  {
    id: 'cuarta',
    number: '04',
    title: 'Cuarta — Estándares de Seguridad',
    icon: ShieldAlert,
    content:
      'Medidas técnicas implementadas incluyendo cifrado fuerte en tránsito y reposo, y arquitectura de privacidad por diseño que evita la exposición pública de datos personales sensibles.',
  },
  {
    id: 'quinta',
    number: '05',
    title: 'Quinta — Vigencia',
    icon: CalendarClock,
    content:
      'Las obligaciones tendrán duración indefinida mientras los datos personales del Responsable permanezcan almacenados o procesados dentro de los entornos de SkardKey.',
  },
];

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#020617]">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
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
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Versión 1.0 — 28 de mayo de 2026
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Política de{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-300 bg-clip-text text-transparent">
              Privacidad
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed">
            Conoce cómo SkardKey protege, almacena y gestiona los datos
            personales confiados a nuestra plataforma de identidades digitales.
          </p>
        </div>

        {/* ═══════════════ SECTION A ═══════════════ */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
            <span className="text-[10px] uppercase tracking-widest text-brand-400 font-bold px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
              Sección A
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-8 animate-fade-in">
            Plazos de Conservación y Transferencias
          </h2>

          <div className="space-y-6 stagger-children">
            {RETENTION_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.id} className="glass-card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════ SECTION B: DPA ═══════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              Sección B — DPA
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          </div>

          <div className="text-center mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-3">
              Acuerdo de Confidencialidad y Protección de Datos Personales
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Celebrado entre{' '}
              <span className="text-white font-medium">
                SkardKey
              </span>{' '}
              (&quot;Procesador&quot; o &quot;Encargado&quot;) y la{' '}
              <span className="text-white font-medium">Entidad Cliente</span>{' '}
              (&quot;Responsable&quot;).
            </p>
          </div>

          <div className="space-y-6 stagger-children">
            {DPA_CLAUSES.map((clause) => {
              const Icon = clause.icon;

              return (
                <section
                  key={clause.id}
                  id={clause.id}
                  className="glass-card p-6 sm:p-8"
                >
                  {/* Clause header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold block mb-1">
                        Cláusula {clause.number}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {clause.title}
                      </h3>
                    </div>
                  </div>

                  {/* Clause content */}
                  {clause.content && (
                    <p className="text-sm text-slate-400 leading-relaxed pl-14">
                      {clause.content}
                    </p>
                  )}

                  {/* Obligations list */}
                  {clause.obligations && (
                    <div className="pl-14 space-y-3 mt-2">
                      {clause.obligations.map((obligation, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                        >
                          <span className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-[10px] font-bold border border-purple-500/20 shrink-0 mt-0.5">
                            {String.fromCharCode(97 + i)}
                          </span>
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {obligation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* Footer metadata */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface-900 border border-white/5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Versión 1.0 — Última actualización: 28 de mayo de 2026
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
            <Link
              href="/terminos-y-condiciones"
              className="hover:text-brand-400 transition-colors"
            >
              Términos y Condiciones
            </Link>
            <span>·</span>
            <span>
              © {new Date().getFullYear()} SkardKey SpA. Todos los derechos
              reservados.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
