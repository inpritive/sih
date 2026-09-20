import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { TrajectorySearch } from './components/TrajectorySearch';
import { AnalyticsView } from './components/AnalyticsView';
import { AlertsPanel } from './components/AlertsPanel';
import { BlacklistModal } from './components/BlacklistModal';
import { CameraFeedsView } from './components/CameraFeedsView';
import { api } from './services/api';
import { alertsWs } from './services/alertsWebSocket';
import { ShieldAlert, Copy, X } from 'lucide-react';

export function App() {
  // Navigation & View State: 'trajectory' | 'analytics' | 'alerts'
  const [activeTab, setActiveTab] = useState('trajectory');

  // Core Data State
  const [cameras, setCameras] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [lastAnalyticsSync, setLastAnalyticsSync] = useState('');

  // Trajectory Search State
  const [activeTrajectory, setActiveTrajectory] = useState(null);
  const [trajectoryLoading, setTrajectoryLoading] = useState(false);
  const [trajectoryError, setTrajectoryError] = useState(null);

  // Live Alerts State
  const [alerts, setAlerts] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [latestFloatingAlert, setLatestFloatingAlert] = useState(null);
  
  // Camera Feeds State
  const [latestSightings, setLatestSightings] = useState({});

  // Modal State
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);

  // 1. Initial Load: Cameras & Analytics
  const loadCameras = useCallback(async () => {
    try {
      const data = await api.getCameras();
      setCameras(data || []);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.getAnalyticsSummary();
      setAnalytics(data);
      setLastAnalyticsSync(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCameras();
    loadAnalytics();

    // Auto-refresh analytics summary every 10 seconds
    const interval = setInterval(() => {
      loadAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadCameras, loadAnalytics]);

  const activeTabRef = React.useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // 2. Connect to Live WebSocket on mount
  useEffect(() => {
    alertsWs.init();

    const unsubscribe = alertsWs.subscribe((newAlert) => {
      // Always update latest sighting for the specific camera feed
      setLatestSightings((prev) => ({
        ...prev,
        [newAlert.camera_id]: {
          plate: newAlert.plate,
          confidence: newAlert.confidence,
          timestamp: newAlert.timestamp
        }
      }));

      // If it is just a regular sighting, do not trigger alert popups
      if (newAlert.type === 'sighting') {
        return;
      }

      // Handle actual alerts (blacklist/clone)
      setAlerts((prev) => [newAlert, ...prev]);

      // If user is not on alerts tab, increment counter & display floating toast
      if (activeTabRef.current !== 'alerts') {
        setUnreadAlerts((prev) => prev + 1);
        setLatestFloatingAlert(newAlert);

        // Auto-dismiss floating toast after 5s
        setTimeout(() => {
          setLatestFloatingAlert((curr) => (curr === newAlert ? null : curr));
        }, 5000);
      }
    });

    return () => {
      unsubscribe();
      alertsWs.cleanup();
    };
  }, []);

  // Reset unread count when viewing alerts tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'alerts') {
      setUnreadAlerts(0);
      setLatestFloatingAlert(null);
    }
  };

  // 3. Search Trajectory for a Plate
  const handleSearchTrajectory = async (plate) => {
    setTrajectoryLoading(true);
    setTrajectoryError(null);

    try {
      const result = await api.getPlateTrajectory(plate);
      if (!result || !result.sightings || result.sightings.length === 0) {
        setActiveTrajectory(null);
        setTrajectoryError(`No recorded camera sightings found for license plate: ${plate}`);
      } else {
        setActiveTrajectory(result);
        setTrajectoryError(null);
      }
    } catch (err) {
      console.error('Error fetching plate trajectory:', err);
      setActiveTrajectory(null);
      setTrajectoryError(err.message || `Failed to fetch trajectory for ${plate}`);
    } finally {
      setTrajectoryLoading(false);
    }
  };

  // 4. Quick Track from Alert
  const handleTrackFromAlert = (plate) => {
    setActiveTab('trajectory');
    handleSearchTrajectory(plate);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        unreadAlertsCount={unreadAlerts}
        onOpenBlacklistModal={() => setIsBlacklistModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="main-workspace">
        {/* Left/Center: Leaflet Map View */}
        <MapView
          cameras={cameras}
          trajectory={activeTrajectory}
          analytics={analytics}
          onClearTrajectory={() => setActiveTrajectory(null)}
        />

        {/* Floating Real-Time Alert Toast (when not on Alerts tab) */}
        {latestFloatingAlert && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1500,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 18px',
              borderRadius: '8px',
              background:
                latestFloatingAlert.type === 'blacklist'
                  ? 'rgba(244, 63, 94, 0.95)'
                  : 'rgba(245, 158, 11, 0.95)',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              animation: 'slideInAlert 0.3s ease',
              cursor: 'pointer',
            }}
            onClick={() => handleTrackFromAlert(latestFloatingAlert.plate)}
          >
            {latestFloatingAlert.type === 'blacklist' ? (
              <ShieldAlert size={20} />
            ) : (
              <Copy size={20} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {latestFloatingAlert.type === 'blacklist'
                  ? 'CRITICAL: BLACKLIST VEHICLE DETECTED'
                  : 'ANOMALY: CLONE VEHICLE DETECTED'}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                Plate: <strong>{latestFloatingAlert.plate}</strong> •{' '}
                {latestFloatingAlert.reason}
              </div>
            </div>
            <button
              style={{
                marginLeft: '8px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLatestFloatingAlert(null);
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Right Sidebar: Active Tab View */}
        {activeTab === 'trajectory' && (
          <TrajectorySearch
            onSearch={handleSearchTrajectory}
            trajectory={activeTrajectory}
            loading={trajectoryLoading}
            error={trajectoryError}
            cameras={cameras}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            cameras={cameras}
            loading={analyticsLoading}
            lastUpdated={lastAnalyticsSync}
            onRefresh={loadAnalytics}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            onTrackPlate={handleTrackFromAlert}
            onClearAlerts={() => setAlerts([])}
            cameras={cameras}
          />
        )}

        {activeTab === 'feeds' && (
          <div className="side-panel" style={{ width: '100%' }}>
            <CameraFeedsView cameras={cameras} latestSightings={latestSightings} />
          </div>
        )}
      </div>

      {/* Blacklist Modal */}
      <BlacklistModal
        isOpen={isBlacklistModalOpen}
        onClose={() => setIsBlacklistModalOpen(false)}
        onBlacklistSuccess={(plate) => {
          // Trigger search or notification
          console.log(`Plate ${plate} registered to blacklist.`);
        }}
      />
    </div>
  );
}
export default App;
