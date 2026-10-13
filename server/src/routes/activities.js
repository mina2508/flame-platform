import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

router.get('/', async (_, res, next) => {
  try {
    const items = await prisma.activity.findMany({ orderBy: { activityDate: 'desc' }, include: { school: true } });
    // prefer localPath over imageUrl
    res.json(items.map(a => ({ ...a, imageUrl: a.localPath || a.imageUrl })));
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.activityDate) data.activityDate = new Date(data.activityDate);
    res.status(201).json(await prisma.activity.create({ data }));
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.activity.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
