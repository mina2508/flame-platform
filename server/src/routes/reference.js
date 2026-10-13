import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

// Generic CRUD factory for a Prisma model.
function makeCrudRouter(model, { include, orderBy, transformIn } = {}) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const where = {};
      // simple query filters: ?schoolId=, ?classId=, ?countryId=, ?available=
      for (const k of ['schoolId', 'classId', 'countryId', 'residenceId', 'type', 'available']) {
        if (req.query[k] !== undefined) {
          where[k] = req.query[k] === 'true' ? true : req.query[k] === 'false' ? false : req.query[k];
        }
      }
      res.json(await prisma[model].findMany({ where, include, orderBy }));
    } catch (e) { next(e); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await prisma[model].findUnique({ where: { id: req.params.id }, include });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) { next(e); }
  });

  router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
    try {
      const data = transformIn ? transformIn(req.body) : req.body;
      res.status(201).json(await prisma[model].create({ data }));
    } catch (e) { next(e); }
  });

  router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
    try {
      const data = transformIn ? transformIn(req.body) : req.body;
      res.json(await prisma[model].update({ where: { id: req.params.id }, data }));
    } catch (e) { next(e); }
  });

  router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
    try { await prisma[model].delete({ where: { id: req.params.id } }); res.status(204).end(); }
    catch (e) { next(e); }
  });

  return router;
}

// date coercion helpers
const dates = (fields) => (body) => {
  const d = { ...body };
  for (const f of fields) if (d[f]) d[f] = new Date(d[f]);
  return d;
};

export const countriesRouter = makeCrudRouter('country', { orderBy: { name: 'asc' } });
export const residencesRouter = makeCrudRouter('residence', {
  include: { country: true, residents: true }, orderBy: { name: 'asc' },
  transformIn: (b) => {
    if (!b.countryId) { const e = new Error('Residence must be linked to a country'); e.status = 400; throw e; }
    return b;
  },
});
export const classesRouter = makeCrudRouter('classLevel', { include: { school: true, teacher: true, students: true }, orderBy: { order: 'asc' } });
export const medicalTeamRouter = makeCrudRouter('medicalTeamMember', { orderBy: { fullName: 'asc' } });
export const miscRouter = makeCrudRouter('miscEntry', { orderBy: { category: 'asc' } });
