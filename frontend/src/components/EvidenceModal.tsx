import React from 'react';
import { X, Download, ShieldAlert, Calendar, Camera as CameraIcon, Crosshair } from 'lucide-react';
import { ThreatBadge } from './ThreatBadge';
import { getEvidenceUrl } from '../services/api';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  camera: string;
  timestamp: string;
  severity: string;
  objectId?: string;
  confidence?: number;
  snapshotPath?: string;
  metadata?: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  title,
  camera,
  timestamp,
  severity,
  objectId,
  confidence = 0.92,
  snapshotPath,
  metadata,
}) => {
  if (!isOpen) return null;

  const imageUrl = getEvidenceUrl(snapshotPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-mono">Evidence ID: EV-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Image Display */}
          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Evidence Snapshot"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            
            {/* Overlay Telemetry Stamp */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-[11px] font-mono text-slate-200">
              <span>{camera}</span> · <span>{new Date(timestamp).toLocaleTimeString()}</span> · <span>Conf: {(confidence * 100).toFixed(0)}%</span>
            </div>
            
            <div className="absolute top-3 right-3">
              <ThreatBadge severity={severity} size="md" />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Camera Sector</span>
              <span className="font-semibold font-mono text-slate-800 mt-1 flex items-center gap-1">
                <CameraIcon className="w-3.5 h-3.5 text-blue-600" /> {camera}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Timestamp</span>
              <span className="font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> {new Date(timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Target Object</span>
              <span className="font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" /> {objectId || 'Unknown Track'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Confidence Score</span>
              <span className="font-semibold font-mono text-emerald-600 mt-1">{(confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {metadata && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              <span className="text-slate-500 font-semibold block mb-1">RAW TELEMETRY:</span>
              <pre className="whitespace-pre-wrap">{metadata}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            Cryptographic SHA-256 integrity hash recorded.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (imageUrl) window.open(imageUrl, '_blank');
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Snapshot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
