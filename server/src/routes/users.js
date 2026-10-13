import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const toArr = (role) => String(role || '').split(',').map(r => r.trim()).filter(Boolean);
const toStr = (roles) => (Array.isArray(roles) ? roles.join(',') : String(roles || ''));

// Admin — list all users
router.get('/', requireAuth, requireRole('admin'), async (_, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, roles: toArr(u.role), createdAt: u.createdAt })));
  } catch (e) { next(e); }
});

// Admin — create user (roles can be an array)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, roles = ['reviewer'] } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already in use' });
    const user = await prisma.user.create({
      data: { name, email, passwordHash: bcrypt.hashSync(password, 10), role: toStr(roles) },
    });
    res.status(201).json({ id: user.id, name, email, roles: toArr(user.role) });
  } catch (e) { next(e); }
});

// Admin — update user (name, roles, password)
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.roles !== undefined) data.role = toStr(req.body.roles);
    if (req.body.password) data.passwordHash = bcrypt.hashSync(req.body.password, 10);
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ id: user.id, name: user.name, email: user.email, roles: toArr(user.role) });
  } catch (e) { next(e); }
});

// Admin — delete user
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { await prisma.user.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

export default router;
