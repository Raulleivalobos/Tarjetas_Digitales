'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gift,
  QrCode,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  Palette,
  ClipboardList,
  FileText,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, membership, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMunicipalRole = ['municipal_admin', 'municipal_viewer'].includes(membership?.role || '');
  const isMunicipalOrg = organization?.org_type === 'municipality';
  const isMunicipal = isMunicipalOrg || isMunicipalRole;

  const navigation = [
    // Si es municipal, el Panel Municipal es su pantalla principal de entrada
    ...(isMunicipal ? [
      { name: 'Panel Municipal', href: '/dashboard/municipal', icon: Building2 },
    ] : [
      { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
    ]),
    
    // Solo mostrar herramientas operativas si NO es un perfil puramente municipal
    ...(!isMunicipal ? [
      { name: 'Diseños', href: '/dashboard/designs', icon: Palette },
      { name: 'Beneficiarios', href: '/dashboard/beneficiaries', icon: Users },
      { name: 'Tarjetas', href: '/dashboard/cards', icon: CreditCard },
      { name: 'Certificados', href: '/dashboard/certificates', icon: FileText },
      { name: 'Beneficios', href: '/dashboard/benefits', icon: Gift },
      { name: 'Asistencia', href: '/dashboard/attendance', icon: ClipboardList },
      { name: 'Validar QR', href: '/dashboard/scanner', icon: QrCode },
      { name: 'Emitir', href: '/dashboard/issue', icon: Upload },
    ] : []),
    
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (isMunicipal && (pathname === '/dashboard' || !['/dashboard/municipal', '/dashboard/settings'].includes(pathname))) {
        // Redirigir a perfiles municipales a su panel específico si intentan entrar a áreas JJVV o al dashboard base
        router.push('/dashboard/municipal');
      }
    }
  }, [user, loading, router, isMunicipal, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 glass-sidebar transform transition-transform duration-300 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-brand-500/10">
            <Link href="/dashboard" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-brand-500/40 transition-all">
                <img 
                  src="/images/skardkey-icon.png" 
                  alt="SkardKey" 
                  className="w-full h-full object-contain scale-[1.5] drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter gradient-text leading-none text-white">SkardKey</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1 font-bold">Admin Console</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg btn-ghost"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization info */}
          {organization && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-brand-500/5 border border-brand-500/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center overflow-hidden">
                  {organization.logo_url ? (
                    <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-4 h-4 text-brand-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {organization.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    /{organization.slug}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-brand-500/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-brand-500/10">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar - Mobile */}
        <header className="lg:hidden glass-nav sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl btn-ghost"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <img src="/images/skardkey-icon.png" alt="SkardKey" className="w-10 h-10 object-contain" />
            <span className="font-bold gradient-text tracking-tight">SkardKey</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
