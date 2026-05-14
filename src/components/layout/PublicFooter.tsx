import Link from 'next/link';
import {
  CreditCard,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';

const PRODUCT_LINKS = [
  { href: '/como-funciona', label: 'Cómo Funciona' },
  { href: '/precios', label: 'Planes y Precios' },
  { href: '/login', label: 'Acceder al Dashboard' },
];

const SOLUTION_LINKS = [
  { href: '/soluciones/juntas-de-vecinos', label: 'Juntas de Vecinos' },
  { href: '/soluciones/bienestar-empresas', label: 'Bienestar de Empresas' },
  { href: '/soluciones/sindicatos', label: 'Sindicatos' },
  { href: '/soluciones/corporaciones-municipales', label: 'Corporaciones Municipales' },
];

const COMPANY_LINKS = [
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
];

const LEGAL_LINKS = [
  { href: '/privacidad', label: 'Política de Privacidad' },
  { href: '/terminos', label: 'Términos y Condiciones' },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-surface-950 border-t border-brand-500/10 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* CTA Banner */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-brand-600/5 border border-brand-500/15 p-8 md:p-12">
          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              ¿Listo para digitalizar tu organización?
            </h3>
            <p className="text-slate-400 mb-6 text-sm md:text-base">
              Únete a las organizaciones que ya gestionan identidad digital inteligente con SkardKey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contacto"
                className="btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2"
              >
                <span className="relative z-10">Solicitar Demo Gratis</span>
                <ChevronRight className="w-4 h-4 relative z-10" />
              </Link>
              <Link
                href="/como-funciona"
                className="btn-secondary px-6 py-3 text-sm"
              >
                Ver cómo funciona
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-4 mb-8 group">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-brand-500/30 transition-all">
                <img 
                  src="/images/skardkey-icon.png" 
                  alt="SkardKey" 
                  className="w-full h-full object-contain scale-[1.6] drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tighter leading-none">Skard<span className="text-brand-400">Key</span></span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-brand-400 mt-1 font-bold">Identidad Digital & Beneficios</span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Plataforma de identidad digital inteligente para organizaciones sociales y empresas.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>contacto@skardkey.cl</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>+56 9 51495297</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Santiago, Chile</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Producto</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-slate-500 hover:text-brand-300 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Soluciones</h4>
            <ul className="space-y-2.5">
              {SOLUTION_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-slate-500 hover:text-brand-300 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Empresa</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-slate-500 hover:text-brand-300 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-slate-500 hover:text-brand-300 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-brand-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {currentYear} SkardKey. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-700">
            Construido con tecnología de clase mundial 🚀
          </p>
        </div>
      </div>
    </footer>
  );
}
