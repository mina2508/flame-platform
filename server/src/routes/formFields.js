import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_MANAGE_FORM } from '../permissions.js';

const router = Router();

// Public — the application form schema (active fields, ordered)
router.get('/', async (_, res, next) => {
  try {
    const fields = await prisma.formField.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    res.json(fields.map(f => ({ ...f, options: f.options ? JSON.parse(f.options) : null })));
  } catch (e) { next(e); }
});

// Admin / form_manager — all fields (including inactive)
router.get('/all', requireAuth, requireRole(...CAN_MANAGE_FORM), async (_, res, next) => {
  try {
    const fields = await prisma.formField.findMany({ orderBy: { order: 'asc' } });
    res.json(fields.map(f => ({ ...f, options: f.options ? JSON.parse(f.options) : null })));
  } catch (e) { next(e); }
});

// Admin / form_manager — create a field
router.post('/', requireAuth, requireRole(...CAN_MANAGE_FORM), async (req, res, next) => {
  try {
    const { label, key, type = 'text', options, required = false, order = 0, active = true } = req.body;
    const field = await prisma.formField.create({
      data: {
        label, key, type, required, order, active,
        options: options ? JSON.stringify(options) : null,
      },
    });
    res.status(201).json({ ...field, options: field.options ? JSON.parse(field.options) : null });
  } catch (e) { next(e); }
});

// Admin / form_manager — update a field
router.patch('/:id', requireAuth, requireRole(...CAN_MANAGE_FORM), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.options !== undefined) data.options = data.options ? JSON.stringify(data.options) : null;
    const field = await prisma.formField.update({ where: { id: req.params.id }, data });
    res.json({ ...field, options: field.options ? JSON.parse(field.options) : null });
  } catch (e) { next(e); }
});

// Admin / form_manager — delete a field
router.delete('/:id', requireAuth, requireRole(...CAN_MANAGE_FORM), async (req, res, next) => {
  try { await prisma.formField.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
