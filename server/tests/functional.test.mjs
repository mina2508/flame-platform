import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiGet, apiPost, apiPatch, apiDelete, fixtures, BASE } from './helpers.mjs';

// ─────────────────────────── Health & auth ───────────────────────────
test('health endpoint responds ok', async () => {
  const res = await fetch(`${BASE}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
});

test('login with valid admin returns a token', async () => {
  const { status, body } = await apiPost('/auth/login',
    { email: 'admin@flame.org', password: 'Flame@Admin2026' }, { auth: false });
  assert.equal(status, 200);
  assert.ok(body.token, 'token present');
});

test('login with wrong password is rejected', async () => {
  const { status } = await apiPost('/auth/login',
    { email: 'admin@flame.org', password: 'wrong' }, { auth: false });
  assert.ok(status === 401 || status === 400, `expected 401/400, got ${status}`);
});

test('protected route rejects unauthenticated writes', async () => {
  const { status } = await apiPost('/missions', { title: 'x' }, { auth: false });
  assert.equal(status, 401);
});

// ─────────────────────────── Read endpoints ───────────────────────────
const readEndpoints = [
  '/schools', '/people', '/countries', '/residences', '/classes', '/students',
  '/medical-team', '/log-types', '/logs', '/missions', '/curriculum-docs',
  '/values-classes', '/formation', '/news', '/activities', '/birthdays',
  '/form-fields',
];
for (const ep of readEndpoints) {
  test(`GET ${ep} returns 200 and an array`, async () => {
    const { status, body } = await apiGet(ep);
    assert.equal(status, 200, `${ep} status`);
    assert.ok(Array.isArray(body), `${ep} should return an array`);
  });
}

test('GET /map/locations returns locations payload', async () => {
  const { status, body } = await apiGet('/map/locations');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.locations), 'locations array');
  assert.ok('total' in body && 'byCountry' in body, 'map payload shape');
});

test('GET /map/filters returns countries and cities', async () => {
  const { status, body } = await apiGet('/map/filters');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.countries) && Array.isArray(body.cities));
});

test('GET /dashboard/summary returns kpis with 3-state counts', async () => {
  const { status, body } = await apiGet('/dashboard/summary?from=2026-01-01&to=2026-12-31');
  assert.equal(status, 200);
  assert.ok(body.kpis, 'kpis present');
  for (const k of ['totalMissions', 'activeSchools', 'completed', 'pending', 'expected'])
    assert.ok(k in body.kpis, `kpis.${k} present`);
  assert.ok(Array.isArray(body.bySchool));
  assert.ok(Array.isArray(body.byCategory));
});

// ─────────────────────────── Mission lifecycle ───────────────────────────
test('mission requires title/status/dates/school (mandatory validation)', async () => {
  const f = await fixtures();
  // missing everything
  assert.equal((await apiPost('/missions', {})).status, 400);
  // missing school
  assert.equal((await apiPost('/missions',
    { title: 'T', status: 'expected', startDate: '2026-10-01', endDate: '2026-10-02', schoolIds: [] })).status, 400);
  // end before start
  assert.equal((await apiPost('/missions',
    { title: 'T', status: 'expected', startDate: '2026-10-05', endDate: '2026-10-01', schoolIds: [f.school.id] })).status, 400);
});

test('mission create → generates logs → edit status → availability → delete', async () => {
  const f = await fixtures();
  // Create a pending medical mission (should mark members busy)
  const created = await apiPost('/missions', {
    title: 'FN TEST mission', type: 'Medical', status: 'pending',
    startDate: '2026-10-01', endDate: '2026-10-10', summary: 'func test',
    numPeople: 2, durationDays: 10, anonymousCount: 1,
    schoolIds: [f.school.id],
    personIds: f.person ? [f.person.id] : [],
    medicalMemberIds: f.medic ? [f.medic.id] : [],
  });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(created.body.status, 'pending');

  // A dashboard log should have been generated for the school
  const logs = await apiGet(`/logs?schoolId=${f.school.id}`);
  assert.ok(logs.body.some(l => (l.notes || '').includes(`mission:${id}`)), 'generated log exists');

  // Member marked unavailable while pending
  if (f.person) {
    const people = await apiGet('/people');
    const me = people.body.find(p => p.id === f.person.id);
    assert.equal(me.available, false, 'person busy while pending');
  }

  // Patch to completed → members available again, logs become completed
  const patched = await apiPatch(`/missions/${id}`, { status: 'completed' });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.status, 'completed');
  if (f.person) {
    const people = await apiGet('/people');
    const me = people.body.find(p => p.id === f.person.id);
    assert.equal(me.available, true, 'person available after completed');
  }

  // Delete removes the mission and its generated logs
  assert.equal((await apiDelete(`/missions/${id}`)).status, 204);
  const after = await apiGet(`/logs?schoolId=${f.school.id}`);
  assert.ok(!after.body.some(l => (l.notes || '').includes(`mission:${id}`)), 'logs removed with mission');
});

// ─────────────────────────── School-level logs/tasks ───────────────────────────
test('school-level log requires summary and date', async () => {
  const f = await fixtures();
  // missing summary
  assert.equal((await apiPost('/logs',
    { schoolId: f.school.id, logTypeId: 'task', logDate: '2026-10-01' })).status, 400);
  // missing date
  assert.equal((await apiPost('/logs',
    { schoolId: f.school.id, logTypeId: 'task', summary: 'hi' })).status, 400);
});

test('school-level log create → view → edit → delete', async () => {
  const f = await fixtures();
  const created = await apiPost('/logs', {
    schoolId: f.school.id, logTypeId: 'principals_visit',
    summary: 'FN principal visit', logDate: '2026-10-03', status: 'expected',
  });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal(created.body.notes, 'FN principal visit');

  // Appears on the school task board
  const board = await apiGet(`/schools/${f.school.id}/tasks`);
  assert.ok(board.body.logs.some(l => l.id === id), 'log on school board');

  // Edit summary + status
  const edited = await apiPatch(`/logs/${id}`, { summary: 'FN updated', status: 'completed' });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.notes, 'FN updated');
  assert.equal(edited.body.status, 'completed');

  // Delete
  assert.equal((await apiDelete(`/logs/${id}`)).status, 204);
});

// ─────────────────────────── Content assignment (curriculum) ───────────────────────────
test('curriculum assign to school via PATCH reflects on school board', async () => {
  const f = await fixtures();
  const created = await apiPost('/curriculum-docs', { title: 'FN curriculum', language: 'en' });
  assert.ok(created.status === 201 || created.status === 200);
  const id = created.body.id;

  // Assign to a school
  const assigned = await apiPatch(`/curriculum-docs/${id}`, { schoolIds: [f.school.id] });
  assert.equal(assigned.status, 200);
  assert.ok(assigned.body.schools.some(s => (s.schoolId || s.school?.id) === f.school.id));

  // Shows on the school task board, default status expected
  const board = await apiGet(`/schools/${f.school.id}/tasks`);
  const row = board.body.curriculum.find(c => c.id === id);
  assert.ok(row, 'curriculum on board');
  assert.equal(row.status, 'expected');

  // Update per-school status
  const st = await apiPatch(`/curriculum-docs/${id}/school/${f.school.id}`, { status: 'completed' });
  assert.equal(st.status, 200);
  const board2 = await apiGet(`/schools/${f.school.id}/tasks`);
  assert.equal(board2.body.curriculum.find(c => c.id === id).status, 'completed');

  // Cleanup
  assert.equal((await apiDelete(`/curriculum-docs/${id}`)).status, 204);
});

// ─────────────────────────── Dashboard date filtering ───────────────────────────
test('dashboard end-of-day boundary includes same-day logs', async () => {
  const f = await fixtures();
  const today = new Date().toISOString().slice(0, 10);
  // Create a completed log dated today
  const created = await apiPost('/logs', {
    schoolId: f.school.id, logTypeId: 'task',
    summary: 'FN today task', logDate: today, status: 'completed',
  });
  const id = created.body.id;
  // Dashboard with to=today should include it
  const sum = await apiGet(`/dashboard/summary?from=2026-01-01&to=${today}`);
  const school = sum.body.bySchool.find(s => s.schoolId === f.school.id);
  assert.ok(school && school.totalMissions > 0, 'today log counted within to=today');
  await apiDelete(`/logs/${id}`);
});
