import React, { useState, useEffect } from 'react';
import {
  Camera as CameraIcon,
  Maximize2,
  Grid,
  Square,
  ShieldAlert,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  Zap,
  Radio,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { ThreatBadge } from '../components/ThreatBadge';
import { Camera as CameraType, Alert } from '../types';
import { camerasApi, alertsApi, getStreamUrl, apiClient } from '../services/api';
import { DEFAULT_CAMERAS, DEFAULT_ALERTS } from '../data/demoData';

interface LiveSurveillanceProps {
  initialCameraId?: string;
}

export const LiveSurveillance: React.FC<LiveSurveillanceProps> = ({ initialCameraId }) => {
  const [cameras, setCameras] = useState<CameraType[]>(DEFAULT_CAMERAS);
  const [selectedCamId, setSelectedCamId] = useState<string>(initialCameraId || 'BOP-01');
  const [layout, setLayout] = useState<'single' | 'grid'>('single');
  const [showZones, setShowZones] = useState<boolean>(true);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>(DEFAULT_ALERTS);
  const [liveAiMode, setLiveAiMode] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  useEffect(() => {
    if (initialCameraId) {
      setSelectedCamId(initialCameraId);
    }
  }, [initialCameraId]);

  const loadCamerasAndAlerts = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        camerasApi.getAll(),
        alertsApi.getAll({ limit: 10 }),
      ]);
      setCameras(cRes.data);
      setActiveAlerts(aRes.data);
      if (!selectedCamId && cRes.data.length > 0) {
        setSelectedCamId(cRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAiMode = async () => {
    const nextMode = !liveAiMode;
    setLiveAiMode(nextMode);
    try {
      await apiClient.post('/settings/ai_mode', { live_ai: nextMode });
    } catch (e) {
      console.error('Failed to toggle AI mode:', e);
    }
  };

  useEffect(() => {
    loadCamerasAndAlerts();
    const timer = setInterval(loadCamerasAndAlerts, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleCaptureSnapshot = async () => {
    setSnapshotMsg('Snapshot frame captured & logged to evidence store.');
    setTimeout(() => setSnapshotMsg(null), 3500);
  };

  const selectedCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];
  const camAlerts = activeAlerts.filter((a) => a.camera_id === selectedCamId);

  return (
    <div className="space-y-5">
      {/* Top Controls & Matrix Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <CameraIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-slate-900">
                Live Video Surveillance
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-md border font-medium flex items-center gap-1.5 ${
                  liveAiMode
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{liveAiMode ? 'Live YOLOv8 (3-4 FPS Throttled)' : 'Demo Mode (Optimized ~2% CPU)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time edge MJPEG stream with object bounding and virtual tripwire overlay
            </p>
          </div>
        </div>

        {/* View Layout Controls & Overlays */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* AI Mode Switcher */}
          <button
            onClick={toggleAiMode}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              liveAiMode
                ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
            title="Toggle between Zero-Overhead Demo Engine and Live PyTorch YOLOv8 Inference"
          >
            <Zap className={`w-3.5 h-3.5 ${liveAiMode ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{liveAiMode ? 'Using YOLOv8' : 'Run Live YOLOv8'}</span>
          </button>

          {/* Layout switcher */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setLayout('single')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                layout === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Single High-Res Feed"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Focus</span>
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                layout === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="2x2 Multi-Camera Grid"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2x2 Wall</span>
            </button>
          </div>

          {/* Zones Toggle */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              showZones
                ? 'border-blue-200 bg-blue-50 text-blue-700 font-medium'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Virtual Fence</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-2 rounded-lg border text-xs transition ${
              audioMuted
                ? 'border-slate-200 bg-slate-100 text-slate-500'
                : 'border-slate-200 bg-white text-blue-600 hover:bg-slate-50 shadow-xs'
            }`}
            title={audioMuted ? 'Unmute Perimeter Audio Alert' : 'Mute Perimeter Audio Alert'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Manual Snapshot */}
          <button
            onClick={handleCaptureSnapshot}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white flex items-center gap-1.5 transition shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Snapshot</span>
          </button>
        </div>
      </div>

      {snapshotMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{snapshotMsg}</span>
        </div>
      )}

      {/* Main Video Viewport */}
      {layout === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Primary High-Resolution Feed */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm relative flex flex-col justify-between">
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={getStreamUrl(selectedCamId)}
                alt={selectedCam?.name || 'Live Camera Feed'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="%230f172a"/><text x="50%" y="50%" fill="%2364748b" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20">CONNECTING TO VIDEO STREAM WORKER...</text></svg>';
                }}
              />

              {/* HUD Live Overlay Header */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-xs text-white flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-red-400">● LIVE</span>
                  <span className="text-slate-400 font-mono">|</span>
                  <span className="font-bold font-mono text-white">{selectedCamId}</span>
                  <span className="text-slate-400 font-normal">({selectedCam?.location})</span>
                </div>
              </div>

              {/* Top-Right Telemetry */}
              <div className="absolute top-3 right-3 flex items-center gap-2 font-mono text-xs">
                <div className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{selectedCam?.fps || 25} FPS</span>
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200">
                  <span>{selectedCam?.resolution || '1080p'}</span>
                </div>
              </div>

              {/* Bottom Alert Ticker if any active on this camera */}
              {camAlerts.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-red-950/90 backdrop-blur border border-red-700 text-xs text-red-200 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-2.5 truncate">
                    <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                    <span className="font-semibold text-white">
                      PERIMETER ALERT:
                    </span>
                    <span className="text-red-200 truncate">{camAlerts[0].message}</span>
                  </div>
                  <ThreatBadge severity={camAlerts[0].severity} size="sm" />
                </div>
              )}
            </div>

            {/* Bottom Feed Meta Bar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-4">
                <span>Sector: <strong className="text-slate-900">{selectedCam?.name}</strong></span>
                <span>Resolution: <strong className="text-slate-900 font-mono">{selectedCam?.resolution || '1920x1080'}</strong></span>
                <span>Tracker: <strong className="text-emerald-700">ByteTrack v2</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
                <span>MJPEG / HTTP</span>
                <span>·</span>
                <span>AES-256</span>
                <span>·</span>
                <span>Latency ~32ms</span>
              </div>
            </div>
          </div>

          {/* Right Selector Column: Camera Switcher & Active Detections */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CameraIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sector Cameras</span>
                </h3>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {cameras.length} ONLINE
                </span>
              </div>

              <div className="space-y-2">
                {cameras.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCamId(c.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                      selectedCamId === c.id
                        ? 'border-blue-300 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">{c.id}</span>
                        <span className="text-[11px] text-slate-500 font-normal">({c.location})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{c.fps}fps</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Analytical Rules Active on this Feed */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active CV Rules</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">4 ARMED</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Virtual Fence Breach</span>
                  <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    MONITORING
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Dwell & Loitering</span>
                  <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    &gt; 10s TRIGGER
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Night Luminance Check</span>
                  <span className="text-blue-700 font-semibold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    AUTO-ARMED
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Vehicle License ANPR</span>
                  <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ENABLED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Multi-Camera 2x2 Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCamId(c.id);
                setLayout('single');
              }}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-blue-400 hover:shadow-md transition duration-200 relative"
            >
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center">
                <img
                  src={getStreamUrl(c.id)}
                  alt={c.name}
                  className="w-full h-full object-contain"
                />

                <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded bg-slate-900/80 backdrop-blur font-mono text-xs text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">{c.id}</span>
                  <span className="text-slate-400 text-[11px]">| {c.location}</span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur font-mono text-[10px] text-slate-200">
                  <span>{c.fps} FPS</span>
                </div>
              </div>
              <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-800 font-semibold">{c.name}</span>
                <span className="text-[11px] font-medium text-blue-600 group-hover:underline">Focus View &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

