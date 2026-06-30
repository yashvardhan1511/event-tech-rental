import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, description, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-400 border-indigo-500/15',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/15',
    violet: 'from-violet-500/10 to-violet-600/5 text-violet-400 border-violet-500/15',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/15',
    rose: 'from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/15',
  };

  const borderGlow = {
    indigo: 'hover:border-indigo-500/30',
    emerald: 'hover:border-emerald-500/30',
    violet: 'hover:border-violet-500/30',
    amber: 'hover:border-amber-500/30',
    rose: 'hover:border-rose-500/30',
  };

  return (
    <div className={`glass-card p-6 rounded-2xl bg-gradient-to-tr border transition-all duration-300 hover:scale-[1.02] ${colorMap[color]} ${borderGlow[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-400 mt-4 flex items-center space-x-1">
          <span>{description}</span>
        </p>
      )}
    </div>
  );
};

export default MetricCard;
