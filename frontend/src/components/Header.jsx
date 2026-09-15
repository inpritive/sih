import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  BarChart3, 
  Navigation, 
  Bell, 
  Server, 
  PlusCircle 
} from 'lucide-react';
import { config, setMockMode } from '../config';
import { alertsWs } from '../services/alertsWebSocket';

export function Header({ 
  activeTab, 
  setActiveTab, 
  unreadAlertsCount, 
  onOpenBlacklistModal 
}) {
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isMock, setIsMock] = useState(config.USE_MOCK);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const unsub = alertsWs.onStatusChange((status) => {
      setWsStatus(status);
    });

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const handleToggleMock = () => {
    const nextMock = !isMock;
    setIsMock(nextMock);
    setMockMode(nextMock);
    alertsWs.init(); // Reinitialize socket to point to appropriate source
  };

  return (
    <header className="app-header">
      {/* Brand & Identity */}
      <div className="brand-section">
        <div className="brand-logo">
          <Radio size={22} />
        </div>
        <div>
          <div className="brand-title">SURVEILLANCE HUB</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-badge">SIH #26127</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>City ANPR Tracking</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          id="tab-trajectory"
          className={`nav-tab-btn ${activeTab === 'trajectory' ? 'active' : ''}`}
          onClick={() => setActiveTab('trajectory')}
        >
          <Navigation size={16} />
          <span>Trajectory Search</span>
        </button>

        <button 
          id="tab-analytics"
          className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Analytics</span>
        </button>

        <button 
          id="tab-alerts"
          className={`nav-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          <span>Live Alerts</span>
          {unreadAlertsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--color-blacklist)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: '10px',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)'
            }}>
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </nav>

      {/* Actions & Status */}
      <div className="header-actions">
        {/* Real-time Clock */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {currentTime || '00:00:00 IST'}
        </div>

        {/* WebSocket Connection Status */}
        <div className="ws-status-badge" title={`WebSocket: ${wsStatus}`}>
          <span className={`status-dot ${wsStatus}`}></span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {wsStatus === 'mock' ? 'WS (Simulated)' : wsStatus === 'connected' ? 'WS Live' : wsStatus === 'connecting' ? 'WS Connecting' : 'WS Offline'}
          </span>
        </div>

        {/* Mock / Live Backend Switcher */}
        <button 
          id="btn-toggle-mock"
          className="mock-mode-toggle"
          onClick={handleToggleMock}
          title="Click to toggle between simulated Mock API and Live Backend URL"
        >
          <Server size={14} style={{ color: isMock ? 'var(--color-cyan)' : 'var(--color-green)' }} />
          <span>{isMock ? 'Mode: Mock Data' : 'Mode: Live Backend'}</span>
        </button>

        {/* Blacklist Modal Trigger */}
        <button 
          id="btn-open-blacklist"
          className="btn-danger"
          onClick={onOpenBlacklistModal}
          title="Add a suspicious license plate to blacklist"
        >
          <ShieldAlert size={15} />
          <span>+ Blacklist</span>
        </button>
      </div>
    </header>
  );
}
