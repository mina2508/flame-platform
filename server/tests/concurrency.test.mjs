import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiGet, apiPost, apiDelete, concurrent, fixtures } from './helpers.mjs';

// ─────────────────────────── Concurrent reads ───────────────────────────
test('50 concurrent reads to mixed endpoints all succeed', async () => {
  const paths = ['/schools', '/people', '/missions', '/logs', '/dashboard/summary', '/countries'];
  const { results } = await concurrent(50, (i) => apiGet(paths[i % paths.length]));
  assert.ok(results.every(r => r.status === 200), 'all concurrent reads 200');
});

// ─────────────────────────── Concurrent mission creation ───────────────────────────
test('20 concurrent mission creates produce 20 distinct missions', async () => {
  const f = await fixtures();
  const { results } = await concurrent(20, (i) => apiPost('/missions', {
    title: `CC mission ${i} ${Date.now()}`, type: 'Medical', status: 'expected',
    startDate: '2026-09-01', endDate: '2026-09-05',
    summary: `concurrency ${i}`, schoolIds: [f.school.id],
  }));
  const ids = results.map(r => r.body.id);
  assert.ok(results.every(r => r.status === 201), 'all created 201');
  assert.equal(new Set(ids).size, 20, 'all mission ids unique');

  // Each should have generated exactly one log for the school
  const logs = await apiGet(`/logs?schoolId=${f.school.id}`);
  for (const id of ids) {
    const count = logs.body.filter(l => (l.notes || '').includes(`mission:${id}`)).length;
    assert.equal(count, 1, `mission ${id} generated exactly one log`);
  }

  // Cleanup concurrently
  const { results: dels } = await concurrent(ids.length, (i) => apiDelete(`/missions/${ids[i]}`));
  assert.ok(dels.every(r => r.status === 204), 'all deletes 204');
});

// ─────────────────────────── Concurrent multi-school logs ───────────────────────────
test('one mission across many schools generates all logs concurrently', async () => {
  const f = await fixtures();
  const schoolIds = f.schools.slice(0, Math.min(4, f.schools.length)).map(s => s.id);
  const created = await apiPost('/missions', {
    title: `CC multi ${Date.now()}`, type: 'Medical', status: 'completed',
    startDate: '2026-09-10', endDate: '2026-09-12',
    summary: 'multi-school', schoolIds,
  });
  assert.equal(created.status, 201);
  const id = created.body.id;

  // Wait briefly for log generation, then verify one log per school
  await new Promise(r => setTimeout(r, 300));
  const logs = await apiGet('/logs');
  const generated = logs.body.filter(l => (l.notes || '').includes(`mission:${id}`));
  assert.equal(generated.length, schoolIds.length, 'one log per visited school');
  assert.equal(new Set(generated.map(l => l.schoolId)).size, schoolIds.length, 'distinct schools');

  await apiDelete(`/missions/${id}`);
});

// ─────────────────────────── Concurrent status updates ───────────────────────────
test('concurrent school-level log status updates stay consistent', async () => {
  const { apiPatch } = await import('./helpers.mjs');
  const f = await fixtures();

  // Create 10 logs concurrently
  const { results: created } = await concurrent(10, (i) => apiPost('/logs', {
    schoolId: f.school.id, logTypeId: 'task',
    summary: `CC task ${i}`, logDate: '2026-09-15', status: 'expected',
  }));
  const ids = created.map(r => r.body.id);
  assert.ok(created.every(r => r.status === 201), 'all logs created');

  // Flip all to completed concurrently
  const { results: patched } = await concurrent(ids.length, (i) =>
    apiPatch(`/logs/${ids[i]}`, { status: 'completed' }));
  assert.ok(patched.every(r => r.status === 200), 'all patches 200');

  // Verify all are completed
  const board = await apiGet(`/schools/${f.school.id}/tasks`);
  for (const id of ids) {
    const row = board.body.logs.find(l => l.id === id);
    assert.ok(row, `log ${id} present`);
    assert.equal(row.status, 'completed', `log ${id} completed`);
  }

  // Cleanup concurrently
  await concurrent(ids.length, (i) => apiDelete(`/logs/${ids[i]}`));
});

// ─────────────────────────── No data loss under concurrent create+delete ───────────────────────────
test('concurrent create then concurrent delete leaves no residue', async () => {
  const f = await fixtures();
  const before = (await apiGet('/missions')).body.length;

  const { results: created } = await concurrent(15, (i) => apiPost('/missions', {
    title: `CC churn ${i} ${Date.now()}`, type: 'Follow-ups', status: 'expected',
    startDate: '2026-08-01', endDate: '2026-08-02', summary: 'churn',
    schoolIds: [f.school.id],
  }));
  const ids = created.map(r => r.body.id);

  const mid = (await apiGet('/missions')).body.length;
  assert.equal(mid, before + 15, 'all 15 created');

  await concurrent(ids.length, (i) => apiDelete(`/missions/${ids[i]}`));
  const after = (await apiGet('/missions')).body.length;
  assert.equal(after, before, 'back to baseline after deletes');
});
