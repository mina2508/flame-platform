import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

function coerce(body) {
  const d = { ...body };
  const now = new Date();
  if (d.birthdate) {
    d.birthdate = new Date(d.birthdate);
    if (d.birthdate > now) { const e = new Error('Birthdate cannot be in the future'); e.status = 400; throw e; }
  }
  if (d.dob) {
    d.dob = new Date(d.dob);
    if (d.dob > now) { const e = new Error('Date of birth cannot be in the future'); e.status = 400; throw e; }
  }
  if (d.available !== undefined) d.available = Boolean(d.available);
  if (d.isPriest !== undefined) d.isPriest = Boolean(d.isPriest);
  return d;
}

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.schoolId) where.schoolId = req.query.schoolId;
    if (req.query.residenceId) where.residenceId = req.query.residenceId;
    if (req.query.type) where.position = req.query.type;
    if (req.query.isPriest !== undefined) where.isPriest = req.query.isPriest === 'true';
    if (req.query.available !== undefined) where.available = req.query.available === 'true';
    // country filter: match school's country OR priest's assigned country
    if (req.query.countryId) {
      where.OR = [
        { school: { countryId: req.query.countryId } },
        { priestCountryId: req.query.countryId },
      ];
    }
    const people = await prisma.person.findMany({
      where,
      include: {
        school: { include: { countryRef: true } },
        priestCountry: true,
        residence: true,
        classesTaught: { include: { school: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(people);
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { res.status(201).json(await prisma.person.create({ data: coerce(req.body) })); }
  catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { res.json(await prisma.person.update({ where: { id: req.params.id }, data: coerce(req.body) })); }
  catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.person.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
