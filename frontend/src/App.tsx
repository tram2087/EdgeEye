import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { Overview } from './pages/Overview';
import { LiveSurveillance } from './pages/LiveSurveillance';
import { Alerts } from './pages/Alerts';
import { EventExplorer } from './pages/EventExplorer';
import { ANPR } from './pages/ANPR';
import { Analytics } from './pages/Analytics';
import { Cameras } from './pages/Cameras';
import { Zones } from './pages/Zones';
import { Settings } from './pages/Settings';
import { alertsApi } from './services/api';
import { Alert } from './types';

const VALID_TABS: NavTab[] = [
  'overview',
  'live',
  'alerts',
  'events',
  'anpr',
  'analytics',
  'cameras',
  'zones',
  'settings',
];

export const App: React.FC = () => {
  const getInitialTab = (): NavTab => {
    const h = window.location.hash.replace('#', '') as NavTab;
    return VALID_TABS.includes(h) ? h : 'overview';
  };

  const [currentTab, setCurrentTab] = useState<NavTab>(getInitialTab);
  const [selectedLiveCamera, setSelectedLiveCamera] = useState<string | undefined>(undefined);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('operator');

  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '') as NavTab;
      if (VALID_TABS.includes(h)) {
        setCurrentTab(h);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
  };

  // Synthesized audio alert siren using browser Web Audio API
  const playAlertSiren = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context might require initial user gesture
    }
  };

  // Fetch alerts & update counts
  const fetchAlertMetrics = async () => {
    try {
      const res = await alertsApi.getAll({ status: 'UNACKNOWLEDGED', limit: 20 });
      setActiveAlerts(res.data);
      const crit = res.data.filter((a) => a.severity === 'CRITICAL').length;
      if (crit > criticalCount) {
        playAlertSiren();
      }
      setCriticalCount(crit);
    } catch (e) {
      // Ignore background network polling hiccup
    }
  };

  // Setup WebSocket with Polling Fallback
  useEffect(() => {
    fetchAlertMetrics();
    const pollInterval = setInterval(fetchAlertMetrics, 12000);

    // WebSocket Attempt
    let socket: WebSocket | null = null;
    try {
      const explicitWs = (import.meta.env.VITE_WS_BASE_URL as string) || '';
      const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || '';
      let wsUrl: string;
      if (explicitWs) {
        wsUrl = explicitWs.replace(/\/$/, '') + '/ws/alerts';
      } else if (apiBase) {
        const wsProto = apiBase.startsWith('https') ? 'wss:' : 'ws:';
        const host = apiBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
        wsUrl = `${wsProto}//${host}/ws/alerts`;
      } else {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${proto}//${window.location.host}/ws/alerts`;
      }
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const alertData = JSON.parse(event.data);
          if (alertData.severity === 'CRITICAL') {
            playAlertSiren();
          }
          fetchAlertMetrics();
        } catch (e) {}
      };
    } catch (err) {
      console.log('WebSocket not active; relying on resilient REST polling.');
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) socket.close();
    };
  }, []);

  const handleNavigateToLive = (cameraId?: string) => {
    if (cameraId) {
      setSelectedLiveCamera(cameraId);
    }
    setCurrentTab('live');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Enterprise Header */}
      <Navbar
        activeAlertsCount={activeAlerts.length}
        criticalAlertsCount={criticalCount}
        onOpenAlerts={() => handleTabChange('alerts')}
        onOpenLogin={() => setIsLoginOpen(true)}
        isLoggedIn={isLoggedIn}
        username={username}
      />

      {/* Main Content Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Dark Navy Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleTabChange(tab)}
          activeAlertsCount={activeAlerts.length}
        />

        {/* Page Content Viewport with light enterprise background */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8fafc]">
          {currentTab === 'overview' && (
            <Overview
              onNavigateToLive={handleNavigateToLive}
              onNavigateToAlerts={() => handleTabChange('alerts')}
            />
          )}

          {currentTab === 'live' && (
            <LiveSurveillance initialCameraId={selectedLiveCamera} />
          )}

          {currentTab === 'alerts' && <Alerts />}

          {currentTab === 'events' && <EventExplorer />}

          {currentTab === 'anpr' && <ANPR />}

          {currentTab === 'analytics' && <Analytics />}

          {currentTab === 'cameras' && <Cameras />}

          {currentTab === 'zones' && <Zones />}

          {currentTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Operator Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setIsLoggedIn(true);
          setUsername(user);
        }}
      />
    </div>
  );
};
