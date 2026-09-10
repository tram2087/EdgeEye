import React, { useState, useEffect } from 'react';
import {
  Camera as CameraIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Wifi,
  Play,
  Activity,
  Cpu
} from 'lucide-react';
import { Camera } from '../types';
import { camerasApi } from '../services/api';

export const Cameras: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ id: string; status: string; message: string } | null>(null);

  // Add/Edit modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCam, setEditingCam] = useState<Camera | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    source_type: 'DEMO_VIDEO',
    source_url: '',
    fps: 25,
    resolution: '1920x1080',
  });

  const loadCameras = async () => {
    try {
      const res = await camerasApi.getAll();
      setCameras(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleTestConnection = async (id: string) => {
    try {
      setTestResult({ id, status: 'TESTING', message: 'Initiating RTSP / socket handshake...' });
      const res = await camerasApi.testConnection(id);
      setTestResult({ id, status: res.data.status, message: res.data.message });
      setTimeout(() => setTestResult(null), 5000);
    } catch (e: any) {
      setTestResult({ id, status: 'FAILED', message: 'Connection timeout or socket closed.' });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete camera node ${id}?`)) return;
    try {
      await camerasApi.delete(id);
      loadCameras();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingCam(null);
    setFormData({
      id: `CAM-0${cameras.length + 1}`,
      name: '',
      location: '',
      source_type: 'DEMO_VIDEO',
      source_url: '',
      fps: 25,
      resolution: '1920x1080',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cam: Camera) => {
    setEditingCam(cam);
    setFormData({
      id: cam.id,
      name: cam.name,
      location: cam.location,
      source_type: cam.source_type,
      source_url: cam.source_url || '',
      fps: cam.fps,
      resolution: cam.resolution,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCam) {
        await camerasApi.update(editingCam.id, formData as any);
      } else {
        await camerasApi.create(formData as any);
      }
      setIsModalOpen(false);
      loadCameras();
    } catch (e) {
      console.error(e);
    }
  };

  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const rtspCount = cameras.filter((c) => c.source_type === 'RTSP').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <CameraIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold text-slate-900">
                Camera Sentry Fleet Management
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                {onlineCount} / {cameras.length} Online
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hardware-agnostic ingest: RTSP/IP CCTV, Synthetic Simulation, Local Storage, or USB Webcams
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sentry Node</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Registered Sentries</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{cameras.length} Nodes</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <CameraIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-emerald-700 block text-xs font-medium">Active Stream Workers</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">{onlineCount} Active</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">RTSP / ONVIF Interfaces</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{rtspCount} Configured</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Wifi className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Synthetic Simulation</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">4 Feeds Ready</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* RTSP Architecture Notice */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
        <Wifi className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-950">Software-Defined Hardware Agnostic Architecture:</span>
          <p className="text-slate-600 mt-0.5">
            Any legacy analogue CCTV, NVR, DVR, or IP camera streaming via RTSP/ONVIF (<code className="text-blue-900 font-mono bg-blue-100/70 px-1 py-0.5 rounded">rtsp://user:pass@ip:554/stream</code>) can be attached with zero proprietary vendor lock-in. For demonstrations, EdgeEye provides high-fidelity synthetic border patrol feeds running at minimal CPU usage.
          </p>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between shadow-xs ${
            testResult.status === 'ONLINE' || testResult.status === 'SUCCESS'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : testResult.status === 'TESTING'
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Node {testResult.id}: {testResult.message}</span>
          </div>
        </div>
      )}

      {/* Camera Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-slate-900">{cam.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {cam.status}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800 mt-1">{cam.name}</h3>
                <p className="text-[11px] text-slate-500">{cam.location}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cam)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                  title="Edit Camera"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cam.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                  title="Delete Camera"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">SOURCE</span>
                <span className="text-blue-700 font-semibold font-mono text-[11px]">{cam.source_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">FRAME RATE</span>
                <span className="text-slate-800 font-mono text-[11px]">{cam.fps} FPS</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">RESOLUTION</span>
                <span className="text-slate-800 font-mono text-[11px]">{cam.resolution}</span>
              </div>
            </div>

            {cam.source_url && (
              <div className="text-xs text-slate-500 truncate">
                <span>URL: </span>
                <code className="text-slate-700 font-mono">{cam.source_url}</code>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Created: {new Date(cam.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleTestConnection(cam.id)}
                className="px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
              >
                <Play className="w-3 h-3 text-emerald-600" />
                <span>Test Handshake</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {editingCam ? `Edit Camera Node: ${editingCam.id}` : 'Register New Sentry Node'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Camera Identifier (e.g. BOP-04)</label>
                <input
                  type="text"
                  value={formData.id}
                  disabled={!!editingCam}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Camera Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sector Delta — West Perimeter Watch"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Geographic Location / Sector</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Sector Delta"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Feed Source Type</label>
                  <select
                    value={formData.source_type}
                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="DEMO_VIDEO">Synthetic Border Simulation</option>
                    <option value="LOCAL_VIDEO">Local Video File (MP4/AVI)</option>
                    <option value="WEBCAM">USB / Integrated Webcam</option>
                    <option value="RTSP">Live IP / RTSP Stream</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Resolution</label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  >
                    <option value="1920x1080">1080p (Full HD)</option>
                    <option value="1280x720">720p (HD)</option>
                    <option value="640x480">480p (VGA)</option>
                  </select>
                </div>
              </div>

              {formData.source_type === 'RTSP' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">RTSP Stream URI</label>
                  <input
                    type="text"
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    placeholder="rtsp://admin:pass@192.168.1.120:554/h264Preview_01_main"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              )}

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
                  {editingCam ? 'Save Changes' : 'Register Sentry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
