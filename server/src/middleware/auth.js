import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    // user.roles is an array; allow if ANY of the user's roles is permitted
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : String(req.user.role || '').split(',').map(r => r.trim()).filter(Boolean);
    if (!userRoles.some(r => allowed.includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
