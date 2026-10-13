import { Router } from 'express';
import { buildSummary } from '../services/dashboardService.js';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    const { from, to, schoolId, typeId, status } = req.query;
    res.json(await buildSummary({ from, to, schoolId, typeId, status }));
  } catch (e) { next(e); }
});

export default router;
