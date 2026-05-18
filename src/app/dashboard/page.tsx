'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatDateTime } from '@/lib/utils';
import {
  Users,
  CreditCard,
  Gift,
  CheckCircle,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  Zap,
  FileText,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy-load Recharts — it's ~150KB gzipped. Load only when the dashboard mounts.
const LazyAreaChart = dynamic(() => import('recharts').then(mod => {
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
  // Return a wrapper component
  return { default: function DashboardAreaChart({ data }: { data: any[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBeneficiarios" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBeneficios" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#475569" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#64748b', fontStyle: 'normal', fontWeight: 'bold' }} 
          />
          <YAxis 
            stroke="#475569" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#64748b', fontStyle: 'normal', fontWeight: 'bold' }}
          />
          <Tooltip
            formatter={(value: number) => value.toLocaleString('es-CL')}
            contentStyle={{
              background: 'rgba(2, 6, 23, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              color: '#e2e8f0',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Area type="monotone" dataKey="beneficiarios" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBeneficiarios)" />
          <Area type="monotone" dataKey="beneficios" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBeneficios)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }};
}), { ssr: false, loading: () => <div className="h-72 skeleton rounded-xl" /> });

const LazyPieChart = dynamic(() => import('recharts').then(mod => {
  const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = mod;
  return { default: function DashboardPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
              color: '#e2e8f0',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }};
}), { ssr: false, loading: () => <div className="h-48 skeleton rounded-xl" /> });

interface DashboardData {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  activeCards: number;
  totalBenefits: number;
  benefitsUsed: number;
  benefitsPending: number;
  recentActivity: Array<{
    id: string;
    action: string;
    result: string;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
  recentBeneficiaries: Array<{
    id: string;
    full_name: string;
    rut: string;
    status: string;
    created_at: string;
  }>;
  recentCertificates: Array<{
    id: string;
    folio: number;
    type: string;
    status: string;
    created_at: string;
    cost: number;
    resident_data?: any;
    beneficiaries?: { full_name: string };
  }>;
}

// Mock chart data for demo
const chartData = [
  { name: 'Ene', beneficiarios: 24, beneficios: 12 },
  { name: 'Feb', beneficiarios: 35, beneficios: 18 },
  { name: 'Mar', beneficiarios: 52, beneficios: 28 },
  { name: 'Abr', beneficiarios: 78, beneficios: 45 },
  { name: 'May', beneficiarios: 95, beneficios: 62 },
  { name: 'Jun', beneficiarios: 120, beneficios: 78 },
];

const statusData = [
  { name: 'Activos', value: 75, color: '#34d399' },
  { name: 'Inactivos', value: 15, color: '#94a3b8' },
  { name: 'Bloqueados', value: 10, color: '#f87171' },
];

const roleDescriptions: Record<string, { title: string }> = {
  owner: { title: 'Propietario' },
  admin: { title: 'Administrador' },
  validator: { title: 'Validador' },
  viewer: { title: 'Visualizador' },
  auditor: { title: 'Auditor' },
  municipal_admin: { title: 'Admin Municipal' },
  municipal_viewer: { title: 'Observador Municipal' },
};

export default function DashboardPage() {
  const { organization, membership } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const role = membership?.role || 'viewer';
  const isAdmin = ['owner', 'admin', 'auditor'].includes(role);
  const isValidator = role === 'validator';
  const isViewer = role === 'viewer';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Timeout: if Supabase doesn't respond in 8s, show the dashboard with empty data
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Dashboard data fetch timeout')), 8000)
        );

        const dataFetch = Promise.allSettled([
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('digital_cards').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'used'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'pending'),
          supabase.from('validation_logs').select('*').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('beneficiaries').select('id, full_name, rut, status, created_at').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('certificates').select('*, beneficiaries(full_name)').eq('org_id', organization.id).order('folio', { ascending: false }).limit(3),
        ]);

        const results = await Promise.race([dataFetch, timeout]);

        const getValue = (idx: number, key: 'count' | 'data' = 'count') => {
          const res = results[idx];
          return res.status === 'fulfilled' ? (res.value as any)[key] : null;
        };

        setData({
          totalBeneficiaries: getValue(0) || 0,
          activeBeneficiaries: getValue(1) || 0,
          activeCards: getValue(2) || 0,
          totalBenefits: getValue(3) || 0,
          benefitsUsed: getValue(4) || 0,
          benefitsPending: getValue(5) || 0,
          recentActivity: getValue(6, 'data') || [],
          recentBeneficiaries: getValue(7, 'data') || [],
          recentCertificates: getValue(8, 'data') || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organization?.id]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">
            {isValidator ? 'Módulo de Operación' : 'Panel de Control'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest uppercase">Sistema Online</span>
            </div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
               Perfil: {roleDescriptions[role]?.title || role}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-brand-400" />
            <span>Última Sincronización: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3 text-brand-400" />
            <span className="truncate max-w-[150px]">{organization?.name}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel - Filtered by role */}
      {(!isViewer && !isValidator) && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
          <Link href="/dashboard/beneficiaries" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-brand-500/10 hover:border-brand-500/30 group transition-all relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Registrar Socio</span>
          </Link>
          
          <Link href="/dashboard/scanner" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/30 group transition-all relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Escanear QR</span>
          </Link>
          
          <Link href="/dashboard/cards" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-purple-500/10 hover:border-purple-500/30 group transition-all relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Emitir Credencial</span>
          </Link>
          
          <Link href="/dashboard/attendance" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-amber-500/10 hover:border-amber-500/30 group transition-all relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Validar Asistencia</span>
          </Link>
          
          <Link href="/dashboard/certificates/issue" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-blue-500/10 hover:border-blue-500/30 group transition-all relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Emitir Certificado</span>
          </Link>
        </div>
      )}

      {/* Validator Quick Actions */}
      {isValidator && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/scanner" className="glass-card p-10 flex flex-col items-center justify-center gap-6 bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Escanear Credencial</h3>
              <p className="text-slate-400 text-sm mt-2">Validar identidad y beneficios de socios</p>
            </div>
          </Link>

          <Link href="/dashboard/attendance" className="glass-card p-10 flex flex-col items-center justify-center gap-6 bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Activity className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Asistencia</h3>
              <p className="text-slate-400 text-sm mt-2">Control de participación en asambleas</p>
            </div>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatsCard
          title="Total Beneficiarios"
          value={data?.totalBeneficiaries || 0}
          icon={<Users className="w-6 h-6" />}
          color="brand"
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Tarjetas Activas"
          value={data?.activeCards || 0}
          icon={<CreditCard className="w-6 h-6" />}
          color="emerald"
          trend={{ value: 8, positive: true }}
        />
        <StatsCard
          title="Beneficios Entregados"
          value={data?.benefitsUsed || 0}
          icon={<Gift className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Beneficios Pendientes"
          value={data?.benefitsPending || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase">Tendencia de Datos</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">Crecimiento Mensual: Beneficiarios & Entregas</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono tracking-widest uppercase">
              <TrendingUp className="w-3 h-3" />
              VAL_UP: 24%
            </div>
          </div>
          <div className="h-72 min-h-[288px]">
            <LazyAreaChart data={chartData} />
          </div>
          
          {/* Blueprint decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white tracking-tight mb-1">Estado</h3>
          <p className="text-sm text-slate-300 mb-6">Distribución de beneficiarios</p>
          <div className="h-48 flex items-center justify-center">
            <LazyPieChart data={statusData} />
          </div>
          <div className="space-y-3 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row - Filtered by role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Beneficiaries - Hide for Validators */}
        {!isValidator && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Últimos Beneficiarios</h3>
                <p className="text-sm text-slate-300">Registrados recientemente</p>
              </div>
              <Link
                href="/dashboard/beneficiaries"
                className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors font-bold uppercase tracking-tighter"
              >
                Ver todos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {data?.recentBeneficiaries && data.recentBeneficiaries.length > 0 ? (
              <div className="space-y-3">
                {data.recentBeneficiaries.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-brand-300 font-semibold text-sm">
                        {person.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{person.full_name}</p>
                        <p className="text-xs text-slate-400 font-mono tracking-tight">{person.rut}</p>
                      </div>
                    </div>
                    <StatusBadge status={person.status} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay beneficiarios aún</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity - Always show for visibility */}
        <div className={`glass-card p-6 ${isValidator ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Actividad Reciente</h3>
              <p className="text-sm text-slate-300">Últimas validaciones</p>
            </div>
            <Activity className="w-5 h-5 text-brand-400" />
          </div>

          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 p-4 glass-card-solid border-white/5 hover:border-brand-500/20 transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      log.result === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                       <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        {log.action === 'mark_used' ? 'BENEFIT_REDEEM' : 'SCAN_VALIDATION'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white truncate uppercase tracking-tight">
                      {log.action === 'mark_used' ? 'Beneficio Procesado' : `Validación de Identidad`}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={log.result === 'success' ? 'active' : 'blocked'} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600 bg-surface-900/30 rounded-2xl border border-white/5">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-[0.2em]">Cero Registros Encontrados</p>
            </div>
          )}
        </div>

        {/* Recent Certificates - Hide for Validators */}
        {!isValidator && (
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Últimos Certificados</h3>
                <p className="text-sm text-slate-300">Emisiones recientes (Top 3)</p>
              </div>
              <Link
                href="/dashboard/certificates"
                className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors font-bold uppercase tracking-tighter"
              >
                Ver todos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {data?.recentCertificates && data.recentCertificates.length > 0 ? (
              <div className="space-y-4">
                {data.recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 glass-card-solid border-white/5 hover:border-blue-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs font-mono">
                        #{cert.folio}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {cert.resident_data?.full_name || cert.beneficiaries?.full_name || 'Desconocido'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {cert.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">•</span>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {formatDateTime(cert.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">${cert.cost?.toLocaleString('es-CL')}</p>
                      <StatusBadge status={cert.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-10" />
                <p className="text-xs font-mono uppercase tracking-widest">No hay certificados recientes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
