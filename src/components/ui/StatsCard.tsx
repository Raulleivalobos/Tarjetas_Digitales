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
    <div className={cn('glass-card p-6 group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconColor} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
