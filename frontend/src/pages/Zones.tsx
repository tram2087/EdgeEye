import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Shield,
  Camera as CameraIcon,
  BoxSelect,
  Zap,
  RefreshCw
} from 'lucide-react';
import { ThreatBadge } from '../components/ThreatBadge';
import { Zone, Camera } from '../types';
import { zonesApi, camerasApi } from '../services/api';
import { DEFAULT_ZONES, DEFAULT_CAMERAS } from '../data/demoData';

export const Zones: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [loading, setLoading] = useState(false);

  // Add Zone Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    camera_id: 'BOP-01',
    name: '',
    zone_type: 'RESTRICTED',
    coordinates: '[[150, 420], [800, 420], [800, 560], [150, 560]]',
    severity: 'CRITICAL',
    enabled: true,
  });

  const loadData = async () => {
    try {
      const [zRes, cRes] = await Promise.all([
        zonesApi.getAll(),
        camerasApi.getAll(),
      ]);
      setZones(zRes.data);
      setCameras(cRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this virtual fence zone configuration?')) return;
    try {
      await zonesApi.delete(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (zone: Zone) => {
    try {
      await zonesApi.update(zone.id, { enabled: !zone.enabled });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await zonesApi.create(formData as any);
      setIsModalOpen(false);
      setFormData({
        camera_id: 'BOP-01',
        name: '',
        zone_type: 'RESTRICTED',
        coordinates: '[[150, 420], [800, 420], [800, 560], [150, 560]]',
        severity: 'CRITICAL',
        enabled: true,
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeZonesCount = zones.filter((z) => z.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                Virtual Fence & Restricted Perimeter Zones
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                {activeZonesCount} / {zones.length} Armed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ray-casting point-in-polygon intrusion detection coordinates mapped onto live CCTV streams
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Define Virtual Fence</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Configured Zones</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{zones.length} Zones</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-emerald-700 block text-xs font-medium">Armed Boundaries</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">{activeZonesCount} Active</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Geometry Engine</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">Ray-Cast PiP</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <BoxSelect className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-amber-700 block text-xs font-medium">Trigger Latency</span>
            <span className="text-2xl font-bold text-amber-800 mt-1 block font-mono">&lt; 50 ms</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Zones List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`rounded-xl border p-5 shadow-sm space-y-4 transition ${
              zone.enabled
                ? 'border-slate-200 bg-white hover:border-slate-300'
                : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ThreatBadge severity={zone.severity} size="sm" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                    {zone.zone_type}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-1.5">{zone.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                  <CameraIcon className="w-3.5 h-3.5 text-slate-400" />
                  Node: {zone.camera_id}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggle(zone)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition shadow-xs ${
                    zone.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {zone.enabled ? 'ARMED' : 'DISABLED'}
                </button>
                <button
                  onClick={() => handleDelete(zone.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                  title="Delete Zone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Polygon Visual Schema preview */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              <span className="text-slate-500 block text-[10px] font-semibold mb-1">
                POLYGON VERTICES:
              </span>
              <code className="text-slate-800 break-all text-[11px]">{zone.coordinates}</code>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono text-slate-500">
              <span>ALGORITHM: Ray-Casting PiP</span>
              <span>TRIGGER: &lt; 50ms</span>
            </div>
          </div>
        ))}
      </div>

      {/* Define Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Define Virtual Perimeter Zone
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Associated Camera Node</label>
                <select
                  value={formData.camera_id}
                  onChange={(e) => setFormData({ ...formData, camera_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Zone Identifier / Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Red Line Buffer Alpha"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Zone Behavior</label>
                  <select
                    value={formData.zone_type}
                    onChange={(e) => setFormData({ ...formData, zone_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="RESTRICTED">Restricted Zone</option>
                    <option value="PERIMETER">Perimeter Line</option>
                    <option value="WARNING">Warning Buffer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Alert Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Coordinates (JSON Vertex Array)
                </label>
                <input
                  type="text"
                  value={formData.coordinates}
                  onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                  placeholder="[[150, 420], [800, 420], [800, 560], [150, 560]]"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition shadow-xs"
                >
                  Create Virtual Fence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

