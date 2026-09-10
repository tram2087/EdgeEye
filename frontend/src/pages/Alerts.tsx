import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Search,
  CheckCheck,
  RefreshCw,
  Camera as CameraIcon,
  AlertOctagon,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ThreatBadge } from '../components/ThreatBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { Alert, Severity, AlertStatus } from '../types';
import { alertsApi } from '../services/api';
import { DEFAULT_ALERTS } from '../data/demoData';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Evidence modal state
  const [evidenceModal, setEvidenceModal] = useState<{
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

  const loadAlerts = async () => {
    try {
      const res = await alertsApi.getAll({ limit: 100 });
      setAlerts(res.data);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: number, status: AlertStatus) => {
    try {
      await alertsApi.updateStatus(id, status, 'operator');
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await alertsApi.acknowledgeAll();
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.camera_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'UNACKNOWLEDGED').length;
  const unackCount = alerts.filter((a) => a.status === 'UNACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                Security Alerts & Incident Triage
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                Active Queue: {alerts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time threat triage, evidence verification, and cryptographic chain of custody
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {unackCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Acknowledge All ({unackCount})</span>
            </button>
          )}
          <button
            onClick={loadAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Triage Summary Tally Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Total Alerts</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{alerts.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-red-700 block text-xs font-medium">Critical Threats</span>
            <span className="text-2xl font-bold text-red-800 mt-1 block">{criticalCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-amber-700 block text-xs font-medium">Pending Triage</span>
            <span className="text-2xl font-bold text-amber-800 mt-1 block">{unackCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-emerald-700 block text-xs font-medium">Resolved Today</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">{resolvedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search alerts, sector, object..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNACKNOWLEDGED">Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Alert Details</th>
                <th className="py-3.5 px-4">Sector Camera</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No alerts match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-slate-50/80 transition ${
                      a.severity === 'CRITICAL' && a.status === 'UNACKNOWLEDGED'
                        ? 'bg-red-50/30'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ThreatBadge severity={a.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-slate-800">{a.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                        {a.message}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CameraIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{a.camera_id}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <div className="font-medium text-slate-700">{new Date(a.created_at).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          a.status === 'UNACKNOWLEDGED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : a.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                      {a.snapshot_path && (
                        <button
                          onClick={() =>
                            setEvidenceModal({
                              isOpen: true,
                              title: a.title,
                              camera: a.camera_id,
                              timestamp: a.created_at,
                              severity: a.severity,
                              snapshotPath: a.snapshot_path,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition inline-flex items-center gap-1 shadow-xs"
                          title="View Snapshot"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Evidence</span>
                        </button>
                      )}

                      {a.status === 'UNACKNOWLEDGED' && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'ACKNOWLEDGED')}
                          className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs transition font-medium"
                        >
                          Acknowledge
                        </button>
                      )}

                      {a.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs transition font-medium"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Snapshot Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={() => setEvidenceModal((prev) => ({ ...prev, isOpen: false }))}
        title={evidenceModal.title}
        camera={evidenceModal.camera}
        timestamp={evidenceModal.timestamp}
        severity={evidenceModal.severity}
        snapshotPath={evidenceModal.snapshotPath}
      />
    </div>
  );
};

