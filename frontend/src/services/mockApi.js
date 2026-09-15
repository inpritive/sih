/**
 * Mock Data Layer for SIH 26127 City Vehicle Tracking System
 * Strictly mirrors the agreed API contract:
 * - GET /cameras
 * - GET /plate/{plate}/trajectory
 * - GET /analytics/summary
 * - POST /blacklist
 * - POST /sighting
 * - WS /alerts
 */

export const MOCK_CAMERAS = [
  { id: "cam_1", name: "MG Road Junction", lat: 12.9716, lng: 77.5946 },
  { id: "cam_2", name: "Indiranagar 100ft Rd", lat: 12.9784, lng: 77.6408 },
  { id: "cam_3", name: "Koramangala Sony Signal", lat: 12.9352, lng: 77.6146 },
  { id: "cam_4", name: "Silk Board Junction", lat: 12.9172, lng: 77.6228 },
  { id: "cam_5", name: "Hebbal Flyover", lat: 13.0358, lng: 77.5970 },
  { id: "cam_6", name: "Majestic Bus Station", lat: 12.9767, lng: 77.5713 },
  { id: "cam_7", name: "Electronic City Toll", lat: 12.8452, lng: 77.6602 },
  { id: "cam_8", name: "Whitefield Hope Farm", lat: 12.9822, lng: 77.7499 }
];

// Seed trajectories for demo plates
const MOCK_TRAJECTORIES = {
  "KA01AB1234": {
    plate: "KA01AB1234",
    sightings: [
      { camera_id: "cam_1", lat: 12.9716, lng: 77.5946, timestamp: "2026-09-15T09:15:20Z", confidence: 0.94 },
      { camera_id: "cam_2", lat: 12.9784, lng: 77.6408, timestamp: "2026-09-15T09:40:10Z", confidence: 0.91 },
      { camera_id: "cam_3", lat: 12.9352, lng: 77.6146, timestamp: "2026-09-15T10:12:35Z", confidence: 0.88 },
      { camera_id: "cam_4", lat: 12.9172, lng: 77.6228, timestamp: "2026-09-15T10:30:45Z", confidence: 0.95 }
    ]
  },
  "DL03CC8899": {
    plate: "DL03CC8899",
    sightings: [
      { camera_id: "cam_5", lat: 13.0358, lng: 77.5970, timestamp: "2026-09-15T11:00:10Z", confidence: 0.96 },
      { camera_id: "cam_4", lat: 12.9172, lng: 77.6228, timestamp: "2026-09-15T11:03:22Z", confidence: 0.93 },
      { camera_id: "cam_7", lat: 12.8452, lng: 77.6602, timestamp: "2026-09-15T11:18:40Z", confidence: 0.89 }
    ]
  },
  "MH02XY5544": {
    plate: "MH02XY5544",
    sightings: [
      { camera_id: "cam_6", lat: 12.9767, lng: 77.5713, timestamp: "2026-09-15T08:20:00Z", confidence: 0.87 },
      { camera_id: "cam_1", lat: 12.9716, lng: 77.5946, timestamp: "2026-09-15T08:45:15Z", confidence: 0.92 },
      { camera_id: "cam_2", lat: 12.9784, lng: 77.6408, timestamp: "2026-09-15T09:10:00Z", confidence: 0.89 },
      { camera_id: "cam_8", lat: 12.9822, lng: 77.7499, timestamp: "2026-09-15T09:55:30Z", confidence: 0.90 }
    ]
  },
  "KA05MJ4411": {
    plate: "KA05MJ4411",
    sightings: [
      { camera_id: "cam_3", lat: 12.9352, lng: 77.6146, timestamp: "2026-09-15T12:05:10Z", confidence: 0.91 },
      { camera_id: "cam_4", lat: 12.9172, lng: 77.6228, timestamp: "2026-09-15T12:22:45Z", confidence: 0.93 },
      { camera_id: "cam_7", lat: 12.8452, lng: 77.6602, timestamp: "2026-09-15T12:48:15Z", confidence: 0.87 }
    ]
  }
};

// Mock In-memory store
const mockBlacklist = [
  { plate: "MH02XY5544", reason: "stolen vehicle" },
  { plate: "HR26DK9001", reason: "unpaid toll evader" }
];

// Mock API Call Handlers
export const mockApi = {
  // GET /cameras
  async getCameras() {
    await delay(120);
    return [...MOCK_CAMERAS];
  },

  // GET /plate/{plate}/trajectory
  async getPlateTrajectory(plate) {
    await delay(200);
    const normalized = plate.trim().toUpperCase();
    if (MOCK_TRAJECTORIES[normalized]) {
      return JSON.parse(JSON.stringify(MOCK_TRAJECTORIES[normalized]));
    }
    // If unknown plate in mock mode, return 404 shape or empty sightings
    return {
      plate: normalized,
      sightings: []
    };
  },

  // GET /analytics/summary
  async getAnalyticsSummary() {
    await delay(150);
    // Dynamic slight variance for realistic live-refresh demo
    const variance = () => Math.floor((Math.random() - 0.5) * 6);
    const scoreVar = () => Math.round((Math.random() - 0.5) * 0.04 * 100) / 100;

    return {
      vehicle_counts_by_camera: {
        cam_1: Math.max(20, 142 + variance()),
        cam_2: Math.max(20, 98 + variance()),
        cam_3: Math.max(20, 165 + variance()),
        cam_4: Math.max(20, 210 + variance()),
        cam_5: Math.max(20, 180 + variance()),
        cam_6: Math.max(20, 130 + variance()),
        cam_7: Math.max(20, 115 + variance()),
        cam_8: Math.max(20, 88 + variance()),
      },
      density_grid: [
        { lat: 12.9716, lng: 77.5946, count: Math.max(10, 54 + variance()) },
        { lat: 12.9784, lng: 77.6408, count: Math.max(10, 38 + variance()) },
        { lat: 12.9352, lng: 77.6146, count: Math.max(10, 62 + variance()) },
        { lat: 12.9172, lng: 77.6228, count: Math.max(10, 85 + variance()) },
        { lat: 13.0358, lng: 77.5970, count: Math.max(10, 69 + variance()) },
        { lat: 12.9767, lng: 77.5713, count: Math.max(10, 48 + variance()) },
        { lat: 12.8452, lng: 77.6602, count: Math.max(10, 42 + variance()) },
        { lat: 12.9822, lng: 77.7499, count: Math.max(10, 31 + variance()) },
      ],
      congestion_score: {
        cam_1: Math.min(1, Math.max(0.1, 0.58 + scoreVar())),
        cam_2: Math.min(1, Math.max(0.1, 0.35 + scoreVar())),
        cam_3: Math.min(1, Math.max(0.1, 0.72 + scoreVar())),
        cam_4: Math.min(1, Math.max(0.1, 0.89 + scoreVar())),
        cam_5: Math.min(1, Math.max(0.1, 0.76 + scoreVar())),
        cam_6: Math.min(1, Math.max(0.1, 0.45 + scoreVar())),
        cam_7: Math.min(1, Math.max(0.1, 0.38 + scoreVar())),
        cam_8: Math.min(1, Math.max(0.1, 0.28 + scoreVar())),
      }
    };
  },

  // POST /blacklist
  async postBlacklist(body) {
    await delay(180);
    const item = { plate: body.plate.trim().toUpperCase(), reason: body.reason };
    mockBlacklist.push(item);
    // If this plate doesn't have sightings yet, seed a mock one so user can immediately track it
    if (!MOCK_TRAJECTORIES[item.plate]) {
      MOCK_TRAJECTORIES[item.plate] = {
        plate: item.plate,
        sightings: [
          { camera_id: "cam_1", lat: 12.9716, lng: 77.5946, timestamp: new Date().toISOString(), confidence: 0.94 },
          { camera_id: "cam_3", lat: 12.9352, lng: 77.6146, timestamp: new Date(Date.now() + 600000).toISOString(), confidence: 0.91 }
        ]
      };
    }
    return { status: "success", message: `Plate ${item.plate} blacklisted successfully` };
  },

  // POST /sighting
  async postSighting(body) {
    await delay(150);
    const camera = MOCK_CAMERAS.find(c => c.id === body.camera_id) || MOCK_CAMERAS[0];
    const sighting = {
      camera_id: body.camera_id,
      lat: camera.lat,
      lng: camera.lng,
      timestamp: body.timestamp || new Date().toISOString(),
      confidence: body.confidence ?? 0.92
    };

    const plate = body.plate.trim().toUpperCase();
    if (!MOCK_TRAJECTORIES[plate]) {
      MOCK_TRAJECTORIES[plate] = { plate, sightings: [] };
    }
    MOCK_TRAJECTORIES[plate].sightings.push(sighting);
    return { status: "success", sighting_id: `sig_${Date.now()}` };
  }
};

/**
 * Mock WebSocket Stream Emitter
 * Pushes messages of shape:
 * { "type": "blacklist" | "clone", "plate": "...", "camera_id": "...",
 *   "timestamp": "...", "confidence": 0.85, "reason": "..." }
 */
export class MockAlertsWebSocket {
  constructor() {
    this.subscribers = new Set();
    this.timer = null;
    this.alertSamples = [
      {
        type: "clone",
        plate: "DL03CC8899",
        camera_id: "cam_4",
        confidence: 0.93,
        reason: "impossible travel time (22km in 3 min)"
      },
      {
        type: "blacklist",
        plate: "MH02XY5544",
        camera_id: "cam_2",
        confidence: 0.89,
        reason: "stolen vehicle (Reported Case #CR-8821)"
      },
      {
        type: "clone",
        plate: "KA01AB1234",
        camera_id: "cam_5",
        confidence: 0.88,
        reason: "duplicate sighting across distant sectors"
      },
      {
        type: "blacklist",
        plate: "HR26DK9001",
        camera_id: "cam_7",
        confidence: 0.94,
        reason: "wanted for toll plaza breach"
      },
      {
        type: "clone",
        plate: "KA05MJ4411",
        camera_id: "cam_1",
        confidence: 0.85,
        reason: "speed anomaly: calculated 210 km/h in city zone"
      }
    ];
    this.index = 0;
  }

  connect() {
    // Initial welcome alert after 1.5s
    setTimeout(() => {
      this.emitNext();
    }, 1500);

    // Periodic simulation every 6 seconds
    this.timer = setInterval(() => {
      this.emitNext();
    }, 6000);
  }

  emitNext() {
    const sample = this.alertSamples[this.index % this.alertSamples.length];
    this.index++;
    const alert = {
      type: sample.type,
      plate: sample.plate,
      camera_id: sample.camera_id,
      timestamp: new Date().toISOString(),
      confidence: sample.confidence,
      reason: sample.reason
    };
    for (const sub of this.subscribers) {
      try {
        sub(alert);
      } catch (err) {
        console.error("Mock alert subscriber error:", err);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  disconnect() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.subscribers.clear();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
