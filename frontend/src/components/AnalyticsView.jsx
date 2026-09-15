import React from 'react';
import { 
  BarChart3, 
  RotateCw, 
  Activity, 
  AlertTriangle, 
  Car, 
  Gauge 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function AnalyticsView({
  analytics,
  cameras = [],
  loading,
  lastUpdated,
  onRefresh
}) {
  const countsByCamera = analytics?.vehicle_counts_by_camera || {};
  const congestionScores = analytics?.congestion_score || {};

  // Build Camera Names & Data for Chart
  const labels = Object.keys(countsByCamera).map((camId) => {
    const cam = cameras.find((c) => c.id === camId);
    return cam ? cam.name.split(' ')[0] : camId;
  });

  const counts = Object.values(countsByCamera);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Vehicles Detected',
        data: counts,
        backgroundColor: 'rgba(0, 240, 255, 0.45)',
        borderColor: '#00f0ff',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(0, 240, 255, 0.75)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(16, 23, 38, 0.95)',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        borderColor: 'rgba(0, 240, 255, 0.4)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  // Aggregated Stats
  const totalVehicles = Object.values(countsByCamera).reduce((a, b) => a + b, 0);
  const avgCongestion = Object.values(congestionScores).length
    ? Math.round(
        (Object.values(congestionScores).reduce((a, b) => a + b, 0) /
          Object.values(congestionScores).length) *
          100
      )
    : 0;

  return (
    <aside className="side-panel">
      <div className="panel-header">
        <div className="panel-title">
          <BarChart3 size={18} style={{ color: 'var(--color-cyan)' }} />
          <span>TRAFFIC ANALYTICS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="btn-refresh-analytics"
            className="floating-btn"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            onClick={onRefresh}
            disabled={loading}
            title="Refresh summary now"
          >
            <RotateCw size={12} className={loading ? 'loading-spinner' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* KPI Summary Cards */}
        <div className="trajectory-stats-grid">
          <div className="stat-box">
            <span className="stat-label">Total Sighted</span>
            <span className="stat-value" style={{ color: 'var(--color-cyan)' }}>
              <Car size={16} style={{ display: 'inline', marginRight: 4 }} />
              {totalVehicles.toLocaleString()}
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Avg Congestion</span>
            <span
              className="stat-value"
              style={{
                color:
                  avgCongestion > 70
                    ? 'var(--color-red)'
                    : avgCongestion > 40
                    ? 'var(--color-amber)'
                    : 'var(--color-green)',
              }}
            >
              <Gauge size={16} style={{ display: 'inline', marginRight: 4 }} />
              {avgCongestion}%
            </span>
          </div>
        </div>

        {/* Vehicle Counts Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Vehicles Per Camera</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              GET /analytics/summary
            </span>
          </div>
          <div style={{ height: '180px', width: '100%', position: 'relative' }}>
            {counts.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-state">No camera data available</div>
            )}
          </div>
        </div>

        {/* Congestion Indicator Per Camera */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Camera Congestion Levels</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Green &lt;0.4 | Amber 0.4-0.7 | Red &gt;0.7
            </span>
          </div>

          <div className="congestion-list">
            {cameras.map((cam) => {
              const score = congestionScores[cam.id] ?? 0;
              const count = countsByCamera[cam.id] ?? 0;
              const percent = Math.round(score * 100);

              let fillClass = 'fill-green';
              let statusLabel = 'Normal';
              if (score > 0.7) {
                fillClass = 'fill-red';
                statusLabel = 'Critical';
              } else if (score >= 0.4) {
                fillClass = 'fill-amber';
                statusLabel = 'Elevated';
              }

              return (
                <div key={cam.id} className="congestion-item">
                  <div className="congestion-header">
                    <div>
                      <strong style={{ color: '#fff' }}>{cam.name}</strong>{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        ({cam.id})
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ marginRight: '6px', color: 'var(--text-secondary)' }}>
                        {count} veh
                      </span>
                      <strong
                        style={{
                          color:
                            score > 0.7
                              ? 'var(--color-red)'
                              : score >= 0.4
                              ? 'var(--color-amber)'
                              : 'var(--color-green)',
                        }}
                      >
                        {percent}%
                      </strong>
                    </div>
                  </div>

                  {/* Congestion Gauge Track */}
                  <div className="congestion-bar-track">
                    <div
                      className={`congestion-bar-fill ${fillClass}`}
                      style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Periodic Update Footer Info */}
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Activity size={12} style={{ color: 'var(--color-cyan)' }} />
          <span>Auto-refreshes every 10s • Last sync: {lastUpdated || 'Initial load'}</span>
        </div>
      </div>
    </aside>
  );
}
