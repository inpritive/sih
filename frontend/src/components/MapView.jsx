import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Maximize2, XCircle } from 'lucide-react';

export function MapView({ 
  cameras = [], 
  trajectory = null, 
  analytics = null, 
  onClearTrajectory 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Layers refs
  const cameraLayerRef = useRef(L.layerGroup());
  const trajectoryLayerRef = useRef(L.layerGroup());
  const densityLayerRef = useRef(L.layerGroup());

  const [showDensity, setShowDensity] = useState(false);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946], // Bengaluru center
      zoom: 12,
      zoomControl: false,
    });

    // Custom dark tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add layer groups to map
    densityLayerRef.current.addTo(map);
    cameraLayerRef.current.addTo(map);
    trajectoryLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fit camera bounds when cameras load
  useEffect(() => {
    if (!mapInstanceRef.current || !cameras.length) return;
    if (trajectory?.sightings?.length) return;
    const bounds = L.latLngBounds(cameras.map((c) => [c.lat, c.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }, [cameras]);

  // 2. Render Cameras (Fixed markers on map at all times)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const layer = cameraLayerRef.current;
    layer.clearLayers();

    cameras.forEach((cam) => {
      const congestion = analytics?.congestion_score?.[cam.id] ?? 0.25;
      const count = analytics?.vehicle_counts_by_camera?.[cam.id] ?? 0;

      let congestionClass = 'congestion-low';
      let statusColor = '#10b981';
      let statusLabel = 'Normal';

      if (congestion > 0.7) {
        congestionClass = 'congestion-high';
        statusColor = '#ef4444';
        statusLabel = 'High Congestion';
      } else if (congestion >= 0.4) {
        congestionClass = 'congestion-mid';
        statusColor = '#f59e0b';
        statusLabel = 'Moderate';
      }

      // Custom Camera Pin Icon
      const customIcon = L.divIcon({
        className: 'camera-marker-icon',
        html: `
          <div class="custom-cam-pin ${congestionClass}" title="${cam.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: customIcon });

      const popupHtml = `
        <div class="custom-popup-content">
          <div class="popup-title">📹 ${cam.name}</div>
          <div class="popup-meta">ID: <strong>${cam.id}</strong></div>
          <div class="popup-meta">Coords: [${cam.lat.toFixed(4)}, ${cam.lng.toFixed(4)}]</div>
          <div style="margin-top: 4px; padding: 4px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 0.75rem;">
            <div>Vehicles Detected: <strong style="color: #fff;">${count}</strong></div>
            <div>Congestion: <span style="color: ${statusColor}; font-weight: 700;">${statusLabel} (${Math.round(congestion * 100)}%)</span></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layer.addLayer(marker);
    });
  }, [cameras, analytics]);

  // 3. Render Density Grid Heatmap overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const layer = densityLayerRef.current;
    layer.clearLayers();

    if (!showDensity || !analytics?.density_grid?.length) return;

    analytics.density_grid.forEach((point) => {
      // Subtle radar aura around camera hotspot
      const intensity = Math.min(1, (point.count || 0) / 80);
      const color = intensity > 0.65 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#38bdf8';

      const circle = L.circle([point.lat, point.lng], {
        radius: 350,
        color: color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.15,
      });

      circle.bindTooltip(`Density Zone: ${point.count} vehicles`, {
        permanent: false,
        direction: 'top',
        className: 'density-tooltip',
      });

      layer.addLayer(circle);
    });
  }, [analytics, showDensity]);

  // 4. Render Vehicle Trajectory Path and Sighting Nodes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const layer = trajectoryLayerRef.current;
    layer.clearLayers();

    if (!trajectory || !trajectory.sightings || trajectory.sightings.length === 0) {
      return;
    }

    // Sort sightings chronologically
    const sorted = [...trajectory.sightings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const latlngs = sorted.map((s) => [s.lat, s.lng]);

    // 1. Draw glowing polyline route
    const polylineGlow = L.polyline(latlngs, {
      color: '#00f0ff',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    });

    const polylineCore = L.polyline(latlngs, {
      color: '#ffffff',
      weight: 3,
      opacity: 0.95,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round',
    });

    layer.addLayer(polylineGlow);
    layer.addLayer(polylineCore);

    // 2. Draw Sighting Markers with sequence order
    sorted.forEach((sighting, idx) => {
      const cameraObj = cameras.find((c) => c.id === sighting.camera_id);
      const camName = cameraObj ? cameraObj.name : `Camera ${sighting.camera_id}`;
      const timeStr = new Date(sighting.timestamp).toLocaleTimeString();
      const confidencePercent = Math.round(sighting.confidence * 100);

      const nodeIcon = L.divIcon({
        className: 'trajectory-node-icon',
        html: `<div class="trajectory-node-pin" title="Checkpoint #${idx + 1}">${idx + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const nodeMarker = L.marker([sighting.lat, sighting.lng], { icon: nodeIcon });

      const popupContent = `
        <div class="custom-popup-content">
          <div class="popup-title">🎯 Sighting #${idx + 1} — ${trajectory.plate}</div>
          <div class="popup-meta"><strong>Location:</strong> ${camName} (${sighting.camera_id})</div>
          <div class="popup-meta"><strong>Timestamp:</strong> ${timeStr}</div>
          <div class="popup-meta"><strong>Confidence:</strong> <span style="color: #10b981; font-weight: 700;">${confidencePercent}%</span></div>
          <div class="popup-meta"><strong>Coords:</strong> [${sighting.lat.toFixed(4)}, ${sighting.lng.toFixed(4)}]</div>
        </div>
      `;

      nodeMarker.bindPopup(popupContent);
      layer.addLayer(nodeMarker);
    });

    // Zoom map to fit trajectory safely
    if (latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs);
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        mapInstanceRef.current.setView(bounds.getCenter(), 13);
      } else {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [70, 70],
          maxZoom: 14,
          animate: true,
        });
      }
    }
  }, [trajectory, cameras]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    if (trajectory?.sightings?.length) {
      const latlngs = trajectory.sightings.map((s) => [s.lat, s.lng]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
    } else if (cameras.length > 0) {
      const bounds = L.latLngBounds(cameras.map((c) => [c.lat, c.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      mapInstanceRef.current.setView([12.9716, 77.5946], 12);
    }
  };

  return (
    <div className="map-viewport">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Controls */}
      <div className="map-floating-controls">
        <button
          id="btn-toggle-density"
          className={`floating-btn ${showDensity ? 'active' : ''}`}
          onClick={() => setShowDensity(!showDensity)}
          title="Toggle Traffic Density Grid Overlay"
        >
          <Layers size={14} />
          <span>Density Grid: {showDensity ? 'ON' : 'OFF'}</span>
        </button>

        <button
          id="btn-fit-bounds"
          className="floating-btn"
          onClick={handleResetView}
          title="Center and fit all active nodes"
        >
          <Maximize2 size={14} />
          <span>Fit View</span>
        </button>

        {trajectory && (
          <button
            id="btn-clear-trajectory"
            className="floating-btn"
            style={{ color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.4)' }}
            onClick={onClearTrajectory}
            title="Clear current vehicle trajectory from map"
          >
            <XCircle size={14} />
            <span>Clear Route ({trajectory.plate})</span>
          </button>
        )}
      </div>

      {/* Map Color Legend */}
      <div className="map-legend">
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
          MAP LEGEND
        </div>
        <div className="legend-item">
          <span className="legend-marker" style={{ background: '#38bdf8', border: '1px solid #fff' }}></span>
          <span>Fixed ANPR Camera</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker" style={{ background: 'var(--color-cyan)', border: '2px solid #fff' }}></span>
          <span>Sighting Checkpoint</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ background: 'var(--color-cyan)' }}></span>
          <span>Trajectory Route</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker" style={{ background: 'rgba(239, 68, 68, 0.5)' }}></span>
          <span>High Congestion Area</span>
        </div>
      </div>
    </div>
  );
}
