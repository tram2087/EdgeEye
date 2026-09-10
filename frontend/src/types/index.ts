export type Severity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'RESOLVED';
export type EventType = 
  | 'PERSON_DETECTED'
  | 'VEHICLE_DETECTED'
  | 'INTRUSION'
  | 'NIGHT_MOVEMENT'
  | 'PLATE_DETECTED'
  | 'WATCHLIST_MATCH'
  | 'LOITERING'
  | 'WRONG_DIRECTION'
  | 'UNATTENDED_OBJECT';

export interface Camera {
  id: string;
  name: string;
  location: string;
  source_type: 'DEMO_VIDEO' | 'LOCAL_VIDEO' | 'WEBCAM' | 'RTSP';
  source_url?: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  fps: number;
  resolution: string;
  is_active: boolean;
  created_at: string;
  people_count: number;
  vehicle_count: number;
  active_alerts_count: number;
}

export interface Zone {
  id: number;
  camera_id: string;
  name: string;
  zone_type: 'RESTRICTED' | 'WARNING' | 'PERIMETER';
  coordinates: string; // JSON array of [x, y]
  severity: Severity;
  enabled: boolean;
  created_at: string;
}

export interface Alert {
  id: number;
  camera_id: string;
  event_id?: number;
  title: string;
  message: string;
  severity: Severity;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  snapshot_path?: string;
}

export interface Event {
  id: number;
  camera_id: string;
  event_type: EventType;
  object_id?: string;
  confidence: number;
  severity: Severity;
  status: string;
  snapshot_path?: string;
  metadata_json?: string;
  timestamp: string;
}

export interface PlateRecord {
  id: number;
  plate_number: string;
  vehicle_type: string;
  camera_id: string;
  timestamp: string;
  confidence: number;
  status: 'AUTHORIZED' | 'WATCHLIST' | 'UNKNOWN';
  snapshot_path?: string;
}

export interface WatchlistEntry {
  id: number;
  plate_number: string;
  reason: string;
  severity: Severity;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface SystemStatus {
  platform: string;
  mode: string;
  ai_status: string;
  ai_framework: string;
  cpu_usage_pct: number;
  memory_usage_pct: number;
  storage_available_gb: number;
  active_stream_workers: number;
  anpr_status: string;
  virtual_fence_status: string;
  night_detection_status: string;
}

export interface AnalyticsSummary {
  kpi: {
    total_cameras: number;
    active_cameras: number;
    persons_detected: number;
    vehicles_detected: number;
    active_alerts: number;
    critical_alerts: number;
    total_plates_scanned: number;
  };
  timeline: Array<{
    time: string;
    persons: number;
    vehicles: number;
    alerts: number;
  }>;
  severity_distribution: Array<{
    name: string;
    value: number;
  }>;
  events_by_type: Array<{
    type: string;
    count: number;
  }>;
  camera_activity: Array<{
    camera_id: string;
    name: string;
    events_count: number;
    status: string;
    uptime_pct: number;
  }>;
}

export interface SystemSettings {
  detection_confidence: number;
  night_start_time: string;
  night_end_time: string;
  loitering_threshold_seconds: number;
  default_alert_severity: Severity;
  enable_sound_alerts: boolean;
  demo_mode: boolean;
  enable_gpu: boolean;
  anpr_ocr_engine: string;
}
