import React, { useState, useEffect } from 'react';
import {
  Car,
  ShieldAlert,
  Search,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  AlertOctagon,
  Clock,
  RefreshCw,
  Camera as CameraIcon,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { PlateRecord, WatchlistEntry } from '../types';
import { anprApi, watchlistApi } from '../services/api';

export const ANPR: React.FC = () => {
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual OCR testing form
  const [testPlateText, setTestPlateText] = useState('DEMO-4821');
  const [testVehicleType, setTestVehicleType] = useState('Car');
  const [testCameraId, setTestCameraId] = useState('CHECKPOST-01');
  const [processingManual, setProcessingManual] = useState(false);
  const [manualResult, setManualResult] = useState<string | null>(null);

  // Add Watchlist Modal / Form
  const [newWatchlistPlate, setNewWatchlistPlate] = useState('');
  const [newWatchlistReason, setNewWatchlistReason] = useState('');

  const loadData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        anprApi.getPlates({ limit: 50 }),
        watchlistApi.getAll(),
      ]);
      setPlates(pRes.data);
      setWatchlist(wRes.data);
    } catch (e) {
      console.error('Failed to load ANPR data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingManual(true);
    setManualResult(null);
    try {
      const formData = new FormData();
      formData.append('camera_id', testCameraId);
      formData.append('vehicle_type', testVehicleType);
      formData.append('plate_text_manual', testPlateText);

      const res = await anprApi.processPlate(formData);
      setManualResult(
        `Plate verified: ${res.data.plate_number} | Status: ${res.data.status} (Confidence: ${(
          res.data.confidence * 100
        ).toFixed(1)}%)`
      );
      loadData();
    } catch (err: any) {
      setManualResult('Processing failed.');
    } finally {
      setProcessingManual(false);
    }
  };

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistPlate) return;
    try {
      await watchlistApi.add({
        plate_number: newWatchlistPlate.toUpperCase(),
        reason: newWatchlistReason || 'Suspicious vehicle activity flag',
        severity: 'CRITICAL',
        active: true,
      });
      setNewWatchlistPlate('');
      setNewWatchlistReason('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWatchlist = async (id: number) => {
    try {
      await watchlistApi.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const watchlistMatchCount = plates.filter((p) => p.status === 'WATCHLIST').length;
  const authorizedCount = plates.filter((p) => p.status === 'AUTHORIZED').length;
  const avgConfidence =
    plates.length > 0
      ? (plates.reduce((acc, p) => acc + (p.confidence || 0.95), 0) / plates.length) * 100
      : 96.4;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                ANPR & Vehicle Watchlist Intelligence
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                OCR Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated Number Plate Recognition, high-speed optical character recognition & threat cross-referencing
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Sync ANPR</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Scanned Vehicles</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{plates.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Car className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-red-700 block text-xs font-medium">Watchlist Matches</span>
            <span className="text-2xl font-bold text-red-800 mt-1 block">{watchlistMatchCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-100 text-red-700">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-emerald-700 block text-xs font-medium">Authorized Patrols</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">{authorizedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">OCR Accuracy Rate</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block font-mono">{avgConfidence.toFixed(1)}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Sliders className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Grid: Manual Test Processor & Active Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Interactive ANPR Test Pipeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Interactive ANPR Verification
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Execute plate localization, adaptive thresholding, and OCR inference against the border database.
          </p>

          <form onSubmit={handleManualProcess} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Registration Plate Number</label>
              <input
                type="text"
                value={testPlateText}
                onChange={(e) => setTestPlateText(e.target.value.toUpperCase())}
                placeholder="e.g. DEMO-4821 or PB-10-AZ-9988"
                required
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold tracking-widest text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Vehicle Type</label>
                <select
                  value={testVehicleType}
                  onChange={(e) => setTestVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Car">Sedan / Patrol</option>
                  <option value="SUV">Military 4x4</option>
                  <option value="Truck">Logistics Truck</option>
                  <option value="Bus">Transit Bus</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Camera Node</label>
                <select
                  value={testCameraId}
                  onChange={(e) => setTestCameraId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                >
                  <option value="CHECKPOST-01">CHECKPOST-01</option>
                  <option value="BOP-01">BOP-01</option>
                  <option value="BOP-02">BOP-02</option>
                  <option value="BOP-03">BOP-03</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={processingManual}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {processingManual ? 'Extracting & Validating...' : 'Trigger ANPR Scan'}
            </button>
          </form>

          {manualResult && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-semibold block">Scan Result:</span>
              <p className="font-mono text-[11px]">{manualResult}</p>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Active Watchlist Manager */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Border Security Watchlist ({watchlist.length} Flagged Targets)
              </h2>
            </div>
          </div>

          {/* Add to Watchlist Inline Form */}
          <form onSubmit={handleAddWatchlist} className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <input
              type="text"
              placeholder="Target Plate (e.g. DEMO-9900)"
              value={newWatchlistPlate}
              onChange={(e) => setNewWatchlistPlate(e.target.value.toUpperCase())}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-red-500 uppercase flex-1 min-w-36 font-mono font-bold tracking-wider"
            />
            <input
              type="text"
              placeholder="Threat rationale / intelligence notes..."
              value={newWatchlistReason}
              onChange={(e) => setNewWatchlistReason(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-red-500 flex-2 min-w-48"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Flag Target</span>
            </button>
          </form>

          {/* Watchlist Table */}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Target Plate</th>
                  <th className="py-2.5 px-3">Intelligence Rationale</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {watchlist.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-red-700 tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 font-mono text-xs">
                        {w.plate_number}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                      {w.reason}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
                        {w.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteWatchlist(w.id)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-600 transition"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Plates Scanned Feed */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Live Optical Recognition Feed ({plates.length} Records)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Real-time cross-reference against vehicle watchlist
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Registration Plate</th>
                <th className="py-3.5 px-4">Vehicle Type</th>
                <th className="py-3.5 px-4">Camera Sector</th>
                <th className="py-3.5 px-4">OCR Confidence</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Watchlist Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No license plates scanned yet. Use the verification tool above to trigger ANPR scans.
                  </td>
                </tr>
              ) : (
                plates.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition ${
                      p.status === 'WATCHLIST' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold tracking-widest whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 font-mono text-xs shadow-xs">
                        {p.plate_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{p.vehicle_type}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CameraIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{p.camera_id}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.round(p.confidence * 100)}%` }}
                          />
                        </div>
                        <span>{(p.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{new Date(p.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(p.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.status === 'WATCHLIST'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : p.status === 'AUTHORIZED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

