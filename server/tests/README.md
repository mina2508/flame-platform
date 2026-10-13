# FLAME API Test Suite

Integration tests that run against the **live** server using Node's built-in
test runner (`node --test`). No extra dependencies required.

## Prerequisites
- Server running on `http://localhost:4000` (`npm start` in `server/`)
- Seeded database with the default admin user (`admin@flame.org`)

## Running

```bash
# everything
npm test

# individual suites
npm run test:functional
npm run test:concurrency
npm run test:performance
```

Override the target or thresholds with env vars:

```bash
TEST_BASE=http://localhost:4000/api \
PERF_P50_READ_MS=250 PERF_P95_READ_MS=900 PERF_DASHBOARD_MS=800 PERF_MIN_RPS=50 \
npm run test:performance
```

## What is covered

### functional.test.mjs
- Health + auth (valid login, bad password, unauthenticated writes rejected)
- All read endpoints return 200 + arrays; map locations/filters; dashboard KPIs (3-state)
- Mission mandatory-field validation (title/status/dates/≥1 school, end≥start)
- Mission lifecycle: create → generates per-school logs → status edit → member
  availability flips (busy while `pending`) → delete removes generated logs
- School-level logs: mandatory summary + date, create/view/edit/delete, task board
- Curriculum assignment to a school via PATCH + per-school status update
- Dashboard end-of-day date boundary includes same-day logs

### concurrency.test.mjs
- 50 concurrent mixed reads all succeed
- 20 concurrent mission creates → 20 distinct missions, each with exactly one log
- One mission across many schools generates all logs concurrently (Promise.all)
- Concurrent school-level status updates stay consistent (no lost updates)
- Concurrent create + concurrent delete returns to baseline (no residue)

### performance.test.mjs
- Single read latency sanity
- `/missions` ×100 concurrent: asserts p50 and p95 budgets
- Dashboard summary warm median budget (warms the connection first)
- Read throughput (≥ min req/s under 200 concurrent requests)
- Mixed concurrent workload produces zero 5xx

## Notes
- Tests create and then delete their own fixtures, so they are safe to re-run.
- The `/missions` list endpoint returns country names + counts (not the full
  nested graph) specifically to keep list latency low under load.
