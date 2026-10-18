import { PrismaClient } from '@prisma/client';

// On serverless (Vercel), each warm invocation reuses the same Node process.
// Caching the client on globalThis prevents a brand-new connection pool from
// being created on every request/hot-reload, which is a major latency source.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__flamePrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Cache in all environments. On Vercel the warm container reuses this instance,
// so we avoid re-opening the DB connection pool on every function invocation.
globalForPrisma.__flamePrisma = prisma;

// Warm up the connection on cold start. Firing a trivial query at module load
// kicks off the TLS handshake + Neon wake-up in the background so it overlaps
// with request parsing/auth, shaving time off the first real query.
if (!globalForPrisma.__flameWarmed) {
  globalForPrisma.__flameWarmed = true;
  prisma.$queryRaw`SELECT 1`.catch(() => {});
}
