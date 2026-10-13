import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

// Log types that can be created directly at the school level, with labels/icons.
const SCHOOL_LOG_TYPES = {
  medical_log:     { label: 'Medical Log',     icon: '🏥' },
  principals_visit:{ label: 'Principals Visit', icon: '🏫' },
  follow_up:       { label: 'Follow Up',        icon: '✚' },
  activities:      { label: 'Activities',       icon: '🎉' },
  values_class:    { label: 'Values Class',     icon: '❤' },
  task:            { label: 'Task',             icon: '📋' },
};

async function ensureLogType(id) {
  const map = SCHOOL_LOG_TYPES[id];
  if (!map) return;
  const existing = await prisma.logType.findUnique({ where: { id } }).catch(() => null);
  if (!existing) await prisma.logType.create({ data: { id, key: id, label: map.label, icon: map.icon, expectedPerWorkingDay: 0 } }).catch(() => {});
}

router.get('/', async (req, res, next) => {
  try {
    const { from, to, schoolId, typeId, status } = req.query;
    const where = {};
    if (from || to) {
      where.logDate = {};
      if (from) where.logDate.gte = new Date(from);
      if (to) { const e = new Date(to); e.setHours(23, 59, 59, 999); where.logDate.lte = e; }
    }
    if (schoolId) where.schoolId = schoolId;
    if (typeId) where.logTypeId = typeId;
    if (status) where.status = status;
    res.json(await prisma.missionLog.findMany({ where, include: { tasks: true, logType: true, school: true }, orderBy: { logDate: 'desc' } }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const l = await prisma.missionLog.findUnique({ where: { id: req.params.id }, include: { tasks: true, school: true, logType: true } });
    if (!l) return res.status(404).json({ error: 'Not found' });
    res.json(l);
  } catch (e) { next(e); }
});

// Create a school-level log/task (medical log, principals visit, task, etc.)
// Summary and date are mandatory.
router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { tasks, summary, logTypeId, schoolId, logDate, status = 'expected', responsiblePersonId } = req.body;

    if (!schoolId) return res.status(400).json({ error: 'School is required' });
    if (!logTypeId) return res.status(400).json({ error: 'Type is required' });
    if (!summary || !summary.trim()) return res.status(400).json({ error: 'Summary is required' });
    if (!logDate) return res.status(400).json({ error: 'Date is required' });

    await ensureLogType(logTypeId);

    // Store summary in notes and also as a task record so it surfaces in the dashboard.
    const taskList = [{ question: `Summary: ${summary}`, performed: status === 'completed' }];
    if (Array.isArray(tasks)) taskList.push(...tasks);

    const log = await prisma.missionLog.create({
      data: {
        logTypeId, schoolId, status,
        logDate: new Date(logDate),
        responsiblePersonId: responsiblePersonId || null,
        notes: summary,
        createdById: req.user.id,
        tasks: { create: taskList },
      },
      include: { tasks: true, logType: true, school: true },
    });
    res.status(201).json(log);
  } catch (e) { next(e); }
});

// Edit a school-level log/task.
router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { summary, logDate, status, logTypeId, responsiblePersonId } = req.body;
    const data = {};
    if (logTypeId !== undefined) data.logTypeId = logTypeId;
    if (status !== undefined) data.status = status;
    if (responsiblePersonId !== undefined) data.responsiblePersonId = responsiblePersonId || null;
    if (logDate !== undefined && logDate) data.logDate = new Date(logDate);
    if (summary !== undefined) data.notes = summary;

    if (data.logTypeId) await ensureLogType(data.logTypeId);

    const log = await prisma.missionLog.update({ where: { id: req.params.id }, data, include: { tasks: true, logType: true } });

    // Keep the "Summary:" task record in sync when summary changes.
    if (summary !== undefined) {
      const summaryTask = log.tasks.find(t => t.question?.startsWith('Summary:'));
      if (summaryTask) await prisma.taskRecord.update({ where: { id: summaryTask.id }, data: { question: `Summary: ${summary}` } }).catch(() => {});
      else await prisma.taskRecord.create({ data: { missionLogId: log.id, question: `Summary: ${summary}`, performed: (status || log.status) === 'completed' } }).catch(() => {});
    }

    res.json(await prisma.missionLog.findUnique({ where: { id: req.params.id }, include: { tasks: true, logType: true, school: true } }));
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    await prisma.taskRecord.deleteMany({ where: { missionLogId: req.params.id } }).catch(() => {});
    await prisma.missionLog.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

// Expose the school-creatable log types for the UI.
router.get('/types/school', (_, res) => {
  res.json(Object.entries(SCHOOL_LOG_TYPES).map(([id, v]) => ({ id, ...v })));
});

export default router;
