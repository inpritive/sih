import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Copy, 
  Navigation, 
  Volume2, 
  VolumeX, 
  Filter,
  Trash2
} from 'lucide-react';

export function AlertsPanel({ 
  alerts = [], 
  onTrackPlate, 
  onClearAlerts, 
  cameras = [] 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'blacklist' | 'clone'
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const getCameraName = (camId) => {
    const cam = cameras.find((c) => c.id === camId);
    return cam ? cam.name : camId;
  };

  return (
    <aside className="side-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Bell size={18} style={{ color: 'var(--color-blacklist)' }} />
          <span>LIVE ALERTS STREAM</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Audio toggle */}
          <button
            className="floating-btn"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Alert Audio On' : 'Alert Audio Muted'}
          >
            {soundEnabled ? <Volume2 size={13} style={{ color: 'var(--color-cyan)' }} /> : <VolumeX size={13} />}
          </button>

          {/* Clear alerts */}
          {alerts.length > 0 && (
            <button
              className="floating-btn"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
              onClick={onClearAlerts}
              title="Clear Alert History"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="panel-content">
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`quick-plate-tag ${filter === 'all' ? 'active' : ''}`}
            style={{
              background: filter === 'all' ? 'rgba(0, 240, 255, 0.15)' : undefined,
              borderColor: filter === 'all' ? 'var(--color-cyan)' : undefined,
              color: filter === 'all' ? 'var(--color-cyan)' : undefined,
            }}
            onClick={() => setFilter('all')}
          >
            All ({alerts.length})
          </button>

          <button
            className={`quick-plate-tag ${filter === 'blacklist' ? 'active' : ''}`}
            style={{
              background: filter === 'blacklist' ? 'rgba(244, 63, 94, 0.2)' : undefined,
              borderColor: filter === 'blacklist' ? 'var(--color-blacklist)' : undefined,
              color: filter === 'blacklist' ? '#fda4af' : undefined,
            }}
            onClick={() => setFilter('blacklist')}
          >
            Blacklist ({alerts.filter((a) => a.type === 'blacklist').length})
          </button>

          <button
            className={`quick-plate-tag ${filter === 'clone' ? 'active' : ''}`}
            style={{
              background: filter === 'clone' ? 'rgba(245, 158, 11, 0.2)' : undefined,
              borderColor: filter === 'clone' ? 'var(--color-clone)' : undefined,
              color: filter === 'clone' ? '#fde68a' : undefined,
            }}
            onClick={() => setFilter('clone')}
          >
            Clones ({alerts.filter((a) => a.type === 'clone').length})
          </button>
        </div>

        {/* Alerts List */}
        <div className="alerts-container">
          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <Bell className="empty-state-icon" />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Listening for Live WebSocket Alerts...
              </div>
              <div style={{ fontSize: '0.78rem', maxWidth: '260px' }}>
                Incoming security events (blacklist hits, clone vehicle anomalies, impossible travel times) will appear here live.
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const isBlacklist = alert.type === 'blacklist';
              const timeString = new Date(alert.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={`${alert.plate}-${alert.timestamp}-${index}`}
                  className={`alert-card ${isBlacklist ? 'blacklist' : 'clone'}`}
                >
                  {/* Top Bar: Type Badge & Timestamp */}
                  <div className="alert-top">
                    <span className="alert-type-badge">
                      {isBlacklist ? (
                        <>
                          <ShieldAlert size={14} />
                          <span>Blacklist Hit</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Clone Anomaly</span>
                        </>
                      )}
                    </span>

                    <span className="alert-time">{timeString}</span>
                  </div>

                  {/* Plate Number & Camera Sighted */}
                  <div className="alert-plate-row">
                    <span className="alert-plate">{alert.plate}</span>
                    <span className="alert-cam">
                      📹 {getCameraName(alert.camera_id)}
                    </span>
                  </div>

                  {/* Reason Banner */}
                  <div className="alert-reason">
                    <strong style={{ color: isBlacklist ? '#f43f5e' : '#f59e0b' }}>Alert:</strong>
                    <span>{alert.reason || 'Flagged by ANPR rules'}</span>
                  </div>

                  {/* Confidence & Actions */}
                  <div className="alert-actions">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {alert.confidence !== undefined && (
                        <span>Confidence: <strong>{Math.round(alert.confidence * 100)}%</strong></span>
                      )}
                    </div>

                    <button
                      className="track-btn"
                      onClick={() => onTrackPlate(alert.plate)}
                      title={`Plot route for ${alert.plate} on map`}
                    >
                      <Navigation size={12} />
                      <span>Track on Map</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
