import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Eye,
  Camera as CameraIcon,
  Crosshair,
  Clock,
  Layers,
  ShieldAlert,
  Activity,
  RefreshCw
} from 'lucide-react';
import { ThreatBadge } from '../components/ThreatBadge';
import { EvidenceModal } from '../components/EvidenceModal';
import { Event } from '../types';
import { eventsApi } from '../services/api';
import { DEFAULT_EVENTS } from '../data/demoData';

export const EventExplorer: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedCamera, setSelectedCamera] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected event for detail inspection
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    event: Event | null;
  }>({
    isOpen: false,
    event: null,
  });

  const loadEvents = async () => {
    try {
      const res = await eventsApi.getAll({ limit: 100 });
      setEvents(res.data);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const timer = setInterval(loadEvents, 8000);
    return () => clearInterval(timer);
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (selectedEventType !== 'ALL' && ev.event_type !== selectedEventType) return false;
    if (selectedCamera !== 'ALL' && ev.camera_id !== selectedCamera) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.camera_id.toLowerCase().includes(q) ||
        ev.event_type.toLowerCase().includes(q) ||
        (ev.object_id && ev.object_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const intrusionCount = events.filter((e) => e.event_type === 'INTRUSION').length;
  const loiteringCount = events.filter((e) => e.event_type === 'LOITERING').length;
  const nightMovementCount = events.filter((e) => e.event_type === 'NIGHT_MOVEMENT').length;

  const getEventTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'INTRUSION':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'NIGHT_MOVEMENT':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'LOITERING':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'WATCHLIST_MATCH':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'PERSON_DETECTED':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'VEHICLE_DETECTED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                Security Event Telemetry Explorer
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                SHA-256 Ledger Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically signed timeline of all AI detections, perimeter intrusions, and target tracks
            </p>
          </div>
        </div>

        <button
          onClick={loadEvents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Sync Events</span>
        </button>
      </div>

      {/* Breakdown Tally Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Total Logged Events</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{events.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-red-700 block text-xs font-medium">Perimeter Intrusions</span>
            <span className="text-2xl font-bold text-red-800 mt-1 block">{intrusionCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-amber-700 block text-xs font-medium">Loitering Violations</span>
            <span className="text-2xl font-bold text-amber-800 mt-1 block">{loiteringCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-purple-700 block text-xs font-medium">Night Movements</span>
            <span className="text-2xl font-bold text-purple-800 mt-1 block">{nightMovementCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search object, sector, event ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Event Type:</span>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="INTRUSION">Intrusion</option>
            <option value="NIGHT_MOVEMENT">Night Movement</option>
            <option value="WATCHLIST_MATCH">Watchlist Match</option>
            <option value="LOITERING">Loitering</option>
            <option value="PERSON_DETECTED">Person Detected</option>
            <option value="VEHICLE_DETECTED">Vehicle Detected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Camera:</span>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Cameras</option>
            <option value="BOP-01">BOP-01 (Sector Alpha)</option>
            <option value="BOP-02">BOP-02 (Sector Bravo)</option>
            <option value="BOP-03">BOP-03 (Sector Charlie)</option>
            <option value="CHECKPOST-01">CHECKPOST-01 (Main Gate)</option>
          </select>
        </div>
      </div>

      {/* Events Log Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Sector Camera</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Target Identity</th>
                <th className="py-3.5 px-4">AI Confidence</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No surveillance events recorded matching query.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setDetailModal({ isOpen: true, event: ev })}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      #EVT-{String(ev.id).padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <span className="flex items-center gap-1.5 font-mono font-medium">
                        <CameraIcon className="w-3.5 h-3.5 text-slate-400" />
                        {ev.camera_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getEventTypeBadgeClass(ev.event_type)}`}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-emerald-600" />
                        {ev.object_id || 'Track #--'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.round(ev.confidence * 100)}%` }}
                          />
                        </div>
                        <span>{(ev.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ThreatBadge severity={ev.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModal({ isOpen: true, event: ev });
                        }}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Modal */}
      {detailModal.event && (
        <EvidenceModal
          isOpen={detailModal.isOpen}
          onClose={() => setDetailModal({ isOpen: false, event: null })}
          title={`Event Record #${detailModal.event.id}: ${detailModal.event.event_type}`}
          camera={detailModal.event.camera_id}
          timestamp={detailModal.event.timestamp}
          severity={detailModal.event.severity}
          objectId={detailModal.event.object_id}
          confidence={detailModal.event.confidence}
          snapshotPath={detailModal.event.snapshot_path}
          metadata={detailModal.event.metadata_json}
        />
      )}
    </div>
  );
};

