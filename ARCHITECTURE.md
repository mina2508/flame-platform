# FLAME Platform — Architecture

## 1. High-level

```
┌─────────────────────────┐     HTTPS/JSON      ┌──────────────────────────┐
│  React (Vite) frontend  │  ◄───────────────►  │  Node.js + Express API   │
│  - Public site          │                     │  - REST endpoints        │
│  - Admin panel (auth)   │                     │  - JWT auth + roles      │
└─────────────────────────┘                     │  - Business logic        │
                                                 └───────────┬──────────────┘
                                                             │ Prisma / Mongoose
                                                             ▼
                                                 ┌──────────────────────────┐
                                                 │  PostgreSQL (or MongoDB)  │
                                                 └──────────────────────────┘
            File uploads (images / PDFs) ──► local /uploads or S3/Drive
```

- **Frontend**: React + Vite, React Router, TanStack Query (data fetching),
  Tailwind for styling, Chart/calendar libs for dashboard & birthdays.
- **Backend**: Node.js + Express, JWT auth, role middleware, Zod validation.
- **DB layer**: Prisma (Postgres) — swappable with Mongoose (Mongo).
- **Auth**: email + password → JWT access token; role-gated admin routes.

## 2. Backend API (REST)

```
Auth
  POST   /api/auth/login
  POST   /api/auth/register        (admin only)
  GET    /api/auth/me

Schools
  GET    /api/schools
  POST   /api/schools              (admin)
  PATCH  /api/schools/:id          (admin)
  DELETE /api/schools/:id          (admin)

People
  GET    /api/people?schoolId=&type=
  POST   /api/people               (admin|supervisor)
  PATCH  /api/people/:id
  DELETE /api/people/:id

Log types
  GET    /api/log-types

Mission logs
  GET    /api/logs?from=&to=&schoolId=&typeId=&status=
  POST   /api/logs                 (teacher|supervisor|admin)
  GET    /api/logs/:id             (includes task records)
  PATCH  /api/logs/:id
  DELETE /api/logs/:id

Dashboard (public, read-only, aggregated)
  GET    /api/dashboard/summary?from=&to=&schoolId=&typeId=&status=
         -> KPI cards, schools×missions table, by-category, by-school,
            expected vs actual, completion signal

Curriculum
  GET    /api/curriculum?q=&folder=
  POST   /api/curriculum           (admin)   (multipart upload)
  DELETE /api/curriculum/:id       (admin)

Activities
  GET    /api/activities
  POST   /api/activities           (admin|supervisor) (multipart)
  DELETE /api/activities/:id

News
  GET    /api/news
  POST   /api/news                 (admin|supervisor) (multipart)
  PATCH  /api/news/:id
  DELETE /api/news/:id

Birthdays (derived from people.dob)
  GET    /api/birthdays?month=&q=

Applications (optional)
  POST   /api/applications         (public)
  GET    /api/applications         (admin)
```

## 3. Auth & roles

- JWT in `Authorization: Bearer <token>`.
- `requireAuth` middleware verifies token, attaches `req.user`.
- `requireRole('admin', 'supervisor')` gates write endpoints.
- Public GET endpoints (dashboard, activities, news, curriculum, birthdays)
  need no auth, mirroring the current public GitHub Pages site.

## 4. Dashboard computation (the heart of the app)

Given `from`, `to`, optional filters:
1. Load mission_logs (+ task_records) in range.
2. **Group into missions**: unique (responsiblePerson, school, date, logType).
3. A mission is **completed** if all its task records are performed; else pending/partial.
4. **Expected** per school = Σ over log types of
   `expected_per_working_day × (# working days of that school in range)`.
5. Build:
   - KPI cards: total missions, active schools (schools with movement), completion %.
   - Schools × missions table: actual/expected per category + overall %.
   - By-category breakdown and by-school progress signals
     (Strong ≥ ~85%, Growing otherwise).

Keep this logic in `services/dashboardService.js` so it's unit-testable.

## 5. Folder structure

```
flame-platform/
  server/
    src/
      index.js                # express app bootstrap
      config/ (env, db)
      middleware/ (auth, roles, error, upload)
      routes/ (auth, schools, people, logs, dashboard, curriculum,
               activities, news, birthdays)
      controllers/
      services/ (dashboardService, birthdayService)
      prisma/ (schema.prisma, seed.js)   # or models/ for Mongoose
    package.json
    .env.example
  client/
    src/
      main.jsx, App.jsx, router.jsx
      api/ (axios client, hooks)
      pages/
        public/ (Home, Dashboard, Activities, News, Curriculum,
                 Birthdays, Map, Apply)
        admin/  (Login, SchoolsAdmin, PeopleAdmin, LogsAdmin,
                 CurriculumAdmin, ActivitiesAdmin, NewsAdmin)
      components/ (KpiCard, SummaryTable, SchoolDrilldown, Calendar,
                   Gallery, NewsCard, Navbar, ProtectedRoute)
      lib/ (auth context, format)
    index.html, vite.config.js, package.json
  FEATURES_AND_DATA_MODEL.md
  ARCHITECTURE.md
  README.md
```

## 6. Migration from Google Sheets (optional, phase 2)

- Write an import script that reads the published CSV/Sheets and bulk-inserts into
  Postgres so historical data carries over.
- Keep image/PDF URLs (Drive) as-is initially; migrate to S3/local later.
