import React from 'react';
import { Severity } from '../types';

interface ThreatBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({
  severity,
  size = 'md',
  showPulse = false,
}) => {
  const sev = severity.toUpperCase();

  const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-600',
    },
    HIGH: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-600',
    },
    WARNING: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-600',
    },
    INFO: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    },
    NORMAL: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    },
  };

  const style = colorMap[sev] || colorMap.INFO;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-sans font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${style.dot} ${
          showPulse && (sev === 'CRITICAL' || sev === 'HIGH') ? 'animate-pulse' : ''
        }`}
      />
      {sev}
    </span>
  );
};

