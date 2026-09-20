import React from 'react';
import { Video } from 'lucide-react';

export function CameraFeedsView({ cameras, latestSightings }) {
  if (!cameras || cameras.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading cameras...
      </div>
    );
  }

  // Fallback traffic video for placeholder
  const placeholderVideoUrl = "https://res.cloudinary.com/qyxcufjw/video/upload/v1789885380/cam_1.mp4";

  return (
    <div className="camera-feeds-container">
      <div className="camera-feeds-grid">
        {cameras.map((camera) => {
          const latest = latestSightings[camera.id];

          return (
            <div key={camera.id} className="camera-feed-card">
              {/* Top Bar */}
              <div className="camera-feed-bar">
                <div className="bar-left">
                  <span className="cam-id">{camera.id.toUpperCase()}</span>
                  <span className="cam-name">{camera.name}</span>
                </div>
                <div className="bar-right">
                  {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
                </div>
              </div>

              {/* Video Area */}
              <div className="camera-feed-video-wrapper">
                {/* Top-left Timestamp */}
                <div className="video-timestamp">
                  {new Date().toISOString().slice(0,10)} {new Date().toLocaleTimeString('en-GB')}
                </div>

                {/* SWAP REAL VIDEO SOURCE HERE */}
                <video
                  className="camera-video-player"
                  src={placeholderVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* Latest Detection Overlay (requested in prompt) */}
                <div className="camera-feed-overlay-bottom">
                  {latest && (
                    <div className="sighting-overlay">
                      <div className="sighting-overlay-header">LATEST DETECTION</div>
                      <div className="sighting-overlay-body">
                        <div className="sighting-plate">{latest.plate}</div>
                        <div className="sighting-details">
                          <span className="sighting-confidence">{(latest.confidence * 100).toFixed(0)}%</span>
                          <span className="sighting-time">{new Date(latest.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="camera-feed-bar bottom">
                <div className="bar-left">
                  {camera.name}
                </div>
                <div className="bar-right live-status">
                  LIVE <span className="status-dot connected" style={{ width: 6, height: 6, marginLeft: 6 }}></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
