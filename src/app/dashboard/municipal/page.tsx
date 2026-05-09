'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Gift, 
  BarChart3, 
  Map as MapIcon, 
  TrendingUp,
  ArrowUpRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function MunicipalDashboard() {
  const { organization, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJJVV: 0,
    totalBeneficiaries: 0,
    totalCards: 0,
    totalBenefits: 0,
    totalAttendance: 0,
  });
  const [jjvvList, setJJVVList] = useState<any[]>([]);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (!authLoading && organization) {
      fetchMunicipalData();
    }
  }, [authLoading, organization]);

  const fetchMunicipalData = async () => {
    if (!organization) return;
    setLoading(true);

    try {
      // 1. Fetch all linked JJVV
      const { data: jjvvData } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, created_at')
        .eq('parent_org_id', organization.id);

      if (!jjvvData || jjvvData.length === 0) {
        setLoading(false);
        return;
      }

      const jjvvIds = jjvvData.map(j => j.id);
      setJJVVList(jjvvData);

      // 2. Fetch aggregate stats
      // Beneficiaries
      const { count: beneficiaryCount } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true })
        .in('org_id', jjvvIds);

      // Cards
      const { count: cardCount } = await supabase
        .from('digital_cards')
        .select('*', { count: 'exact', head: true })
        .in('org_id', jjvvIds);

      // Benefits
      const { count: benefitCount } = await supabase
        .from('benefit_assignments')
        .select('*', { count: 'exact', head: true })
        .in('org_id', jjvvIds)
        .eq('status', 'used');

      // Attendance
      const { count: attendanceCount } = await supabase
        .from('meeting_attendance')
        .select('*', { count: 'exact', head: true })
        .in('org_id', jjvvIds);

      setStats({
        totalJJVV: jjvvData.length,
        totalBeneficiaries: beneficiaryCount || 0,
        totalCards: cardCount || 0,
        totalBenefits: (benefitCount || 0) + (attendanceCount || 0),
        totalAttendance: attendanceCount || 0,
      });

    } catch (err) {
      console.error('Error fetching municipal data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />)}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Consola Municipal</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Panel de Inteligencia Territorial</h1>
          <p className="text-slate-500 text-sm mt-1">Supervisión estadística de organizaciones sociales en la comuna.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase">Suscripción Municipal Activa</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-solid p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">JJVV Adscritas</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white">{stats.totalJJVV.toLocaleString('es-CL')}</h2>
            <span className="text-emerald-400 text-xs font-bold flex items-center"><ArrowUpRight className="w-3 h-3" /> +2 este mes</span>
          </div>
        </div>

        <div className="glass-card-solid p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-brand-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Vecinos Digitalizados</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white">{stats.totalBeneficiaries.toLocaleString('es-CL')}</h2>
          </div>
        </div>

        <div className="glass-card-solid p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tarjetas Emitidas</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white">{stats.totalCards.toLocaleString('es-CL')}</h2>
          </div>
        </div>

        <div className="glass-card-solid p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Gift className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Beneficios Entregados</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-white">{stats.totalBenefits.toLocaleString('es-CL')}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Map Placeholder */}
          <div className="glass-card-solid p-8 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500/5 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
             <MapIcon className="w-16 h-16 text-indigo-500/20 mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">Mapa de Calor Territorial</h3>
             <p className="text-slate-500 max-w-sm text-sm">Visualización geográfica de la adopción de SkardKey en la comuna. Próximamente disponible con integración GIS.</p>
          </div>

          {/* JJVV List */}
          <div className="glass-card-solid overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Directorio de Organizaciones
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar JJVV..." className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-48 transition-all focus:w-64" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Organización</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Fecha Adhesión</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {jjvvList.map(j => (
                    <tr key={j.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                            {j.logo_url ? <img src={j.logo_url} className="w-full h-full object-contain" /> : <Building2 className="w-4 h-4 text-slate-600" />}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{j.name}</p>
                            <p className="text-xs text-slate-500">/{j.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">Activa</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        {new Date(j.created_at).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar / Upsell */}
        <div className="space-y-6">
          <div className="glass-card-solid p-8 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-4 opacity-5">
              <Zap className="w-24 h-24 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Módulo de Gestión
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Activa la capacidad de emitir tus propias credenciales municipales y certificados oficiales desde esta misma plataforma.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Emisión de Tarjeta Vecino',
                'Certificados Municipales',
                'Gestión de Subsidios Propios',
                'Control de Acceso a Eventos'
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs font-bold text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              Activar Plan Municipal
            </button>
          </div>

          <div className="glass-card-solid p-6 space-y-4">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Alertas de Gestión
             </h4>
             <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white">Adopción Creciente</p>
                <p className="text-[10px] text-slate-500 leading-tight">Las Juntas de Vecinos han aumentado su digitalización en un 15% este trimestre.</p>
             </div>
             <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white">Zonas de Sombra</p>
                <p className="text-[10px] text-slate-500 leading-tight">El Sector Norponiente presenta baja actividad. Considerar campaña de enrolamiento.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
