# FLAME Platform (React + Node.js)

A rebuild of the FLAME Function platform — school missions, public dashboard,
activities, news, curriculum library, and birthdays calendar — with a React
frontend and a Node/Express API.

See `FEATURES_AND_DATA_MODEL.md` and `ARCHITECTURE.md` for the full design.

## What's included

- **server/** — Express API with JWT auth + roles, and all endpoints
  (schools, people, mission logs, dashboard summary, curriculum, activities,
  news, birthdays). Uses an in-memory seed store so it runs with no database.
- **client/** — React (Vite + Tailwind) app with public pages (Home, Dashboard,
  Activities, News, Curriculum, Birthdays) and an admin panel (login + CRUD).

## Run it

Open two terminals.

### 1) API
```
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:4000
```

### 2) Web
```
cd client
npm install
npm run dev               # http://localhost:5173
```

The client proxies `/api` to the server (see `client/vite.config.js`).

### Seed login credentials (one per role)

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@flame.org` | `Flame@Admin2026` | Full access. The ONLY role that can add/manage users. |
| **Content Editor** | `content@flame.org` | `Flame@Content2026` | Edit content: schools, people, news, activities, curriculum. |
| **Reviewer** | `reviewer@flame.org` | `Flame@Review2026` | Review (view) submitted applications only. |
| **Form Manager** | `forms@flame.org` | `Flame@Forms2026` | Edit the application form fields only. |

### Roles & permissions

- **admin** — can do everything, and is the only role that can create and manage other users.
- **content_editor** — can create/edit/delete content (schools, people, news, activities, curriculum).
- **reviewer** — can view submitted applications only.
- **form_manager** — can add/remove/edit the public application form fields only.

## Next steps (production)

1. Replace `server/src/data/store.js` with a real database:
   - Postgres + Prisma (schema in `FEATURES_AND_DATA_MODEL.md`), or
   - MongoDB + Mongoose (see the NoSQL section).
2. Add file uploads (multer → local `/uploads` or S3) for images/PDFs.
3. Add the World Missions map page (Leaflet/Mapbox).
4. Optional: import historical data from the published Google Sheets.
5. Harden auth (refresh tokens, password reset), add input validation (Zod).
