import React, { useState, useEffect } from 'react';
import { Eye, Bell, User, Clock, CheckCircle } from 'lucide-react';

interface NavbarProps {
  activeAlertsCount: number;
  criticalAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  username: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAlertsCount,
  criticalAlertsCount,
  onOpenAlerts,
  onOpenLogin,
  isLoggedIn,
  username,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', { hour12: false }) +
          ' · ' +
          now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0f172a] text-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white shadow-sm">
          <Eye className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white font-sans">
              EdgeEye
            </span>
            <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
              SIH 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
            Intelligent Border Video Analytics Platform
          </p>
        </div>
      </div>

      {/* Center/Right: System Telemetry Indicators */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-slate-300 font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
          <span className="font-medium text-slate-200">System Operational</span>
        </div>
        <span className="text-slate-600">·</span>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span>4 / 4 Cameras Online</span>
        </div>
        <span className="text-slate-600">·</span>
        <div className="flex items-center gap-1.5 text-blue-400 font-medium">
          <span>Edge AI Pipeline Active</span>
        </div>
        <span className="text-slate-600">·</span>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Far Right: Notifications & Operator Profile */}
      <div className="flex items-center gap-3">
        {/* Alerts Bell Button */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition"
          title="Active Security Alerts"
        >
          <Bell className="w-4 h-4" />
          {criticalAlertsCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white font-mono">
              {criticalAlertsCount}
            </span>
          ) : activeAlertsCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 font-mono">
              {activeAlertsCount}
            </span>
          ) : null}
        </button>

        {/* Operator Profile */}
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-md hover:bg-slate-800 transition text-left border border-slate-800"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-slate-200 capitalize">{username}</div>
            <div className="text-[10px] text-slate-400">Operator</div>
          </div>
        </button>
      </div>
    </header>
  );
};
