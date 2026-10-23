import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import authRouter from './routes/auth.js';
import schoolsRouter from './routes/schools.js';
import peopleRouter from './routes/people.js';
import logTypesRouter from './routes/logTypes.js';
import logsRouter from './routes/logs.js';
import dashboardRouter from './routes/dashboard.js';
import activitiesRouter from './routes/activities.js';
import newsRouter from './routes/news.js';
import birthdaysRouter from './routes/birthdays.js';
import mapRouter from './routes/map.js';
import formFieldsRouter from './routes/formFields.js';
import applicationsRouter from './routes/applications.js';
import usersRouter from './routes/users.js';
import { countriesRouter, residencesRouter, classesRouter, medicalTeamRouter, miscRouter } from './routes/reference.js';
import studentsRouter from './routes/students.js';
import { curriculumRouter as curriculumDocRouter, valuesRouter, formationRouter } from './routes/documents.js';
import missionsRouter from './routes/missions.js';
import morningAssemblyRouter from './routes/morningAssembly.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// Allow the deployed client origin(s). Set CORS_ORIGIN to a comma-separated list.
const origins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json());

// Serve locally-stored images (note: not persistent on serverless hosts)
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/auth', authRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/people', peopleRouter);
app.use('/api/log-types', logTypesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/news', newsRouter);
app.use('/api/birthdays', birthdaysRouter);
app.use('/api/map', mapRouter);
app.use('/api/form-fields', formFieldsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/countries', countriesRouter);
app.use('/api/residences', residencesRouter);
app.use('/api/classes', classesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/medical-team', medicalTeamRouter);
app.use('/api/misc', miscRouter);
app.use('/api/curriculum-docs', curriculumDocRouter);
app.use('/api/values-classes', valuesRouter);
app.use('/api/formation', formationRouter);
app.use('/api/missions', missionsRouter);
app.use('/api/morning-assembly', morningAssemblyRouter);

// Liveness check. Safe to call publicly: takes no input, exposes no data, and
// never reveals internal error details. Always returns a tiny, fixed shape.
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Keep-alive: touches the DB (SELECT 1) so a scheduled ping keeps Neon's compute
// AWAKE (free tier suspends after ~5 min idle, causing cold-start lag).
// Protected by a secret so strangers can't spin up your DB compute:
//   point your cron at /api/keepalive?key=<HEALTH_PING_KEY>  (every 5 min).
// If HEALTH_PING_KEY is unset, the DB-touching path is disabled (fails safe).
app.get('/api/keepalive', async (req, res) => {
  const secret = process.env.HEALTH_PING_KEY;
  const provided = req.query.key || req.get('x-ping-key');
  if (!secret || provided !== secret) {
    // Do NOT run a DB query for unauthenticated callers (prevents compute abuse)
    // and do NOT reveal whether a key is configured.
    return res.status(204).end();
  }
  try {
    const { prisma } = await import('./db.js');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    // Never leak the underlying error message/host to the caller.
    res.status(503).json({ ok: false });
  }
});

app.use(errorHandler);

export default app;
