import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

const INCLUDE = {
  countries: { include: { country: true } },
  schools: { include: { school: true } },
  people: { include: { person: true } },
  medicalTeam: { include: { member: true } },
};

// Map a mission type to a dashboard LogType.
const TYPE_TO_LOGTYPE = {
  'Medical': { id: 'medical_log', key: 'medical_log', label: 'Medical Log', icon: '🏥' },
  'Follow-ups': { id: 'follow_up', key: 'follow_up', label: 'Follow Up', icon: '✚' },
  'Activities': { id: 'activities', key: 'activities', label: 'Activities', icon: '🎉' },
  'Values': { id: 'values_class', key: 'values_class', label: 'Values Class', icon: '❤' },
  'Formation': { id: 'formation', key: 'formation', label: 'Formation', icon: '📖' },
};

async function ensureLogType(missionType) {
  const map = TYPE_TO_LOGTYPE[missionType];
  if (!map) return null; // "Other"/custom types do not map to a dashboard category
  const existing = await prisma.logType.findUnique({ where: { id: map.id } }).catch(() => null);
  if (!existing) {
    await prisma.logType.create({ data: { ...map, expectedPerWorkingDay: 0 } }).catch(() => {});
  }
  return map.id;
}

// Lightweight list: country names (for display) + counts (cheap) instead of the
// full nested graph. Keeps the admin list fast and bounds tail latency under load.
const LIST_INCLUDE = {
  countries: { include: { country: { select: { id: true, name: true } } } },
  _count: { select: { schools: true, people: true, medicalTeam: true } },
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.type) where.type = req.query.type;
    const missions = await prisma.mission.findMany({ where, orderBy: { createdAt: 'desc' }, include: LIST_INCLUDE });
    // Shape so the client's `.length` reads keep working without transferring full records.
    const shaped = missions.map(({ _count, ...m }) => ({
      ...m,
      schools: Array.from({ length: _count.schools }),
      people: Array.from({ length: _count.people }),
      medicalTeam: Array.from({ length: _count.medicalTeam }),
    }));
    res.json(shaped);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const m = await prisma.mission.findUnique({ where: { id: req.params.id }, include: INCLUDE });
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { title, type = 'other', status, startDate, endDate,
            summary, numPeople, durationDays, anonymousCount = 0,
            countries = [], schoolIds = [], personIds = [], medicalMemberIds = [] } = req.body;

    // Required: title, status, start date, end date, at least one school.
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!status) return res.status(400).json({ error: 'Status is required' });
    if (!startDate) return res.status(400).json({ error: 'Start date is required' });
    if (!endDate) return res.status(400).json({ error: 'End date is required' });
    if (!Array.isArray(schoolIds) || schoolIds.length === 0) return res.status(400).json({ error: 'At least one school is required' });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ error: 'End date must be on or after the start date' });

    const mission = await prisma.mission.create({
      data: {
        title, type, status, summary,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        numPeople: numPeople ? Number(numPeople) : null,
        durationDays: durationDays ? Number(durationDays) : null,
        anonymousCount: Number(anonymousCount) || 0,
        countries: { create: countries.map(c => ({
          countryId: c.countryId,
          startDate: c.startDate ? new Date(c.startDate) : null,
          endDate: c.endDate ? new Date(c.endDate) : null,
        })) },
        schools: { create: schoolIds.map(id => ({ schoolId: id })) },
        people: { create: personIds.map(id => ({ personId: id })) },
        medicalTeam: { create: medicalMemberIds.map(id => ({ memberId: id })) },
      },
      include: INCLUDE,
    });

    // ── Mark people/medics as unavailable while a mission is pending (in progress) ──
    if (status === 'pending') {
      if (personIds.length) await prisma.person.updateMany({ where: { id: { in: personIds } }, data: { available: false } }).catch(() => {});
      if (medicalMemberIds.length) await prisma.medicalTeamMember.updateMany({ where: { id: { in: medicalMemberIds } }, data: { available: false } }).catch(() => {});
    }

    // ── Reflect in dashboard mission logs: one MissionLog per visited school ──
    const logTypeId = await ensureLogType(type);
    if (logTypeId && schoolIds.length) {
      // Use mission startDate first, then country startDate, then now
      const logDate = startDate ? new Date(startDate) : (countries[0]?.startDate ? new Date(countries[0].startDate) : new Date());
      const responsiblePersonId = personIds[0] || null;

      const countryNames = mission.countries.map(c => c.country?.name).filter(Boolean);
      const peopleNames = mission.people.map(p => p.person?.fullName).filter(Boolean);
      const medicNames = mission.medicalTeam.map(m => m.member?.fullName).filter(Boolean);

      // Capture ALL mission data as task records so nothing is lost in the dashboard.
      const tasks = [{ question: `${type} mission conducted: ${title}`, performed: true }];
      tasks.push({ question: `Status: ${status}`, performed: status === 'completed' });
      // Note: status values are expected (not started) | pending (in progress) | completed
      if (startDate || endDate) {
        const s = startDate ? new Date(startDate).toISOString().slice(0, 10) : '?';
        const e = endDate ? new Date(endDate).toISOString().slice(0, 10) : '?';
        tasks.push({ question: `Mission dates: ${s} → ${e}`, performed: true });
      }
      if (summary) tasks.push({ question: `Summary: ${summary}`, performed: true });
      if (countryNames.length) tasks.push({ question: `Countries: ${countryNames.join(', ')}`, performed: true });
      for (const c of mission.countries) {
        if (c.startDate || c.endDate) {
          const s = c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '?';
          const e = c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '?';
          tasks.push({ question: `Dates: ${s} → ${e}`, performed: true });
        }
      }
      if (numPeople) tasks.push({ question: `People involved: ${numPeople}`, performed: true });
      if (anonymousCount) tasks.push({ question: `Anonymous participants: ${anonymousCount}`, performed: true });
      if (durationDays) tasks.push({ question: `Duration: ${durationDays} day(s)`, performed: true });
      if (peopleNames.length) tasks.push({ question: `Team: ${peopleNames.join(', ')}`, performed: true, responsible: peopleNames.join(', ') });
      if (medicNames.length) tasks.push({ question: `Medical team: ${medicNames.join(', ')}`, performed: true });

      // Create one log per visited school concurrently. Log status mirrors
      // the mission status (expected | pending | completed).
      await Promise.all(schoolIds.map(schoolId =>
        prisma.missionLog.create({
          data: {
            logTypeId, schoolId, responsiblePersonId,
            logDate, status,
            notes: `mission:${mission.id} | ${title}`,
            tasks: { create: tasks.map(t => ({ ...t })) },
          },
        }).catch(() => {})
      ));
    }

    res.status(201).json(mission);
  } catch (e) { next(e); }
});

// Edit a mission: status, start/end dates, summary, counts. Keeps dashboard logs in sync.
router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { title, status, startDate, endDate, summary, numPeople, durationDays, anonymousCount } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (status !== undefined) data.status = status;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (summary !== undefined) data.summary = summary;
    if (numPeople !== undefined) data.numPeople = numPeople ? Number(numPeople) : null;
    if (durationDays !== undefined) data.durationDays = durationDays ? Number(durationDays) : null;
    if (anonymousCount !== undefined) data.anonymousCount = Number(anonymousCount) || 0;

    const mission = await prisma.mission.update({
      where: { id: req.params.id },
      data,
      include: INCLUDE,
    });

    // Sync generated dashboard logs for this mission (log status mirrors mission status)
    const logUpdate = {};
    if (status !== undefined) logUpdate.status = status;
    if (startDate !== undefined && startDate) logUpdate.logDate = new Date(startDate);
    if (Object.keys(logUpdate).length) {
      await prisma.missionLog.updateMany({
        where: { notes: { contains: `mission:${mission.id}` } },
        data: logUpdate,
      }).catch(() => {});
    }

    // Member availability follows mission status: pending (in progress) → busy, otherwise available
    const personIds = mission.people.map(p => p.personId);
    const medicIds = mission.medicalTeam.map(m => m.memberId);
    if (status !== undefined) {
      const avail = status !== 'pending';
      if (personIds.length) await prisma.person.updateMany({ where: { id: { in: personIds } }, data: { available: avail } }).catch(() => {});
      if (medicIds.length) await prisma.medicalTeamMember.updateMany({ where: { id: { in: medicIds } }, data: { available: avail } }).catch(() => {});
    }

    res.json(mission);
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    // Remove the dashboard logs generated from this mission too
    await prisma.taskRecord.deleteMany({
      where: { missionLog: { notes: { contains: `mission:${req.params.id}` } } },
    }).catch(() => {});
    await prisma.missionLog.deleteMany({
      where: { notes: { contains: `mission:${req.params.id}` } },
    }).catch(() => {});
    // Free up assigned people/medics
    const m = await prisma.mission.findUnique({ where: { id: req.params.id }, include: { people: true, medicalTeam: true } }).catch(() => null);
    if (m) {
      const pIds = m.people.map(p => p.personId);
      const mIds = m.medicalTeam.map(x => x.memberId);
      if (pIds.length) await prisma.person.updateMany({ where: { id: { in: pIds } }, data: { available: true } }).catch(() => {});
      if (mIds.length) await prisma.medicalTeamMember.updateMany({ where: { id: { in: mIds } }, data: { available: true } }).catch(() => {});
    }
    await prisma.mission.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
