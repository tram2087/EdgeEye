import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  badge?: string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'high' | 'warning' | 'success';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  badge,
  icon: Icon,
  variant = 'default',
}) => {
  const iconStyles = {
    default: 'text-blue-600 bg-blue-50 border-blue-100',
    critical: 'text-red-600 bg-red-50 border-red-100',
    high: 'text-orange-600 bg-orange-50 border-orange-100',
    warning: 'text-amber-600 bg-amber-50 border-amber-100',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-sans font-medium text-slate-500 truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {badge}
            </span>
          )}
          <div className={`p-1.5 rounded-md border ${iconStyles[variant]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-sans tracking-tight text-slate-900">
          {value}
        </span>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-sans font-medium ${
              trend.neutral
                ? 'text-slate-500'
                : trend.positive
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
          >
            {trend.neutral ? (
              <Minus className="w-3 h-3" />
            ) : trend.positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-sans truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

