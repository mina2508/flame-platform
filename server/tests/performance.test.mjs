import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiGet, concurrent, timed } from './helpers.mjs';

// Thresholds for a local single-threaded SQLite dev server. Tune via env vars.
// p50 captures typical latency; p95 is the tail under heavy (100-way) concurrency,
// which far exceeds realistic admin usage, so its budget is deliberately looser.
const P50_READ_MS = Number(process.env.PERF_P50_READ_MS || 400);
const P95_READ_MS = Number(process.env.PERF_P95_READ_MS || 900);
const DASHBOARD_MS = Number(process.env.PERF_DASHBOARD_MS || 800);
const THROUGHPUT_MIN_RPS = Number(process.env.PERF_MIN_RPS || 50);

function pct(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

test('single read latency is reasonable', async () => {
  const { ms } = await timed(() => apiGet('/schools'));
  console.log(`  GET /schools: ${ms.toFixed(1)}ms`);
  assert.ok(ms < P95_READ_MS * 3, `single read ${ms.toFixed(1)}ms under budget`);
});

test('read p95 under load (100 concurrent GET /missions)', async () => {
  const timings = [];
  const { ms, results } = await concurrent(100, async () => {
    const { ms, result } = await timed(() => apiGet('/missions'));
    timings.push(ms);
    return result;
  });
  assert.ok(results.every(r => r.status === 200), 'all 200 under load');
  timings.sort((a, b) => a - b);
  const p50 = pct(timings, 50), p95 = pct(timings, 95), max = timings.at(-1);
  console.log(`  /missions ×100: total=${ms.toFixed(0)}ms p50=${p50.toFixed(1)} p95=${p95.toFixed(1)} max=${max.toFixed(1)}`);
  assert.ok(p50 < P50_READ_MS, `p50 ${p50.toFixed(1)}ms < ${P50_READ_MS}ms`);
  assert.ok(p95 < P95_READ_MS, `p95 ${p95.toFixed(1)}ms < ${P95_READ_MS}ms`);
});

test('dashboard summary computes within budget (warm, median of 5)', async () => {
  // Warm up the Prisma connection / query planner so we measure steady-state cost,
  // not the one-time cold start.
  await apiGet('/dashboard/summary?from=2026-01-01&to=2026-12-31');

  const samples = [];
  for (let i = 0; i < 5; i++) {
    const { ms, result } = await timed(() => apiGet('/dashboard/summary?from=2026-01-01&to=2026-12-31'));
    assert.equal(result.status, 200);
    samples.push(ms);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  console.log(`  dashboard summary (warm): median=${median.toFixed(1)}ms samples=[${samples.map(s => s.toFixed(0)).join(',')}]`);
  assert.ok(median < DASHBOARD_MS, `dashboard median ${median.toFixed(1)}ms < ${DASHBOARD_MS}ms`);
});

test('read throughput exceeds minimum (200 concurrent requests)', async () => {
  const N = 200;
  const { ms, results } = await concurrent(N, () => apiGet('/people'));
  assert.ok(results.every(r => r.status === 200), 'all 200');
  const rps = (N / ms) * 1000;
  console.log(`  throughput: ${N} reqs in ${ms.toFixed(0)}ms = ${rps.toFixed(0)} req/s`);
  assert.ok(rps > THROUGHPUT_MIN_RPS, `throughput ${rps.toFixed(0)} rps > ${THROUGHPUT_MIN_RPS}`);
});

test('mixed concurrent workload stays stable (no 5xx)', async () => {
  const paths = ['/schools', '/people', '/missions', '/logs', '/dashboard/summary', '/countries', '/medical-team'];
  const { ms, results } = await concurrent(140, (i) => apiGet(paths[i % paths.length]));
  const serverErrors = results.filter(r => r.status >= 500);
  console.log(`  mixed 140 reqs in ${ms.toFixed(0)}ms, 5xx=${serverErrors.length}`);
  assert.equal(serverErrors.length, 0, 'no server errors under mixed load');
  assert.ok(results.every(r => r.status === 200));
});
