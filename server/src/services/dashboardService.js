import { prisma } from '../db.js';

const STRONG_THRESHOLD = 0.85;

export async function buildSummary({ from, to, schoolId, typeId, status }) {
  const start = from || '1970-01-01';
  const end = to || '2999-12-31';

  // Make the end boundary inclusive of the whole day (logs are stored with a time component).
  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  const where = { logDate: { gte: new Date(start), lte: endInclusive }, showOnDashboard: true };
  if (schoolId) where.schoolId = schoolId;
  if (typeId) where.logTypeId = typeId;

  // Only select the fields the summary actually needs (not full task objects) and
  // run the three reads in parallel — much less data + fewer round-trips.
  const [logs, schools, logTypes] = await Promise.all([
    prisma.missionLog.findMany({
      where,
      select: {
        id: true, schoolId: true, logTypeId: true, logDate: true, status: true,
        responsiblePersonId: true, notes: true,
        tasks: { select: { performed: true } },
      },
    }),
    prisma.school.findMany({ select: { id: true, name: true } }),
    prisma.logType.findMany({ select: { id: true, label: true, icon: true } }),
  ]);

  // Each log row is a per-school unit (used for school/category breakdowns).
  // A mission that visits N schools produces N units — that is correct: it shows
  // activity in N schools. The KPI "Total Missions" below counts DISTINCT real
  // missions (by the mission id tagged in notes), so it matches the admin.
  const missionIdFromNotes = (notes) => {
    const m = /mission:([0-9a-f-]+)/i.exec(notes || '');
    return m ? m[1] : null;
  };

  // Normalize to the 3-state model:
  //   completed  = finished
  //   expected   = not started yet
  //   pending    = started but not completed
  const stateOf = (l) => {
    if (l.status === 'completed' || (l.tasks.length && l.tasks.every(t => t.performed))) return 'completed';
    if (l.status === 'expected') return 'expected';
    return 'pending';
  };

  let units = logs.map(l => {
    const state = stateOf(l);
    return { ...l, state, completed: state === 'completed', missionId: missionIdFromNotes(l.notes) };
  });
  // Dashboard is MISSIONS-ONLY: keep just the logs generated from a real Mission
  // (tagged `mission:<id>`). Orphan/legacy school logs are excluded everywhere so
  // every count (KPIs, per-school table, categories) matches the Missions tab.
  units = units.filter(u => u.missionId);
  if (status === 'completed') units = units.filter(m => m.state === 'completed');
  if (status === 'pending') units = units.filter(m => m.state === 'pending');
  if (status === 'expected') units = units.filter(m => m.state === 'expected');
  const missions = units; // alias kept for the breakdowns below

  // Count DISTINCT real missions ONLY. A "mission" is a log generated from a real
  // Mission record (tagged `mission:<id>` in notes). Orphan/legacy logs with no
  // mission tag are school activity, NOT missions, so they are excluded from the
  // mission KPIs — this keeps the dashboard in sync with the Missions tab.
  const distinctMissionKeys = new Set(
    units.filter(u => u.missionId).map(u => `M:${u.missionId}`)
  );

  const bySchool = schools
    .filter(s => !schoolId || s.id === schoolId)
    .map(s => {
      const sm = units.filter(m => m.schoolId === s.id);
      const total = sm.length;
      const completed = sm.filter(m => m.state === 'completed').length;
      const pending = sm.filter(m => m.state === 'pending').length;
      const expected = sm.filter(m => m.state === 'expected').length;
      const signal = total ? completed / total : 0;
      return {
        schoolId: s.id, school: s.name, totalMissions: total,
        completed, pending, expected,
        completionPct: total ? Math.round(signal * 100) : 0,
        status: signal >= STRONG_THRESHOLD ? 'Strong' : 'Growing',
        latest: sm.map(m => m.logDate.toISOString().slice(0,10)).sort().at(-1) || null,
      };
    });

  const byCategory = logTypes.map(lt => {
    const cm = units.filter(m => m.logTypeId === lt.id);
    return {
      typeId: lt.id, label: lt.label, icon: lt.icon,
      total: cm.length,
      completed: cm.filter(m => m.state === 'completed').length,
      pending: cm.filter(m => m.state === 'pending').length,
      expected: cm.filter(m => m.state === 'expected').length,
      schools: new Set(cm.map(m => m.schoolId)).size,
    };
  }).filter(c => c.total > 0);

  // Distinct real missions and their completion (all school-units of a mission
  // must be completed for the mission to count as completed). Only mission-tagged
  // logs participate — orphan logs are excluded.
  const missionGroups = new Map();
  for (const u of units) {
    if (!u.missionId) continue;
    const key = `M:${u.missionId}`;
    if (!missionGroups.has(key)) missionGroups.set(key, []);
    missionGroups.get(key).push(u);
  }
  const totalMissions = distinctMissionKeys.size;
  const activeSchools = new Set(units.map(m => m.schoolId)).size;
  const groups = [...missionGroups.values()];
  const completedCount = groups.filter(g => g.every(u => u.state === 'completed')).length;
  const expectedCount = groups.filter(g => g.every(u => u.state === 'expected')).length;
  const pendingCount = totalMissions - completedCount - expectedCount;
  const completionSignal = totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0;

  return {
    range: { from: start, to: end },
    kpis: { totalMissions, activeSchools, completionSignal, completed: completedCount, pending: pendingCount, expected: expectedCount },
    bySchool, byCategory,
  };
}
