import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.classId) where.classId = req.query.classId;
    if (req.query.schoolId) where.classLevel = { schoolId: req.query.schoolId };
    if (req.query.countryId) where.classLevel = { school: { countryId: req.query.countryId } };
    const students = await prisma.student.findMany({
      where,
      include: { classLevel: { include: { school: { include: { countryRef: true } } } } },
      orderBy: { fullName: 'asc' },
    });
    res.json(students);
  } catch (e) { next(e); }
});

function coerce(b) {
  if (!b.classId) { const e = new Error('Student must be linked to a class (school)'); e.status = 400; throw e; }
  const d = { ...b };
  if (d.birthday) {
    d.birthday = new Date(d.birthday);
    if (d.birthday > new Date()) { const e = new Error('Birthday cannot be in the future'); e.status = 400; throw e; }
  }
  return d;
}

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { res.status(201).json(await prisma.student.create({ data: coerce(req.body) })); }
  catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const d = { ...req.body };
    if (d.birthday) d.birthday = new Date(d.birthday);
    res.json(await prisma.student.update({ where: { id: req.params.id }, data: d }));
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.student.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
