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
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve locally-stored images
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
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

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`FLAME API running on http://localhost:${PORT}`));
