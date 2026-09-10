import React, { useState, useEffect } from 'react';
import {
  Camera as CameraIcon,
  Users,
  Car,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  Cpu,
  Radio,
  Server
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

import { KpiCard } from '../components/KpiCard';
import { ThreatBadge } from '../components/ThreatBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { Camera, Alert, AnalyticsSummary, SystemStatus } from '../types';
import { camerasApi, alertsApi, analyticsApi, systemApi, getPreviewUrl } from '../services/api';

import { DEFAULT_CAMERAS, DEFAULT_ALERTS, DEFAULT_ANALYTICS } from '../data/demoData';

interface OverviewProps {
  onNavigateToLive: (cameraId?: string) => void;
  onNavigateToAlerts: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigateToLive,
  onNavigateToAlerts,
}) => {
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [alerts, setAlerts] = useState<Alert[]>(DEFAULT_ALERTS);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(DEFAULT_ANALYTICS);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Evidence modal state
  const [selectedEvidence, setSelectedEvidence] = useState<{
    isOpen: boolean;
    title: string;
    camera: string;
    timestamp: string;
    severity: string;
    snapshotPath?: string;
  }>({
    isOpen: false,
    title: '',
    camera: '',
    timestamp: '',
    severity: 'HIGH',
  });

  const fetchData = async () => {
    try {
      const [cRes, aRes, anRes, sRes] = await Promise.all([
        camerasApi.getAll(),
        alertsApi.getAll({ limit: 10 }),
        analyticsApi.getSummary(),
        systemApi.getStatus(),
      ]);
      setCameras(cRes.data);
      setAlerts(aRes.data);
      setAnalytics(anRes.data);
      setSystemStatus(sRes.data);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [previewTimestamp, setPreviewTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setPreviewTimestamp(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await alertsApi.updateStatus(id, 'ACKNOWLEDGED', 'operator');
      fetchData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Situational Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900">
                  Border Command Center
                </h1>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                  Sector Alpha-Delta
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time situational awareness for a safer and more secure nation.
              </p>
            </div>
          </div>

          {/* Operational Indicators */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Gateway:</span>
              <span className="font-mono font-semibold text-slate-800">BORDER-GW-01</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <span className="text-slate-500">Connected:</span>
              <span className="font-semibold text-slate-800">{cameras.length} Cameras</span>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs"
              title="Synchronize situational data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          title="TOTAL CAMERAS"
          value={cameras.length || 4}
          subtitle="Fixed & PTZ Sentries"
          trend={{ value: "100%", positive: true }}
          icon={CameraIcon}
          variant="default"
        />
        <KpiCard
          title="ACTIVE CAMERAS"
          value={cameras.filter((c) => c.status === 'ONLINE').length || 4}
          subtitle="Online & Streaming"
          trend={{ value: "4/4 OK", positive: true }}
          icon={Activity}
          variant="success"
        />
        <KpiCard
          title="PERSONNEL"
          value={analytics?.kpi.persons_detected || 142}
          subtitle="Cumulative (24h)"
          trend={{ value: "+12.4% today", positive: true }}
          badge="DEMO"
          icon={Users}
          variant="default"
        />
        <KpiCard
          title="VEHICLES"
          value={analytics?.kpi.vehicles_detected || 67}
          subtitle="Monitored Lanes"
          trend={{ value: "+4.2% today", positive: true }}
          badge="DEMO"
          icon={Car}
          variant="default"
        />
        <KpiCard
          title="ACTIVE ALERTS"
          value={alerts.filter((a) => a.status === 'UNACKNOWLEDGED').length}
          subtitle="Requires Triage"
          icon={AlertTriangle}
          variant={alerts.length > 0 ? 'high' : 'default'}
        />
        <KpiCard
          title="CRITICAL ALERTS"
          value={
            alerts.filter(
              (a) => a.severity === 'CRITICAL' && a.status === 'UNACKNOWLEDGED'
            ).length
          }
          subtitle="Immediate Action"
          icon={ShieldAlert}
          variant={
            alerts.some(
              (a) => a.severity === 'CRITICAL' && a.status === 'UNACKNOWLEDGED'
            )
              ? 'critical'
              : 'default'
          }
        />
      </div>

      {/* LIVE BORDER SECTOR FEEDS: Live Camera Wall */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
              <CameraIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Live Border Sector Feeds
              </h2>
              <p className="text-xs text-slate-500">
                Real-time optical CCTV feeds with edge neural inference and virtual perimeter tripwires
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToLive()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200"
          >
            <span>Open Live Surveillance</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cameras.map((cam, idx) => {
            const camAlertsCount = alerts.filter(a => a.camera_id === cam.id && a.status === 'UNACKNOWLEDGED').length;
            const mockPersons = [4, 2, 1, 0][idx] ?? 2;
            const mockVehicles = [1, 0, 0, 3][idx] ?? 1;

            return (
              <div
                key={cam.id}
                onClick={() => onNavigateToLive(cam.id)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Video container */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={getPreviewUrl(cam.id, previewTimestamp)}
                    alt={cam.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%230f172a"/><text x="50%" y="50%" fill="%2364748b" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11">STANDBY: CONNECTING...</text></svg>';
                    }}
                  />

                  {/* Top Overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-white font-mono font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{cam.id}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-slate-300 font-normal truncate max-w-[90px]">
                        {cam.location}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold text-[9px] shadow-xs">
                      ONLINE
                    </span>
                  </div>

                  {/* Bottom Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200">
                      <span className="text-blue-400 font-semibold">AI ACTIVE</span>
                      <span className="text-slate-500">|</span>
                      <span>P:{mockPersons} V:{mockVehicles}</span>
                    </div>

                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200">
                      <span>{cam.fps} FPS</span>
                      <span className="text-slate-500">|</span>
                      <span>1080p</span>
                    </div>
                  </div>
                </div>

                {/* Card Sub-info */}
                <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center text-xs">
                  <p className="font-medium text-slate-800 truncate text-xs">
                    {cam.name}
                  </p>
                  {camAlertsCount > 0 ? (
                    <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      {camAlertsCount} Alerts
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>SECURE</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts & Alerts Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                12-Hour Detection & Activity Trend
              </h2>
            </div>
            <span className="text-xs text-slate-500">Personnel vs Vehicles</span>
          </div>

          <div className="h-64 w-full">
            {analytics && (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics.timeline}>
                  <defs>
                    <linearGradient id="colorPersons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="persons"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPersons)"
                    name="Persons"
                  />
                  <Area
                    type="monotone"
                    dataKey="vehicles"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVehicles)"
                    name="Vehicles"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Col: Recent Alerts Feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Alerts
                </h2>
              </div>
              <button
                onClick={() => onNavigateToAlerts()}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No active security alerts in this sector.
                </div>
              ) : (
                alerts.slice(0, 5).map((al) => (
                  <div
                    key={al.id}
                    className={`p-3 rounded-lg border transition ${
                      al.severity === 'CRITICAL'
                        ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <ThreatBadge severity={al.severity} size="sm" />
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(al.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {al.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {al.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-mono font-medium text-slate-600">
                        CAM: {al.camera_id}
                      </span>
                      <div className="flex gap-1.5">
                        {al.snapshot_path && (
                          <button
                            onClick={() =>
                              setSelectedEvidence({
                                isOpen: true,
                                title: al.title,
                                camera: al.camera_id,
                                timestamp: al.created_at,
                                severity: al.severity,
                                snapshotPath: al.snapshot_path,
                              })
                            }
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-blue-600"
                            title="Inspect Evidence"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {al.status === 'UNACKNOWLEDGED' && (
                          <button
                            onClick={(e) => handleAcknowledge(al.id, e)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-emerald-600"
                            title="Acknowledge Alert"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health readout */}
          {systemStatus && (
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Edge System Health
                </span>
                <span className="text-slate-500 font-mono font-normal">BORDER-GW-01</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Edge CPU Load:</span>
                <span className="text-slate-800 font-semibold font-mono">{systemStatus.cpu_usage_pct}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">System RAM:</span>
                <span className="text-slate-800 font-semibold font-mono">{systemStatus.memory_usage_pct}%</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">AI Pipeline:</span>
                <span className="text-emerald-700 font-semibold font-medium">Active (Optimized)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={selectedEvidence.isOpen}
        onClose={() => setSelectedEvidence((prev) => ({ ...prev, isOpen: false }))}
        title={selectedEvidence.title}
        camera={selectedEvidence.camera}
        timestamp={selectedEvidence.timestamp}
        severity={selectedEvidence.severity}
        snapshotPath={selectedEvidence.snapshotPath}
      />
    </div>
  );
};
