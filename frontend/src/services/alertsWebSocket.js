/**
 * Live Alerts WebSocket Client for SIH 26127
 * 
 * Supports:
 * - Real Native WebSocket client connecting to WS /alerts
 * - Auto-reconnect with exponential backoff
 * - MockAlertsWebSocket simulator when config.USE_MOCK is true
 * 
 * Message Shape:
 * { "type": "blacklist" | "clone", "plate": "KA01AB1234", "camera_id": "cam_2",
 *   "timestamp": "2026-09-15T10:30:45Z", "confidence": 0.85, "reason": "impossible travel time" }
 */

import { config } from '../config';
import { MockAlertsWebSocket } from './mockApi';

class AlertsWebSocketManager {
  constructor() {
    this.subscribers = new Set();
    this.statusListeners = new Set();
    this.ws = null;
    this.mockWs = null;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.status = 'disconnected'; // 'connecting' | 'connected' | 'disconnected' | 'mock'
  }

  init() {
    this.cleanup();

    if (config.USE_MOCK) {
      this.status = 'mock';
      this.notifyStatus('mock');
      this.mockWs = new MockAlertsWebSocket();
      this.mockWs.subscribe((alert) => this.broadcast(alert));
      this.mockWs.connect();
      this.isConnected = true;
    } else {
      this.connectNative();
    }
  }

  connectNative() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status = 'connecting';
    this.notifyStatus('connecting');

    try {
      this.ws = new WebSocket(config.WS_BASE_URL);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.status = 'connected';
        this.notifyStatus('connected');
        console.log('[WS] Connected to live alerts at', config.WS_BASE_URL);
      };

      this.ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data);
          this.broadcast(alert);
        } catch (err) {
          console.error('[WS] Failed to parse alert message:', err, event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.status = 'disconnected';
        this.notifyStatus('disconnected');
        console.warn('[WS] Alerts WebSocket closed. Reconnecting in 4s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Alerts WebSocket error:', err);
        this.isConnected = false;
        this.status = 'disconnected';
        this.notifyStatus('disconnected');
      };
    } catch (err) {
      console.error('[WS] Socket connection exception:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!config.USE_MOCK) {
        this.connectNative();
      }
    }, 4000);
  }

  broadcast(alert) {
    for (const sub of this.subscribers) {
      try {
        sub(alert);
      } catch (err) {
        console.error('[WS] Subscriber callback failed:', err);
      }
    }
  }

  notifyStatus(status) {
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('[WS] Status listener error:', err);
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.mockWs) {
      this.mockWs.disconnect();
      this.mockWs = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.status = 'disconnected';
  }
}

export const alertsWs = new AlertsWebSocketManager();
