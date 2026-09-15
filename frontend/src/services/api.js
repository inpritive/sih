/**
 * Unified API Client for SIH 26127 City Vehicle Tracking System
 * 
 * Switches between Mock Layer and Real Backend automatically
 * based on `config.USE_MOCK`.
 * 
 * All response shapes strictly conform to the shared contract:
 * - GET /cameras
 * - GET /plate/{plate}/trajectory
 * - GET /analytics/summary
 * - POST /blacklist
 * - POST /sighting
 */

import { config } from '../config';
import { mockApi } from './mockApi';

/**
 * Helper to fetch from real backend
 */
async function fetchRealApi(endpoint, options = {}) {
  const url = `${config.API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${errorBody || 'Request failed'}`);
  }

  return res.json();
}

export const api = {
  /**
   * GET /cameras
   * Response: [{ "id": "cam_1", "name": "MG Road Junction", "lat": 12.9716, "lng": 77.5946 }, ...]
   */
  async getCameras() {
    if (config.USE_MOCK) {
      return mockApi.getCameras();
    }
    return fetchRealApi('/cameras');
  },

  /**
   * GET /plate/{plate}/trajectory
   * Response: { "plate": "KA01AB1234", "sightings": [
   *   { "camera_id": "cam_1", "lat": 12.9716, "lng": 77.5946, "timestamp": "...", "confidence": 0.92 },
   *   ...
   * ]}
   */
  async getPlateTrajectory(plate) {
    if (config.USE_MOCK) {
      return mockApi.getPlateTrajectory(plate);
    }
    return fetchRealApi(`/plate/${encodeURIComponent(plate)}/trajectory`);
  },

  /**
   * GET /analytics/summary
   * Response: {
   *   "vehicle_counts_by_camera": { "cam_1": 120, "cam_2": 95, "cam_3": 140 },
   *   "density_grid": [{ "lat": 12.97, "lng": 77.59, "count": 34 }, ...],
   *   "congestion_score": { "cam_1": 0.6, "cam_2": 0.3 }
   * }
   */
  async getAnalyticsSummary() {
    if (config.USE_MOCK) {
      return mockApi.getAnalyticsSummary();
    }
    return fetchRealApi('/analytics/summary');
  },

  /**
   * POST /blacklist
   * Body: { "plate": "KA01AB1234", "reason": "stolen vehicle" }
   */
  async postBlacklist(plate, reason) {
    const payload = { plate, reason };
    if (config.USE_MOCK) {
      return mockApi.postBlacklist(payload);
    }
    return fetchRealApi('/blacklist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /sighting
   * Body: { "plate": "KA01AB1234", "camera_id": "cam_1", "timestamp": "2026-09-15T10:30:45Z",
   *         "confidence": 0.92, "vehicle_type": "car", "color": "white" }
   */
  async postSighting(sightingData) {
    if (config.USE_MOCK) {
      return mockApi.postSighting(sightingData);
    }
    return fetchRealApi('/sighting', {
      method: 'POST',
      body: JSON.stringify(sightingData),
    });
  }
};
