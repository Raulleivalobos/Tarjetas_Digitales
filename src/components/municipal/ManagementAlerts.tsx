'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Sparkles,
  Clock,
  ChevronRight,
  Bell,
} from 'lucide-react';

// =====================================================
// Types
// =====================================================

interface JJVVAlertData {
  id: string;
  name: string;
  slug: string;
  beneficiaryCount: number;
  cardCount: number;
  created_at: string;
}

interface Alert {
  id: string;
  type: 'growth' | 'shadow_zone' | 'inactive' | 'milestone' | 'high_adoption';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  relatedOrg?: string;
  timestamp: Date;
}

interface ManagementAlertsProps {
  jjvvList: JJVVAlertData[];
  totalBeneficiaries: number;
  totalCards: number;
}

// =====================================================
// Alert type config
// =====================================================

const ALERT_CONFIG = {
  growth: {
    icon: TrendingUp,
    color: 'emerald',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    iconClass: 'text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  shadow_zone: {
    icon: AlertTriangle,
    color: 'amber',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    iconClass: 'text-amber-400',
    dotClass: 'bg-amber-500',
  },
  inactive: {
    icon: AlertCircle,
    color: 'red',
    bgClass: 'bg-red-500/10 border-red-500/20',
    iconClass: 'text-red-400',
    dotClass: 'bg-red-500',
  },
  milestone: {
    icon: Trophy,
    color: 'blue',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    iconClass: 'text-blue-400',
    dotClass: 'bg-blue-500',
  },
  high_adoption: {
    icon: Sparkles,
    color: 'cyan',
    bgClass: 'bg-cyan-500/10 border-cyan-500/20',
    iconClass: 'text-cyan-400',
    dotClass: 'bg-cyan-500',
  },
};

// =====================================================
// Alert generator engine
// =====================================================

function generateAlerts(jjvvList: JJVVAlertData[], totalBeneficiaries: number, totalCards: number): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Analyze each JJVV
  jjvvList.forEach(jjvv => {
    const daysSinceCreation = Math.floor((now.getTime() - new Date(jjvv.created_at).getTime()) / (1000 * 60 * 60 * 24));

    // Milestone: JJVV with significant beneficiaries
    if (jjvv.beneficiaryCount >= 50) {
      alerts.push({
        id: `milestone-${jjvv.id}`,
        type: 'milestone',
        priority: 'low',
        title: `${jjvv.name} superó los 50 vecinos`,
        description: `Con ${jjvv.beneficiaryCount} vecinos digitalizados, esta organización lidera en adopción.`,
        relatedOrg: jjvv.name,
        timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    } else if (jjvv.beneficiaryCount >= 20) {
      alerts.push({
        id: `milestone-${jjvv.id}`,
        type: 'milestone',
        priority: 'low',
        title: `${jjvv.name} alcanzó 20+ vecinos`,
        description: `Crecimiento constante con ${jjvv.beneficiaryCount} vecinos registrados.`,
        relatedOrg: jjvv.name,
        timestamp: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      });
    }

    // Shadow zone: JJVV with few beneficiaries after several days
    if (jjvv.beneficiaryCount < 3 && daysSinceCreation > 30) {
      alerts.push({
        id: `shadow-${jjvv.id}`,
        type: 'shadow_zone',
        priority: 'medium',
        title: `Zona de sombra: ${jjvv.name}`,
        description: `Solo ${jjvv.beneficiaryCount} vecino${jjvv.beneficiaryCount !== 1 ? 's' : ''} registrado${jjvv.beneficiaryCount !== 1 ? 's' : ''} en ${daysSinceCreation} días. Considerar campaña de enrolamiento.`,
        relatedOrg: jjvv.name,
        timestamp: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      });
    }

    // Inactive: zero beneficiaries
    if (jjvv.beneficiaryCount === 0 && daysSinceCreation > 14) {
      alerts.push({
        id: `inactive-${jjvv.id}`,
        type: 'inactive',
        priority: 'high',
        title: `Sin actividad: ${jjvv.name}`,
        description: `Esta organización no tiene vecinos digitalizados desde su adhesión hace ${daysSinceCreation} días.`,
        relatedOrg: jjvv.name,
        timestamp: new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000),
      });
    }

    // Growth: JJVV with good card/beneficiary ratio
    if (jjvv.beneficiaryCount > 5 && jjvv.cardCount >= jjvv.beneficiaryCount * 0.8) {
      alerts.push({
        id: `growth-${jjvv.id}`,
        type: 'growth',
        priority: 'low',
        title: `Adopción creciente: ${jjvv.name}`,
        description: `${Math.round((jjvv.cardCount / jjvv.beneficiaryCount) * 100)}% de sus vecinos tienen tarjeta digital activa.`,
        relatedOrg: jjvv.name,
        timestamp: new Date(now.getTime() - Math.random() * 4 * 24 * 60 * 60 * 1000),
      });
    }
  });

  // Global alerts
  const activeJJVV = jjvvList.filter(j => j.beneficiaryCount > 0).length;
  const adoptionRate = jjvvList.length > 0 ? (activeJJVV / jjvvList.length) * 100 : 0;

  if (adoptionRate >= 70) {
    alerts.push({
      id: 'high-adoption-global',
      type: 'high_adoption',
      priority: 'low',
      title: 'Alta adopción territorial',
      description: `${Math.round(adoptionRate)}% de las JJVV adscritas tienen actividad digital activa. Excelente cobertura comunal.`,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  if (totalCards > 0 && totalBeneficiaries > 0) {
    const digitalizationRate = Math.round((totalCards / totalBeneficiaries) * 100);
    if (digitalizationRate >= 60) {
      alerts.push({
        id: 'digitalization-rate',
        type: 'growth',
        priority: 'low',
        title: 'Índice de digitalización positivo',
        description: `${digitalizationRate}% de los vecinos registrados cuentan con tarjeta digital emitida.`,
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Sort: high priority first, then by timestamp
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return alerts
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6); // Max 6 alerts
}

// =====================================================
// Relative time helper
// =====================================================

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return `hace ${Math.floor(diffDays / 7)}sem`;
}

// =====================================================
// Component
// =====================================================

export default function ManagementAlerts({ jjvvList, totalBeneficiaries, totalCards }: ManagementAlertsProps) {
  const alerts = useMemo(
    () => generateAlerts(jjvvList, totalBeneficiaries, totalCards),
    [jjvvList, totalBeneficiaries, totalCards]
  );

  if (alerts.length === 0) {
    return (
      <div className="glass-card-solid p-6">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Alertas de Gestión
        </h4>
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <Sparkles className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Todo en orden. Sin alertas activas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-solid p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Alertas de Gestión
        </h4>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400">{alerts.length}</span>
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {alerts.map((alert, idx) => {
          const config = ALERT_CONFIG[alert.type];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-default ${config.bgClass}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-white/5 flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${config.iconClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-white truncate">{alert.title}</p>
                    {alert.priority === 'high' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 text-red-400 flex-shrink-0">
                        Alta
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-2.5 h-2.5 text-slate-600" />
                    <span className="text-[9px] text-slate-600 font-mono">
                      {timeAgo(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
