import React from 'react';
import {
  LayoutDashboard,
  Video,
  AlertTriangle,
  FileText,
  Car,
  BarChart3,
  Camera as CameraIcon,
  MapPin,
  Settings as SettingsIcon,
  Server
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'live'
  | 'alerts'
  | 'events'
  | 'anpr'
  | 'analytics'
  | 'cameras'
  | 'zones'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Surveillance', icon: Video, badge: 'LIVE' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: activeAlertsCount },
    { id: 'events', label: 'Event Explorer', icon: FileText },
    { id: 'anpr', label: 'ANPR', icon: Car },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'cameras', label: 'Cameras', icon: CameraIcon },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-60 border-r border-slate-800 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 px-3 space-y-1">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-white border-l-2 border-l-blue-500 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connected Edge Computing Node Box */}
      <div className="p-3 m-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs font-sans space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>EDGE NODE</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-status-pulse" />
            Healthy
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-200 font-semibold font-mono">
            <span className="text-slate-400 font-sans font-normal">Node:</span>
            <span>BORDER-GW-01</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Inference:</span>
            <span className="text-slate-300">CPU (Auto)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Uptime:</span>
            <span className="text-slate-300 font-mono">2d 14h 32m</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

