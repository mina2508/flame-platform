import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiGet, apiPost, apiPatch, apiDelete, fixtures } from './helpers.mjs';

// One focused test case per feature, exercising the real end-to-end flow.
// Each test creates and cleans up its own data so the suite is re-runnable.

// ── Feature: Auth & Roles ──
test('FEATURE auth: login issues a JWT and protects writes', async () => {
  const ok = await apiPost('/auth/login', { email: 'admin@flame.org', password: 'Flame@Admin2026' }, { auth: false });
  assert.equal(ok.status, 200); assert.ok(ok.body.token);
  const bad = await apiPost('/auth/login', { email: 'admin@flame.org', password: 'nope' }, { auth: false });
  assert.ok([400, 401].includes(bad.status));
  const noauth = await apiPost('/missions', { title: 'x' }, { auth: false });
  assert.equal(noauth.status, 401);
});

// ── Feature: Countries CRUD (reference) ──
test('FEATURE countries: create → edit → delete', async () => {
  const c = await apiPost('/countries', { name: `TESTLAND ${Date.now()}`, code: 'TL' });
  assert.equal(c.status, 201);
  const e = await apiPatch(`/countries/${c.body.id}`, { code: 'TX' });
  assert.equal(e.status, 200); assert.equal(e.body.code, 'TX');
  assert.equal((await apiDelete(`/countries/${c.body.id}`)).status, 204);
});

// ── Feature: People (teacher/priest/servant) ──
test('FEATURE people: create teacher, reject future birthdate, edit, delete', async () => {
  const future = new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10);
  const bad = await apiPost('/people', { fullName: 'Future Kid', position: 'Teacher', birthdate: future });
  assert.equal(bad.status, 400, 'future birthdate rejected');

  const p = await apiPost('/people', { fullName: `TEST Teacher ${Date.now()}`, position: 'Teacher' });
  assert.equal(p.status, 201);
  const listed = await apiGet('/people?type=Teacher');
  assert.ok(listed.body.some(x => x.id === p.body.id), 'teacher appears in filtered list');
  const e = await apiPatch(`/people/${p.body.id}`, { contact: '0100' });
  assert.equal(e.body.contact, '0100');
  await apiDelete(`/people/${p.body.id}`);
});

// ── Feature: Students (linked to class) ──
test('FEATURE students: create under a class → edit → delete', async () => {
  const classes = await apiGet('/classes');
  const cls = classes.body[0];
  if (!cls) return; // no class seeded
  const st = await apiPost('/students', { fullName: `TEST Student ${Date.now()}`, classId: cls.id, fatherName: 'Dad' });
  assert.equal(st.status, 201);
  const e = await apiPatch(`/students/${st.body.id}`, { phone: '123' });
  assert.equal(e.body.phone, '123');
  await apiDelete(`/students/${st.body.id}`);
});

// ── Feature: Medical team & availability ──
test('FEATURE medical-team: create, toggle availability, delete', async () => {
  const m = await apiPost('/medical-team', { fullName: `TEST Medic ${Date.now()}`, specialty: 'GP' });
  assert.equal(m.status, 201); assert.equal(m.body.available, true);
  const t = await apiPatch(`/medical-team/${m.body.id}`, { available: false });
  assert.equal(t.body.available, false);
  await apiDelete(`/medical-team/${m.body.id}`);
});

// ── Feature: Curriculum assign + per-school status ──
test('FEATURE curriculum: create → assign to school → set per-school status → delete', async () => {
  const f = await fixtures();
  const c = await apiPost('/curriculum-docs', { title: `TEST Curr ${Date.now()}`, language: 'en' });
  assert.ok([200, 201].includes(c.status));
  const a = await apiPatch(`/curriculum-docs/${c.body.id}`, { schoolIds: [f.school.id] });
  assert.ok(a.body.schools.some(s => (s.schoolId || s.school?.id) === f.school.id));
  const st = await apiPatch(`/curriculum-docs/${c.body.id}/school/${f.school.id}`, { status: 'completed' });
  assert.equal(st.status, 200);
  const board = await apiGet(`/schools/${f.school.id}/tasks`);
  assert.equal(board.body.curriculum.find(x => x.id === c.body.id).status, 'completed');
  await apiDelete(`/curriculum-docs/${c.body.id}`);
});

// ── Feature: Values class ──
test('FEATURE values-class: create → assign → status → delete', async () => {
  const f = await fixtures();
  const v = await apiPost('/values-classes', { title: `TEST Values ${Date.now()}`, language: 'en' });
  assert.ok([200, 201].includes(v.status));
  await apiPatch(`/values-classes/${v.body.id}`, { schoolIds: [f.school.id] });
  const st = await apiPatch(`/values-classes/${v.body.id}/school/${f.school.id}`, { status: 'pending' });
  assert.equal(st.status, 200);
  await apiDelete(`/values-classes/${v.body.id}`);
});

// ── Feature: Formation ──
test('FEATURE formation: create → assign → status → delete', async () => {
  const f = await fixtures();
  const fo = await apiPost('/formation', { title: `TEST Formation ${Date.now()}` });
  assert.ok([200, 201].includes(fo.status));
  await apiPatch(`/formation/${fo.body.id}`, { schoolIds: [f.school.id] });
  const st = await apiPatch(`/formation/${fo.body.id}/school/${f.school.id}`, { status: 'completed' });
  assert.equal(st.status, 200);
  await apiDelete(`/formation/${fo.body.id}`);
});

// ── Feature: Missions lifecycle ──
test('FEATURE missions: validation, create, status edit, availability, delete', async () => {
  const f = await fixtures();
  assert.equal((await apiPost('/missions', {})).status, 400, 'empty rejected');
  const m = await apiPost('/missions', {
    title: `TEST Mission ${Date.now()}`, type: 'Medical', status: 'pending',
    startDate: '2026-10-01', endDate: '2026-10-10', summary: 's',
    schoolIds: [f.school.id], personIds: f.person ? [f.person.id] : [], medicalMemberIds: f.medic ? [f.medic.id] : [],
  });
  assert.equal(m.status, 201);
  if (f.person) {
    const me = (await apiGet('/people')).body.find(p => p.id === f.person.id);
    assert.equal(me.available, false, 'person busy while pending');
  }
  const done = await apiPatch(`/missions/${m.body.id}`, { status: 'completed' });
  assert.equal(done.body.status, 'completed');
  if (f.person) {
    const me = (await apiGet('/people')).body.find(p => p.id === f.person.id);
    assert.equal(me.available, true, 'person free after completed');
  }
  assert.equal((await apiDelete(`/missions/${m.body.id}`)).status, 204);
});

// ── Feature: School-level logs/tasks ──
test('FEATURE school-logs: mandatory summary+date, create, edit, board, delete', async () => {
  const f = await fixtures();
  assert.equal((await apiPost('/logs', { schoolId: f.school.id, logTypeId: 'task', logDate: '2026-10-01' })).status, 400);
  assert.equal((await apiPost('/logs', { schoolId: f.school.id, logTypeId: 'task', summary: 'hi' })).status, 400);
  const l = await apiPost('/logs', { schoolId: f.school.id, logTypeId: 'principals_visit', summary: 'FEAT visit', logDate: '2026-10-02', status: 'expected' });
  assert.equal(l.status, 201);
  const board = await apiGet(`/schools/${f.school.id}/tasks`);
  assert.ok(board.body.logs.some(x => x.id === l.body.id));
  const e = await apiPatch(`/logs/${l.body.id}`, { status: 'completed', summary: 'FEAT done' });
  assert.equal(e.body.status, 'completed'); assert.equal(e.body.notes, 'FEAT done');
  await apiDelete(`/logs/${l.body.id}`);
});

// ── Feature: Dashboard summary ──
test('FEATURE dashboard: 3-state KPIs and consistent school rows', async () => {
  const d = await apiGet('/dashboard/summary?from=2026-01-01&to=2026-12-31');
  assert.equal(d.status, 200);
  for (const k of ['totalMissions', 'completed', 'pending', 'expected', 'activeSchools'])
    assert.ok(k in d.body.kpis, `kpi ${k}`);
  for (const s of d.body.bySchool)
    assert.equal(s.completed + s.pending + s.expected, s.totalMissions, `${s.school} counts reconcile`);
});

// ── Feature: Dynamic application form ──
test('FEATURE form: define field, submit application, review', async () => {
  const key = `test_field_${Date.now()}`;
  const field = await apiPost('/form-fields', { label: 'Test Field', key, type: 'text', order: 99 });
  assert.ok([200, 201].includes(field.status));
  const sub = await apiPost('/applications', { values: { [key]: 'hello' } }, { auth: false });
  assert.ok([200, 201].includes(sub.status));
  const apps = await apiGet('/applications', { auth: true });
  assert.equal(apps.status, 200);
  await apiDelete(`/form-fields/${field.body.id}`);
});

// ── Feature: World map (geocoding + country markers) ──
test('FEATURE map: every school is placed and country markers exist', async () => {
  const schools = (await apiGet('/schools')).body;
  const loc = await apiGet('/map/locations');
  assert.equal(loc.status, 200);
  assert.equal(loc.body.total, schools.length, 'all schools placed (incl. geocoded fallback)');
  const fil = await apiGet('/map/filters');
  assert.ok(Array.isArray(fil.body.countryMarkers));
  assert.ok(fil.body.countryMarkers.every(m => typeof m.lat === 'number' && typeof m.lng === 'number'));
});

// ── Feature: Activities / News / Birthdays ──
test('FEATURE content: activities, news, birthdays endpoints return arrays', async () => {
  for (const ep of ['/activities', '/news', '/birthdays']) {
    const r = await apiGet(ep);
    assert.equal(r.status, 200, ep); assert.ok(Array.isArray(r.body), ep);
  }
});
