import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();
router.get('/', async (_, res, next) => {
  try { res.json(await prisma.logType.findMany()); } catch (e) { next(e); }
});
export default router;
