import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  Moon,
  Clock,
  Volume2,
  VolumeX,
  Cpu,
  Shield,
  CheckCircle,
  RefreshCw,
  Database,
  Layers,
  Zap,
  Activity,
  Server
} from 'lucide-react';
import { SystemSettings, SystemStatus } from '../types';
import { systemApi } from '../services/api';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    detection_confidence: 0.45,
    night_start_time: '20:00',
    night_end_time: '05:00',
    loitering_threshold_seconds: 10,
    default_alert_severity: 'HIGH',
    enable_sound_alerts: true,
    demo_mode: true,
    enable_gpu: false,
    anpr_ocr_engine: 'Rule-based & Regex Pipeline',
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [sRes, stRes] = await Promise.all([
          systemApi.getSettings(),
          systemApi.getStatus(),
        ]);
        setSettings(sRes.data);
        setSystemStatus(stRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await systemApi.updateSettings(settings);
      setSaveStatus('Platform configuration saved and synchronized with AI rule engine.');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                System & AI Analytic Engine Configuration
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                Profile: Defense SOC v2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrate CV confidence thresholds, loitering limits, night schedules, and edge hardware options
            </p>
          </div>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-sm animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Left 2 Cols: Core Algorithm Parameters */}
        <div className="lg:col-span-2 space-y-5">
          {/* Object Detection & Tracking Parameters */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>AI Detection & Tracking Sensitivity</span>
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-700 font-medium">
                    Detection Confidence Cutoff: <span className="text-blue-600 font-bold font-mono">{settings.detection_confidence}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Default: 0.40</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.85"
                  step="0.05"
                  value={settings.detection_confidence}
                  onChange={(e) =>
                    setSettings({ ...settings, detection_confidence: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Controls minimum probability threshold for person, car, motorcycle, truck and bus detections.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-700 font-medium">
                    Loitering Dwell Time Threshold: <span className="text-amber-600 font-bold font-mono">{settings.loitering_threshold_seconds}s</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Default: 10 seconds</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={settings.loitering_threshold_seconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      loitering_threshold_seconds: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-amber-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Duration a tracked target may remain stationary within a monitored sector before triggering an alert.
                </p>
              </div>
            </div>
          </div>

          {/* Night Detection Schedule */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Low-Light & Night Movement Operational Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Night Monitoring Commence (HH:MM)</label>
                <input
                  type="time"
                  value={settings.night_start_time}
                  onChange={(e) => setSettings({ ...settings, night_start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Night Monitoring Cease (HH:MM)</label>
                <input
                  type="time"
                  value={settings.night_end_time}
                  onChange={(e) => setSettings({ ...settings, night_end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              During this timeframe, or if average camera luminance drops below 65/255, any detected movement in border zones escalates directly to NIGHT_MOVEMENT alerts.
            </p>
          </div>

          {/* Operational Toggles */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>System Toggles & Audio Feedback</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition cursor-pointer">
                <div>
                  <span className="text-slate-800 font-semibold block">Audible Siren on Critical Alerts</span>
                  <span className="text-[11px] text-slate-500">Plays tactical alert tone when perimeter is breached</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_sound_alerts}
                  onChange={(e) =>
                    setSettings({ ...settings, enable_sound_alerts: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition cursor-pointer">
                <div>
                  <span className="text-slate-800 font-semibold block">Demo Simulation Mode</span>
                  <span className="text-[11px] text-slate-500">Supplies synthetic border patrol feeds if cameras are offline</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.demo_mode}
                  onChange={(e) =>
                    setSettings({ ...settings, demo_mode: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Commit & Apply Configuration</span>
          </button>
        </div>

        {/* Right Col: System Diagnostics & Framework Readout */}
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Platform Specifications</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">AI Inference Engine</span>
                <span className="text-slate-800 font-semibold font-mono">{systemStatus?.ai_framework || 'Ultralytics YOLOv8n + OpenCV'}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">Database Backend</span>
                <span className="text-slate-800 font-semibold font-mono">SQLite 3 (ACID Relational)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">Edge Storage Available</span>
                <span className="text-emerald-700 font-semibold font-mono">{systemStatus?.storage_available_gb || 45.2} GB Free</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">CPU Thread Budget</span>
                <span className="text-amber-700 font-semibold font-mono">2 Threads Max (PyTorch CPU Optimized)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px] font-medium uppercase tracking-wider">SIH 2026 Architecture</span>
                <span className="text-blue-700 font-semibold">Edge-Ready Software-Defined CCTV</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

