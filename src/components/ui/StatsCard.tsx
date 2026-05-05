'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'purple';
  className?: string;
}

const colorMap = {
  brand: {
    iconBg: 'bg-brand-500/10',
    iconColor: 'text-brand-400',
    glow: 'shadow-brand-500/5',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    glow: 'shadow-emerald-500/5',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/5',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    glow: 'shadow-rose-500/5',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    glow: 'shadow-purple-500/5',
  },
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'brand',
  className,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('glass-card p-6 group relative overflow-hidden transition-all duration-300 hover:border-brand-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]', className)}>
      {/* Blueprint Corner Markers */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-500/20 group-hover:border-brand-500/40 transition-colors" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-brand-500/20 group-hover:border-brand-500/40 transition-colors" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-500/20 group-hover:border-brand-500/40 transition-colors" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-brand-500/20 group-hover:border-brand-500/40 transition-colors" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-widest">
              ID-{title.substring(0, 2).toUpperCase() || 'MTR'}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] font-mono">{title}</p>
          </div>
          <p className="text-4xl font-black text-white tracking-tighter font-mono leading-none">
            {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-4">
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold font-mono border",
                trend.positive 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              )}>
                {trend.positive ? '↑' : '↓'} {trend.value}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">PERIOD_OVER_PERIOD</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] shadow-lg",
            colors.iconBg,
            colors.iconColor
          )}
        >
          {icon}
        </div>
      </div>
      
      {/* Decorative Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}
