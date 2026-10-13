import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_REVIEW_APPLICATIONS } from '../permissions.js';

const router = Router();

// Public — submit an application
router.post('/', async (req, res, next) => {
  try {
    const { values } = req.body; // { fieldKey: value, ... }
    const app = await prisma.application.create({
      data: { values: JSON.stringify(values || {}) },
    });
    res.status(201).json({ id: app.id, message: 'Application submitted successfully!' });
  } catch (e) { next(e); }
});

// Admin / reviewer — list all applications
router.get('/', requireAuth, requireRole(...CAN_REVIEW_APPLICATIONS), async (_, res, next) => {
  try {
    const apps = await prisma.application.findMany({ orderBy: { submittedAt: 'desc' } });
    res.json(apps.map(a => ({ ...a, values: JSON.parse(a.values) })));
  } catch (e) { next(e); }
});

// Admin — delete an application
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { await prisma.application.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
