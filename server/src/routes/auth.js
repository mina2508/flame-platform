import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const roles = String(user.role || '').split(',').map(r => r.trim()).filter(Boolean);
    const token = jwt.sign({ id: user.id, roles, name: user.name }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, roles } });
  } catch (e) { next(e); }
});

router.post('/register', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, roles = ['reviewer'] } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email in use' });
    const roleStr = Array.isArray(roles) ? roles.join(',') : roles;
    const user = await prisma.user.create({
      data: { name, email, passwordHash: bcrypt.hashSync(password, 10), role: roleStr },
    });
    res.status(201).json({ id: user.id, name, email, roles: roleStr.split(',') });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, (req, res) => res.json(req.user));

export default router;
