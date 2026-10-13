// Shared helpers for the FLAME API test suite.
// These tests run against the LIVE server (http://localhost:4000) using Node's
// built-in test runner (node --test). Start the server before running tests.

export const BASE = process.env.TEST_BASE || 'http://localhost:4000/api';

export const ADMIN = { email: 'admin@flame.org', password: 'Flame@Admin2026' };

let cachedToken = null;

async function parse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Authenticated / plain request helpers
export async function login(creds = ADMIN) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  const body = await parse(res);
  if (!body?.token) throw new Error(`Login failed (${res.status}): ${JSON.stringify(body)}`);
  return body.token;
}

export async function token() {
  if (!cachedToken) cachedToken = await login();
  return cachedToken;
}

export async function apiGet(path, { auth = false } = {}) {
  const headers = {};
  if (auth) headers.Authorization = `Bearer ${await token()}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, body: await parse(res), res };
}

export async function apiSend(method, path, data, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${await token()}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return { status: res.status, body: await parse(res), res };
}

export const apiPost = (p, d, o) => apiSend('POST', p, d, o);
export const apiPatch = (p, d, o) => apiSend('PATCH', p, d, o);
export const apiDelete = (p, o) => apiSend('DELETE', p, undefined, o);

// Timing helper for performance assertions
export async function timed(fn) {
  const t0 = performance.now();
  const result = await fn();
  const ms = performance.now() - t0;
  return { ms, result };
}

// Run `fn` `n` times concurrently, return results + elapsed ms
export async function concurrent(n, fn) {
  const t0 = performance.now();
  const results = await Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
  const ms = performance.now() - t0;
  return { ms, results };
}

// Convenience: pick first school/person/medic for building fixtures
export async function fixtures() {
  const [schools, people, medics, countries] = await Promise.all([
    apiGet('/schools'), apiGet('/people'), apiGet('/medical-team'), apiGet('/countries'),
  ]);
  return {
    school: schools.body[0],
    schools: schools.body,
    person: people.body[0],
    medic: medics.body[0],
    country: countries.body[0],
  };
}
