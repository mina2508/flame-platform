import axios from 'axios';

// In production (deployed), set VITE_API_BASE_URL to the server origin, e.g.
//   https://flame-api.onrender.com
// Locally it falls back to '' so the Vite dev proxy handles '/api' and '/uploads'.
export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
export const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

// Build an absolute URL for uploaded files (PDFs, images).
export const fileUrl = (path) => (path ? `${API_ORIGIN}${path}` : path);

// ──────────────────────────────────────────────────────────────
// Global loading tracker.
// Every request increments an in-flight counter; the counter drives
// a top progress bar + subtle overlay (see GlobalLoader) across the
// whole app, so no page needs its own loading boilerplate.
// ──────────────────────────────────────────────────────────────
let inFlight = 0;
const listeners = new Set();

function emit() {
  const active = inFlight > 0;
  listeners.forEach((fn) => fn(active, inFlight));
}

export function onLoadingChange(fn) {
  listeners.add(fn);
  // push current state immediately
  fn(inFlight > 0, inFlight);
  return () => listeners.delete(fn);
}

function start() { inFlight += 1; emit(); }
function done() { inFlight = Math.max(0, inFlight - 1); emit(); }

// attach token + start loading
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flame_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!config.__noLoader) start();
  config.__counted = !config.__noLoader;
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  if (response.config?.__counted) done();
  return response;
}, (error) => {
  if (error.config?.__counted) done();
  return Promise.reject(error);
});
