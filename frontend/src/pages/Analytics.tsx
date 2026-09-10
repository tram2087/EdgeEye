import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Activity,
  RefreshCw,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { AnalyticsSummary } from '../types';
import { analyticsApi } from '../services/api';
import { DEFAULT_ANALYTICS } from '../data/demoData';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsApi.getSummary();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const timer = setInterval(loadAnalytics, 10000);
    return () => clearInterval(timer);
  }, []);

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    WARNING: '#eab308',
    INFO: '#3b82f6',
  };

  const totalMovements =
    data?.timeline.reduce((acc, curr) => acc + curr.persons + curr.vehicles, 0) || 1284;
  const totalAlertsCount =
    data?.severity_distribution.reduce((acc, curr) => acc + curr.value, 0) || 14;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                Surveillance Analytics & Threat Intelligence
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                Real-Time Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Temporal distribution, incident frequencies, sector saturation, and security KPI tracking
            </p>
          </div>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">24h Tracked Movements</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalMovements.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-red-700 block text-xs font-medium">Flagged Incidents</span>
            <span className="text-2xl font-bold text-red-800 mt-1 block">{totalAlertsCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-emerald-700 block text-xs font-medium">Fleet Availability</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">100.0%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Mean Inference Latency</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">~32 ms</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Row 1: Time Series & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Movement Saturation by Hour (Persons vs Vehicles)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">24-hour window</span>
          </div>

          <div className="h-72 w-full">
            {data && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.timeline}>
                  <defs>
                    <linearGradient id="anPersons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="anVehicles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="persons"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#anPersons)"
                    name="Persons Detected"
                  />
                  <Area
                    type="monotone"
                    dataKey="vehicles"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#anVehicles)"
                    name="Vehicles Tracked"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Donut Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Alerts by Severity Level
            </h2>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {data && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.severity_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.severity_distribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.name] || '#3b82f6'}
                      />
                    ))}
                  </Pie>
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Automated threat tiering calculated by security rule engine
          </p>
        </div>
      </div>

      {/* Row 2: Event Types Bar Chart & Camera Uptime Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Type Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Incident Frequency by Event Classification
            </h2>
          </div>

          <div className="h-64 w-full">
            {data && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.events_by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="type" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
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
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Camera Node Health & Availability Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Camera Sentry Availability & Sector Activity
            </h2>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Sentry Node</th>
                  <th className="py-2.5 px-3">Sector Location</th>
                  <th className="py-2.5 px-3">Events Logged</th>
                  <th className="py-2.5 px-3 text-right">Uptime Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.camera_activity.map((cam) => (
                  <tr key={cam.camera_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {cam.camera_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {cam.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">
                      {cam.events_count}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-mono">
                        {cam.uptime_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

