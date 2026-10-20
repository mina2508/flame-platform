import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.countryId) where.countryId = req.query.countryId;
    res.json(await prisma.school.findMany({
      where, orderBy: { name: 'asc' },
      include: { countryRef: true, classes: true },
    }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.school.findUnique({
      where: { id: req.params.id },
      include: { countryRef: true, classes: { include: { teacher: true, students: true } }, people: true },
    });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (e) { next(e); }
});

// School-level task board: everything happening at this school with a status
// (expected | pending | completed), updatable at the school level.
router.get('/:id/tasks', async (req, res, next) => {
  try {
    const schoolId = req.params.id;
    const [curr, values, formation, logs] = await Promise.all([
      prisma.curriculumSchool.findMany({ where: { schoolId }, include: { curriculum: true } }),
      prisma.valuesClassSchool.findMany({ where: { schoolId }, include: { valuesClass: true } }),
      prisma.formationSchool.findMany({ where: { schoolId }, include: { formation: true } }),
      prisma.missionLog.findMany({ where: { schoolId }, include: { logType: true, tasks: true }, orderBy: { logDate: 'desc' } }),
    ]);

    const normLogStatus = (l) => {
      if (l.status === 'completed') return 'completed';
      if (l.status === 'expected') return 'expected';
      return 'pending';
    };

    res.json({
      curriculum: curr.map(c => ({ kind: 'curriculum', id: c.curriculum.id, title: c.curriculum.title, status: c.status })),
      values: values.map(v => ({ kind: 'values', id: v.valuesClass.id, title: v.valuesClass.title, status: v.status })),
      formation: formation.map(f => ({ kind: 'formation', id: f.formation.id, title: f.formation.title, status: f.status })),
      logs: logs.map(l => ({ kind: 'log', id: l.id, title: l.logType?.label || l.logTypeId, logDate: l.logDate, status: normLogStatus(l), notes: l.notes, showOnDashboard: l.showOnDashboard })),
    });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { res.status(201).json(await prisma.school.create({ data: req.body })); }
  catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { res.json(await prisma.school.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.school.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
