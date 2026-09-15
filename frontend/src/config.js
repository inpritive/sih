/**
 * System Configuration for SIH 26127 City Vehicle Tracking System
 * 
 * TO CONNECT TO REAL BACKEND:
 * Simply set USE_MOCK to false (or set VITE_USE_MOCK=false in your .env).
 * Ensure API_BASE_URL points to your backend instance.
 * No component code changes are required.
 */

const getInitialMockState = () => {
  // Priority: URL parameter ?mock=true/false -> LocalStorage -> Env Var -> Default (true)
  const params = new URLSearchParams(window.location.search);
  if (params.has('mock')) {
    return params.get('mock') === 'true';
  }
  const stored = localStorage.getItem('sih_use_mock');
  if (stored !== null) {
    return stored === 'true';
  }
  if (import.meta.env.VITE_USE_MOCK !== undefined) {
    return import.meta.env.VITE_USE_MOCK === 'true';
  }
  return true; // Default to mock during initial development/demo
};

export const config = {
  USE_MOCK: getInitialMockState(),
  API_BASE_URL: 'https://sih-gvvh.onrender.com',
  WS_BASE_URL: 'wss://sih-gvvh.onrender.com/alerts',
};

export const setMockMode = (useMock) => {
  config.USE_MOCK = useMock;
  localStorage.setItem('sih_use_mock', String(useMock));
  window.dispatchEvent(new CustomEvent('sih_config_changed', { detail: { useMock } }));
};
