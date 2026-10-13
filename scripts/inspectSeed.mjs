import { prisma } from '../src/db.js';

const idFromNotes = (n) => { const m = /mission:([0-9a-f-]+)/i.exec(n || ''); return m ? m[1] : null; };

const schools = await prisma.school.findMany();
const byId = Object.fromEntries(schools.map(s => [s.id, s.name]));

const logs = await prisma.missionLog.findMany({ include: { logType: true } });
console.log('Total MissionLog rows:', logs.length);

// group logs per school, split real-mission vs legacy
const groups = {};
for (const l of logs) {
  const key = byId[l.schoolId] || l.schoolId;
  groups[key] = groups[key] || { real: 0, legacy: [] };
  if (idFromNotes(l.notes)) groups[key].real++;
  else groups[key].legacy.push({ id: l.id, type: l.logTypeId, date: l.logDate.toISOString().slice(0,10), status: l.status, notes: (l.notes||'').slice(0,40) });
}
for (const [school, g] of Object.entries(groups)) {
  console.log(`\n${school}: realMissionLogs=${g.real} legacySeedLogs=${g.legacy.length}`);
  for (const x of g.legacy) console.log(`   LEGACY ${x.type} ${x.date} [${x.status}] ${x.notes}`);
}

const realMissions = await prisma.mission.findMany();
console.log('\nReal Mission records (admin tab):', realMissions.length, '->', realMissions.map(m=>m.title).join(', '));
process.exit(0);
