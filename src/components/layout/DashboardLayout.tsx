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
  Search,
  Key,
  Lock,
  Save,
  AlertCircle,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, membership, memberships, switchOrganization, searchAndJoinOrganization, joinByCode, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user && user.user_metadata?.force_password_change) {
      setShowForcePassword(true);
    }
  }, [user]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setUpdatingPassword(true);
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    try {
      // 1. Actualizar contraseña
      const { error: pwdError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (pwdError) throw pwdError;

      // 2. Limpiar el flag de force_password_change
      const { error: metaError } = await supabase.auth.updateUser({
        data: { force_password_change: false }
      });

      if (metaError) throw metaError;

      setShowForcePassword(false);
      alert('Contraseña actualizada con éxito');
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setUpdatingPassword(false);
    }
  };

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
    
    // Solo mostrar herramientas operativas si NO es un perfil puramente municipal o de lectura
    ...(!isMunicipal && !['viewer', 'auditor'].includes(membership?.role || '') ? [
      { name: 'Diseños', href: '/dashboard/designs', icon: Palette },
      { name: 'Beneficiarios', href: '/dashboard/beneficiaries', icon: Users },
      { name: 'Tarjetas', href: '/dashboard/cards', icon: CreditCard },
      { name: 'Certificados', href: '/dashboard/certificates', icon: FileText },
      { name: 'Beneficios', href: '/dashboard/benefits', icon: Gift },
      { name: 'Asistencia', href: '/dashboard/attendance', icon: ClipboardList },
      { name: 'Validar QR', href: '/dashboard/scanner', icon: QrCode },
      { name: 'Emitir', href: '/dashboard/issue', icon: Upload },
    ] : []),

    // Secciones para Auditor / Visualizador (Acceso a listas pero no a herramientas de edición/escaneo)
    ...(['viewer', 'auditor'].includes(membership?.role || '') ? [
      { name: 'Beneficiarios', href: '/dashboard/beneficiaries', icon: Users },
      { name: 'Certificados', href: '/dashboard/certificates', icon: FileText },
      { name: 'Beneficios', href: '/dashboard/benefits', icon: Gift },
      { name: 'Asistencia', href: '/dashboard/attendance', icon: ClipboardList },
    ] : []),
    
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!organization && memberships.length > 0 && pathname !== '/dashboard/select') {
        // Si hay membresías pero ninguna activa (ej: recién logueado con múltiples orgs), ir a selección
        router.push('/dashboard/select');
      } else if (isMunicipal && (pathname === '/dashboard' || !['/dashboard/municipal', '/dashboard/settings', '/dashboard/select'].includes(pathname))) {
        // Redirigir a perfiles municipales a su panel específico
        router.push('/dashboard/municipal');
      }
    }
  }, [user, loading, router, isMunicipal, pathname, organization, memberships.length]);

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

          {/* Organization Info - Active context set from login */}
          {organization && (
            <div className="p-6 border-b border-brand-500/10 bg-brand-500/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                  {organization.logo_url ? (
                    <img src={organization.logo_url} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <Building2 className="w-6 h-6 text-brand-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate leading-tight">{organization.name}</h2>
                  <p className="text-[10px] text-brand-400 font-mono uppercase tracking-widest mt-1">
                    {organization.org_type === 'municipality' ? 'Municipalidad' : 'Junta de Vecinos'}
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
                <p className="text-xs text-slate-500">
                  {membership?.role === 'owner' ? 'Propietario' : 
                   membership?.role === 'admin' ? 'Administrador' : 
                   membership?.role === 'auditor' ? 'Auditor' :
                   membership?.role === 'validator' ? 'Validador' :
                   membership?.role === 'viewer' ? 'Visualizador' : 'Usuario'}
                </p>
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
      {/* Force Password Change Modal */}
      {showForcePassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/90 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                <Key className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Actualiza tu contraseña</h2>
              <p className="text-slate-400 text-sm mt-2">
                Por seguridad, debes cambiar tu clave temporal por una nueva antes de continuar.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Al menos 6 caracteres"
                    className="glass-input w-full pl-10 pr-4 py-3 text-sm"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="glass-input w-full pl-10 pr-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {updatingPassword ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Actualizar y Entrar
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-slate-500 hover:text-slate-400 text-xs font-medium transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// End of file
