# Deploying FLAME for free (Render)

This deploys three services from your GitHub repo, all on Render's **free** tier:
- **flame-db** — PostgreSQL database
- **flame-api** — Node/Express API
- **flame-web** — React client (static site)

Everything is defined in `render.yaml` (a Blueprint), so it's almost one-click.

## One-time setup
1. Go to **https://render.com** and sign up (free, no credit card). Choose **"Sign in with GitHub"**.
2. Authorize Render to access the `mina2508/flame-platform` repo.

## Deploy with the Blueprint
3. In Render: **New ➜ Blueprint**.
4. Select the **flame-platform** repo. Render detects `render.yaml` and shows 3 resources.
5. Click **Apply**. Render creates the database, API, and web site and starts building.
   - First build takes a few minutes (installs deps, runs `prisma db push`, seeds the DB).

## Connect the two URLs (after first deploy)
Render gives each service a URL like:
- API:  `https://flame-api.onrender.com`
- Web:  `https://flame-web.onrender.com`

Set the two cross-reference env vars, then redeploy each:
6. **flame-api ➜ Environment**: set `CORS_ORIGIN` = your web URL (e.g. `https://flame-web.onrender.com`). Save → it redeploys.
7. **flame-web ➜ Environment**: set `VITE_API_BASE_URL` = your API URL (e.g. `https://flame-api.onrender.com`). Save → **Manual Deploy ➜ Clear build cache & deploy** (so the new value is baked into the build).

## Done
- Open the web URL — the public site + admin now run on the internet.
- Log in with the seeded admin: `admin@flame.org` / `Flame@Admin2026` (change this for real use).

## Point the mobile app at the deployed API
In `flame-mobile/src/config.js`, replace the LAN IP with the deployed API, e.g.:
```js
export const API_BASE_URL = 'https://flame-api.onrender.com/api';
```
Now the phone no longer needs to be on your Wi-Fi.

## Notes / limitations (free tier)
- **Cold starts:** free services sleep after ~15 min idle; the first request then takes ~30–50s to wake. Fine for demos.
- **File uploads (PDFs):** the free API has an ephemeral disk, so uploaded files are lost on restart/redeploy. For permanent uploads, move to object storage (S3 / Cloudflare R2 / Supabase Storage) — ask me to wire this when needed.
- **Database:** the free Postgres has a storage cap and expires after 90 days on the free plan; upgrade or recreate as needed. The schema is recreated automatically on deploy via `prisma db push`.

## Local development after this change
The Prisma schema now targets PostgreSQL. To run locally you have two options:
- Use the deployed Postgres `DATABASE_URL` in `server/.env`, or
- Temporarily set `provider = "sqlite"` in `server/prisma/schema.prisma` and `DATABASE_URL="file:./dev.db"`, then `npx prisma db push`.
