'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, LogOut, Search, Plus, Key } from 'lucide-react';
import { useState } from 'react';

export default function SelectOrganizationPage() {
  const { memberships, switchOrganization, signOut, user, joinByCode } = useAuth();
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (orgId: string) => {
    await switchOrganization(orgId);
    router.push('/dashboard');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    
    setJoining(true);
    setError('');
    const { success, error: joinError } = await joinByCode(accessCode);
    
    if (success) {
      router.push('/dashboard');
    } else {
      setError(joinError || 'Error al unirse');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src="/images/skardkey-icon.png" alt="SkardKey" className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
            <h1 className="text-4xl font-black tracking-tighter gradient-text">SkardKey</h1>
          </div>
          <h2 className="text-2xl font-bold text-white">Bienvenido, {user?.email}</h2>
          <p className="text-slate-400 mt-2">Selecciona la institución con la que deseas trabajar hoy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {memberships.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.org_id)}
              className="group glass-card p-6 text-left hover:border-brand-500/50 transition-all hover:bg-brand-500/5 flex flex-col justify-between h-40"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                  {m.organizations?.logo_url ? (
                    <img src={m.organizations.logo_url} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <Building2 className="w-6 h-6 text-brand-500" />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                  m.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                  m.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  m.role === 'auditor' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {m.role === 'owner' ? 'Propietario' : 
                   m.role === 'admin' ? 'Administrador' : 
                   m.role === 'auditor' ? 'Auditor' :
                   m.role === 'validator' ? 'Validador' :
                   m.role === 'viewer' ? 'Visualizador' : m.role}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                  {m.organizations?.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{m.organizations?.org_type || 'Organización'}</span>
                  <ArrowRight className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center border-t border-white/5 pt-8">
          <button
            onClick={() => signOut().then(() => router.push('/login'))}
            className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión e ingresar con otra cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
