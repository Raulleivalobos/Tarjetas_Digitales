'use client';

import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-widest border ${
        status === 'active' 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
          : status === 'inactive'
          ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
          : status === 'draft'
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
      } ${
        size === 'sm' ? 'text-[9px] px-2 py-0.5 rounded' : 'text-[10px] px-3 py-1 rounded-lg'
      }`}
    >
      <span className={`w-1 h-1 rounded-full animate-pulse ${
        status === 'active' ? 'bg-emerald-400' : status === 'inactive' ? 'bg-slate-400' : status === 'draft' ? 'bg-amber-400' : 'bg-red-400'
      }`} />
      {getStatusLabel(status)}
    </span>
  );
}
