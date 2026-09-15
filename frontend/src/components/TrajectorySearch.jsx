import React, { useState } from 'react';
import { Search, Route, AlertCircle, Clock, CheckCircle2, Navigation2 } from 'lucide-react';

export function TrajectorySearch({
  onSearch,
  trajectory,
  loading,
  error,
  cameras = []
}) {
  const [inputPlate, setInputPlate] = useState('');

  const quickPlates = [
    { plate: 'KA01AB1234', desc: 'Standard Journey' },
    { plate: 'DL03CC8899', desc: 'Clone Anomaly' },
    { plate: 'MH02XY5544', desc: 'Blacklisted' },
    { plate: 'KA05MJ4411', desc: 'South Sector' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputPlate.trim()) return;
    onSearch(inputPlate.trim());
  };

  const handleSelectQuick = (plate) => {
    setInputPlate(plate);
    onSearch(plate);
  };

  // Sort sightings chronologically
  const sortedSightings = trajectory?.sightings ? [...trajectory.sightings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ) : [];

  // Helper to calculate travel duration
  const getDuration = () => {
    if (sortedSightings.length < 2) return 'N/A';
    const start = new Date(sortedSightings[0].timestamp).getTime();
    const end = new Date(sortedSightings[sortedSightings.length - 1].timestamp).getTime();
    const diffMin = Math.round((end - start) / 60000);
    if (diffMin < 60) return `${diffMin} mins`;
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <aside className="side-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Route size={18} style={{ color: 'var(--color-cyan)' }} />
          <span>VEHICLE TRAJECTORY</span>
        </div>
        {sortedSightings.length > 0 && (
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(0, 240, 255, 0.1)',
            color: 'var(--color-cyan)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(0, 240, 255, 0.3)'
          }}>
            {sortedSightings.length} Sightings
          </span>
        )}
      </div>

      <div className="panel-content">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-group">
            <input
              id="input-plate-search"
              type="text"
              className="search-input"
              placeholder="ENTER PLATE (e.g. KA01AB1234)"
              value={inputPlate}
              onChange={(e) => setInputPlate(e.target.value.toUpperCase())}
              autoFocus
            />
            <button 
              id="btn-search-plate"
              type="submit" 
              className="search-btn" 
              disabled={loading}
            >
              {loading ? <span className="loading-spinner"></span> : <Search size={16} />}
              <span>Track</span>
            </button>
          </div>

          {/* Quick Demo Plates */}
          <div className="quick-plates">
            <span className="quick-plate-label">Quick Demo:</span>
            {quickPlates.map((qp) => (
              <button
                key={qp.plate}
                type="button"
                className="quick-plate-tag"
                onClick={() => handleSelectQuick(qp.plate)}
                title={qp.desc}
              >
                {qp.plate}
              </button>
            ))}
          </div>
        </form>

        {/* Loading Indicator */}
        {loading && (
          <div className="empty-state">
            <span className="loading-spinner" style={{ width: '32px', height: '32px' }}></span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Querying ANPR trajectory network...
            </div>
          </div>
        )}

        {/* Error / Empty State */}
        {!loading && error && (
          <div className="empty-state" style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle className="empty-state-icon" style={{ stroke: 'var(--color-red)' }} />
            <div style={{ color: 'var(--color-red)', fontWeight: 600, fontSize: '0.9rem' }}>
              No Sightings Recorded
            </div>
            <div style={{ fontSize: '0.8rem', maxWidth: '280px' }}>
              {error}
            </div>
          </div>
        )}

        {/* Not Searched Yet State */}
        {!loading && !error && !trajectory && (
          <div className="empty-state">
            <Navigation2 className="empty-state-icon" />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Search a License Plate
            </div>
            <div style={{ fontSize: '0.78rem', maxWidth: '280px' }}>
              Enter a registered or suspect vehicle registration number to reconstruct its chronological journey on the map.
            </div>
          </div>
        )}

        {/* Trajectory Details & Chronological Timeline */}
        {!loading && trajectory && sortedSightings.length > 0 && (
          <div className="trajectory-summary-card">
            {/* Quick Stats Grid */}
            <div className="trajectory-stats-grid">
              <div className="stat-box">
                <span className="stat-label">Target Plate</span>
                <span className="stat-value" style={{ color: 'var(--color-cyan)' }}>{trajectory.plate}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Checkpoints</span>
                <span className="stat-value">{sortedSightings.length} Nodes</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Duration</span>
                <span className="stat-value" style={{ fontSize: '0.95rem' }}>{getDuration()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Avg Confidence</span>
                <span className="stat-value" style={{ color: 'var(--color-green)', fontSize: '0.95rem' }}>
                  {Math.round(
                    (sortedSightings.reduce((acc, s) => acc + s.confidence, 0) / sortedSightings.length) * 100
                  )}%
                </span>
              </div>
            </div>

            {/* Step-by-Step Chronological Route */}
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={12} />
                <span>CHRONOLOGICAL SIGHTINGS</span>
              </div>

              <div className="timeline-list">
                {sortedSightings.map((sighting, idx) => {
                  const cameraObj = cameras.find((c) => c.id === sighting.camera_id);
                  const camName = cameraObj ? cameraObj.name : `Camera ${sighting.camera_id}`;
                  const timeFormatted = new Date(sighting.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <div key={`${sighting.camera_id}-${idx}`} className="timeline-item">
                      <span className="timeline-dot"></span>
                      <div className="timeline-row">
                        <span className="timeline-cam-name">#{idx + 1} {camName}</span>
                        <span className="timeline-confidence">
                          {Math.round(sighting.confidence * 100)}%
                        </span>
                      </div>
                      <div className="timeline-row">
                        <span className="timeline-time">{timeFormatted}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          ID: {sighting.camera_id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
