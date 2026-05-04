'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

export default function DashboardPage() {
  const { organization } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!organization) {
        setLoading(false);
        return;
      }

      try {
        const [
          { count: totalBeneficiaries },
          { count: activeBeneficiaries },
          { count: activeCards },
          { count: totalBenefits },
          { count: benefitsUsed },
          { count: benefitsPending },
          { data: recentActivity },
          { data: recentBeneficiaries },
          { data: recentCertificates },
        ] = await Promise.all([
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('digital_cards').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'used'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'pending'),
          supabase.from('validation_logs').select('*').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('beneficiaries').select('id, full_name, rut, status, created_at').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('certificates').select('*, beneficiaries(full_name)').eq('org_id', organization.id).order('issued_at', { ascending: false }).limit(3),
        ]);

        setData({
          totalBeneficiaries: totalBeneficiaries || 0,
          activeBeneficiaries: activeBeneficiaries || 0,
          activeCards: activeCards || 0,
          totalBenefits: totalBenefits || 0,
          benefitsUsed: benefitsUsed || 0,
          benefitsPending: benefitsPending || 0,
          recentActivity: recentActivity || [],
          recentBeneficiaries: recentBeneficiaries || [],
          recentCertificates: recentCertificates || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData({
          totalBeneficiaries: 0,
          activeBeneficiaries: 0,
          activeCards: 0,
          totalBenefits: 0,
          benefitsUsed: 0,
          benefitsPending: 0,
          recentActivity: [],
          recentBeneficiaries: [],
          recentCertificates: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">
            Panel de Control
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest uppercase">Sistema Online</span>
            </div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">
              Org: {organization?.name || 'Cargando...'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-brand-400" />
            <span>Última Sincronización: 12:45:02</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-brand-400" />
            <span>ID_SESIÓN: CS-X92-2024</span>
          </div>
        </div>
      </div>

      {/* Onboarding Banner - New Institutional Level Prompt */}
      {!organization?.parent_org_id && (
        <div className="glass-card p-6 bg-gradient-to-r from-brand-500/10 via-indigo-500/5 to-transparent border-brand-500/20 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building2 className="w-32 h-32 text-white" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Zap className="w-3 h-3 fill-current" />
                Nueva Funcionalidad
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Configura tu Nivel Institucional</h2>
              <p className="text-slate-400 text-sm max-w-2xl">
                Ahora puedes vincular tu organización con una Municipalidad para acceder a estadísticas compartidas o activar el perfil de Municipalidad para supervisar a tus Juntas de Vecinos.
              </p>
            </div>
            <Link 
              href="/dashboard/settings" 
              className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2"
            >
              Configurar Ahora
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
      {/* Quick Actions Panel - P1 Efficiency Fix */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <Link href="/dashboard/beneficiaries" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-brand-500/10 hover:border-brand-500/30 group transition-all relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Registrar Socio</span>
          <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
        
        <Link href="/dashboard/scanner" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/30 group transition-all relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Escanear QR</span>
           <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
        
        <Link href="/dashboard/cards" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-purple-500/10 hover:border-purple-500/30 group transition-all relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Emitir Credencial</span>
           <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
        
        <Link href="/dashboard/attendance" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-amber-500/10 hover:border-amber-500/30 group transition-all relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Validar Asistencia</span>
           <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
        
        <Link href="/dashboard/certificates/issue" className="glass-card-solid p-5 flex flex-col items-center justify-center gap-3 hover:bg-blue-500/10 hover:border-blue-500/30 group transition-all relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono group-hover:text-white transition-colors text-center">Emitir Certificado</span>
           <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
          </div>
          
          {/* Blueprint decorations */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full -mr-12 -mt-12" />
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white tracking-tight mb-1">Estado</h3>
          <p className="text-sm text-slate-300 mb-6">Distribución de beneficiarios</p>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Beneficiaries */}
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

        {/* Recent Activity */}
        <div className="glass-card p-6">
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

        {/* Recent Certificates - New Section */}
        <div className="glass-card p-6">
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
      </div>
    </div>
  );
}
