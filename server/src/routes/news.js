import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';

const router = Router();

router.get('/', async (_, res, next) => {
  try {
    const items = await prisma.newsPost.findMany({ orderBy: { postDate: 'desc' } });
    res.json(items.map(n => ({ ...n, imageUrl: n.localPath || n.imageUrl })));
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.postDate) data.postDate = new Date(data.postDate);
    res.status(201).json(await prisma.newsPost.create({ data }));
  } catch (e) { next(e); }
});

router.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.postDate) data.postDate = new Date(data.postDate);
    res.json(await prisma.newsPost.update({ where: { id: req.params.id }, data }));
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.newsPost.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
