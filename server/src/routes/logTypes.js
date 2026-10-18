import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();
router.get('/', async (_, res, next) => {
  try {
    // Log types rarely change — let the browser cache them briefly.
    res.set('Cache-Control', 'private, max-age=60');
    res.json(await prisma.logType.findMany());
  } catch (e) { next(e); }
});
export default router;
