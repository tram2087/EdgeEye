import axios from 'axios';
import {
  Camera,
  Zone,
  Alert,
  Event,
  PlateRecord,
  WatchlistEntry,
  SystemStatus,
  AnalyticsSummary,
  SystemSettings
} from '../types';

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';
export const API_SERVER_URL = RAW_BASE ? RAW_BASE.replace(/\/$/, '') : '';
export const API_BASE = API_SERVER_URL ? `${API_SERVER_URL}/api` : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStreamUrl = (cameraId: string) => `${API_BASE}/cameras/${cameraId}/stream`;
export const getPreviewUrl = (cameraId: string, timestamp?: number) =>
  `${API_BASE}/cameras/${cameraId}/preview${timestamp ? `?t=${timestamp}` : ''}`;
export const getEvidenceUrl = (snapshotPath?: string) => {
  if (!snapshotPath) return null;
  if (snapshotPath.startsWith('http://') || snapshotPath.startsWith('https://')) {
    return snapshotPath;
  }
  const cleanPath = snapshotPath.replace(/^\/+/, '');
  return API_SERVER_URL ? `${API_SERVER_URL}/evidence/${cleanPath}` : `/evidence/${cleanPath}`;
};

// Authentication
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  getMe: () => apiClient.get('/auth/me'),
};

// Cameras
export const camerasApi = {
  getAll: () => apiClient.get<Camera[]>('/cameras'),
  getById: (id: string) => apiClient.get<Camera>(`/cameras/${id}`),
  create: (data: Partial<Camera>) => apiClient.post<Camera>('/cameras', data),
  update: (id: string, data: Partial<Camera>) => apiClient.put<Camera>(`/cameras/${id}`, data),
  delete: (id: string) => apiClient.delete(`/cameras/${id}`),
  testConnection: (id: string) => apiClient.post<{ status: string; message: string; latency_ms?: number }>(`/cameras/${id}/test`),
};

// Alerts
export const alertsApi = {
  getAll: (params?: { camera_id?: string; severity?: string; status?: string; limit?: number }) =>
    apiClient.get<Alert[]>('/alerts', { params }),
  updateStatus: (id: number, status: string, acknowledged_by?: string) =>
    apiClient.patch<Alert>(`/alerts/${id}`, { status, acknowledged_by }),
  acknowledgeAll: () => apiClient.post('/alerts/acknowledge-all'),
  getStats: () => apiClient.get('/alerts/stats'),
};

// Events
export const eventsApi = {
  getAll: (params?: { camera_id?: string; event_type?: string; severity?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<Event[]>('/events', { params }),
  getById: (id: number) => apiClient.get<Event>(`/events/${id}`),
};

// Zones
export const zonesApi = {
  getAll: (camera_id?: string) => apiClient.get<Zone[]>('/zones', { params: { camera_id } }),
  create: (data: Partial<Zone>) => apiClient.post<Zone>('/zones', data),
  update: (id: number, data: Partial<Zone>) => apiClient.put<Zone>(`/zones/${id}`, data),
  delete: (id: number) => apiClient.delete(`/zones/${id}`),
};

// ANPR
export const anprApi = {
  getPlates: (params?: { status?: string; camera_id?: string; limit?: number }) =>
    apiClient.get<PlateRecord[]>('/anpr', { params }),
  processPlate: (formData: FormData) =>
    apiClient.post<PlateRecord>('/anpr/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Watchlist
export const watchlistApi = {
  getAll: () => apiClient.get<WatchlistEntry[]>('/watchlist'),
  add: (data: Partial<WatchlistEntry>) => apiClient.post<WatchlistEntry>('/watchlist', data),
  delete: (id: number) => apiClient.delete(`/watchlist/${id}`),
};

// Analytics
export const analyticsApi = {
  getSummary: () => apiClient.get<AnalyticsSummary>('/analytics/summary'),
};

export const systemApi = {
  getHealth: () => apiClient.get('/health'),
  getStatus: () => apiClient.get<SystemStatus>('/system/status'),
  getSettings: () => apiClient.get<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) => apiClient.post('/settings', data),
  setAiMode: (enabled: boolean) => apiClient.post('/settings/ai_mode', { enabled }),
};
