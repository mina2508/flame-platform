// One-time backfill: generate dashboard MissionLogs for existing missions
// that don't have them yet. Safe to run multiple times (skips already-synced).
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TYPE_TO_LOGTYPE = {
  'Medical': { id: 'medical_log', key: 'medical_log', label: 'Medical Log', icon: '🏥' },
  'Follow-ups': { id: 'follow_up', key: 'follow_up', label: 'Follow Up', icon: '✚' },
  'Activities': { id: 'activities', key: 'activities', label: 'Activities', icon: '🎉' },
  'Values': { id: 'values_class', key: 'values_class', label: 'Values Class', icon: '❤' },
  'Formation': { id: 'formation', key: 'formation', label: 'Formation', icon: '📖' },
};

async function ensureLogType(type) {
  const map = TYPE_TO_LOGTYPE[type];
  if (!map) return null;
  const existing = await prisma.logType.findUnique({ where: { id: map.id } }).catch(() => null);
  if (!existing) await prisma.logType.create({ data: { ...map, expectedPerWorkingDay: 0 } }).catch(() => {});
  return map.id;
}

const missions = await prisma.mission.findMany({
  include: {
    countries: { include: { country: true } },
    schools: true,
    people: { include: { person: true } },
    medicalTeam: { include: { member: true } },
  },
});

let created = 0, skipped = 0;
for (const m of missions) {
  // Already synced?
  const existing = await prisma.missionLog.count({ where: { notes: { contains: `mission:${m.id}` } } });
  if (existing > 0) { skipped++; continue; }

  const logTypeId = await ensureLogType(m.type);
  if (!logTypeId || m.schools.length === 0) { skipped++; continue; }

  const logDate = m.countries[0]?.startDate ? new Date(m.countries[0].startDate) : (m.createdAt || new Date());
  const responsiblePersonId = m.people[0]?.personId || null;

  const countryNames = m.countries.map(c => c.country?.name).filter(Boolean);
  const peopleNames = m.people.map(p => p.person?.fullName).filter(Boolean);
  const medicNames = m.medicalTeam.map(x => x.member?.fullName).filter(Boolean);

  const tasks = [{ question: `${m.type} mission conducted: ${m.title}`, performed: true }];
  if (m.summary) tasks.push({ question: `Summary: ${m.summary}`, performed: true });
  if (countryNames.length) tasks.push({ question: `Countries: ${countryNames.join(', ')}`, performed: true });
  for (const c of m.countries) {
    if (c.startDate || c.endDate) {
      const s = c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '?';
      const e = c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '?';
      tasks.push({ question: `Dates: ${s} → ${e}`, performed: true });
    }
  }
  if (m.numPeople) tasks.push({ question: `People involved: ${m.numPeople}`, performed: true });
  if (m.anonymousCount) tasks.push({ question: `Anonymous participants: ${m.anonymousCount}`, performed: true });
  if (m.durationDays) tasks.push({ question: `Duration: ${m.durationDays} day(s)`, performed: true });
  if (peopleNames.length) tasks.push({ question: `Team: ${peopleNames.join(', ')}`, performed: true, responsible: peopleNames.join(', ') });
  if (medicNames.length) tasks.push({ question: `Medical team: ${medicNames.join(', ')}`, performed: true });

  for (const s of m.schools) {
    await prisma.missionLog.create({
      data: {
        logTypeId, schoolId: s.schoolId, responsiblePersonId,
        logDate, status: 'completed',
        notes: `mission:${m.id} | ${m.title}`,
        tasks: { create: tasks.map(t => ({ ...t })) },
      },
    }).catch(() => {});
  }
  created++;
}

console.log(`Backfill complete. Missions synced: ${created}, skipped (already synced or no mapping/schools): ${skipped}`);
await prisma.$disconnect();
