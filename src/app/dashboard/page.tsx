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
        ] = await Promise.all([
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('beneficiaries').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('digital_cards').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'active'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'used'),
          supabase.from('benefit_assignments').select('*', { count: 'exact', head: true }).eq('org_id', organization.id).eq('status', 'pending'),
          supabase.from('validation_logs').select('*').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('beneficiaries').select('id, full_name, rut, status, created_at').eq('org_id', organization.id).order('created_at', { ascending: false }).limit(5),
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Panel de Control
          </h1>
          <p className="text-slate-400 mt-1">
            Resumen de tu organización{organization ? `: ${organization.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Actualizado ahora</span>
        </div>
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
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Crecimiento</h3>
              <p className="text-sm text-slate-400">Beneficiarios y beneficios por mes</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +24%
            </div>
          </div>
          <div className="h-64">
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#e2e8f0',
                  }}
                />
                <Area type="monotone" dataKey="beneficiarios" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBeneficiarios)" />
                <Area type="monotone" dataKey="beneficios" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorBeneficios)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Estado</h3>
          <p className="text-sm text-slate-400 mb-6">Distribución de beneficiarios</p>
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
                  <span className="text-sm text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}%</span>
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
              <h3 className="text-lg font-semibold text-white">Últimos Beneficiarios</h3>
              <p className="text-sm text-slate-400">Registrados recientemente</p>
            </div>
            <Link
              href="/dashboard/beneficiaries"
              className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors"
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
                      <p className="text-sm font-medium text-white">{person.full_name}</p>
                      <p className="text-xs text-slate-500">{person.rut}</p>
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
              <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
              <p className="text-sm text-slate-400">Últimas validaciones</p>
            </div>
            <Activity className="w-5 h-5 text-brand-400" />
          </div>

          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.result === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {log.action === 'mark_used' ? 'Beneficio marcado como usado' : `Validación QR`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={log.result === 'success' ? 'active' : 'blocked'} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin actividad reciente</p>
              <p className="text-xs mt-1 text-slate-600">
                Las validaciones de QR aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
