import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';
import { uploadSmall, fileUrl } from '../middleware/upload.js';

const router = Router();

const SECTIONS = ['openingPrayer', 'physicalExercise', 'radio', 'nationalAnthem', 'inspection', 'announcement'];
const fileFields = SECTIONS.map(s => ({ name: `${s}File`, maxCount: 1 }));

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.schoolId) where.schoolId = req.query.schoolId;
    res.json(await prisma.morningAssembly.findMany({ where, orderBy: { date: 'desc' } }));
  } catch (e) { next(e); }
});

// Each section accepts text (body field) OR a file (≤2MB, field named <section>File)
router.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), uploadSmall.fields(fileFields), async (req, res, next) => {
  try {
    const data = { schoolId: req.body.schoolId || null, date: req.body.date ? new Date(req.body.date) : new Date() };
    for (const s of SECTIONS) {
      data[s] = req.body[s] || null;                         // text
      const f = req.files?.[`${s}File`]?.[0];
      data[`${s}File`] = f ? fileUrl(f) : null;              // file
    }
    res.status(201).json(await prisma.morningAssembly.create({ data }));
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.morningAssembly.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
