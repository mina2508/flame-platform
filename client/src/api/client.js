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

// ──────────────────────────────────────────────────────────────
// Lightweight GET cache with in-flight dedup.
// Use `cachedGet(url, { ttl })` for reference lists that rarely change
// (schools, countries, people, log-types). Returns the parsed data.
// Any POST/PUT/PATCH/DELETE automatically clears the cache so the next
// read is fresh. This removes the dozens of redundant list refetches
// that happen as the user moves between admin sections.
// ──────────────────────────────────────────────────────────────
const _cache = new Map();   // key -> { at, data }
const _inflight = new Map(); // key -> Promise

export function clearApiCache() { _cache.clear(); _inflight.clear(); }

export async function cachedGet(url, { ttl = 30000, params } = {}) {
  const key = url + (params ? '?' + new URLSearchParams(params).toString() : '');
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  if (_inflight.has(key)) return _inflight.get(key);
  const p = api.get(url, { params })
    .then((r) => { _cache.set(key, { at: Date.now(), data: r.data }); _inflight.delete(key); return r.data; })
    .catch((e) => { _inflight.delete(key); throw e; });
  _inflight.set(key, p);
  return p;
}

// Invalidate the cache on any write so lists stay correct after edits.
api.interceptors.request.use((config) => {
  const m = (config.method || 'get').toLowerCase();
  if (m !== 'get') clearApiCache();
  return config;
});
