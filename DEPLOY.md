# Deploying FLAME for free — NO credit card

Stack:
- **Database:** Neon (free Postgres, no card)
- **API:** Render Web Service (free)
- **Web client:** Render Static Site (free)

The repo is already on GitHub: `github.com/mina2508/flame-platform`.

---

## Part 1 — Create a free Postgres on Neon (no card)

1. Go to **https://neon.tech** → **Sign up** (choose "Continue with GitHub").
2. Click **Create project** (or "New Project").
   - Name: `flame`  ·  Region: pick the closest.
3. After it's created, open **Dashboard → Connect** (or "Connection string").
4. Copy the **connection string**. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/flame?sslmode=require
   ```
   - If Neon shows a "Pooled connection" toggle, copy the **direct** (unpooled) string for setup. (Pooled also works for the app, but schema push is safest on the direct one.)
   Keep this string — it's your `DATABASE_URL`.

---

## Part 2 — Deploy the API on Render (free, no card)

1. Go to **https://render.com** → sign in with GitHub (verify your email if asked).
2. **New → Web Service** → connect the **`flame-platform`** repo.
   - If asked to add a card here, you don't need to for a **Web Service free plan** — just continue; the card prompt is for Blueprints/Render-DB, which we're skipping.
3. Configure:
   - **Name:** `flame-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type / Plan:** **Free**
4. **Environment Variables** (Advanced → Add):
   - `DATABASE_URL` = the Neon string from Part 1
   - `JWT_SECRET` = any long random text (e.g. `flame-7Hq2Zx9Pr4Lm8Kd`)
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `*`  (we tighten this at the end)
5. **Create Web Service.** The build runs `prisma db push` + seed automatically.
   - When done, copy the API URL, e.g. `https://flame-api.onrender.com`.
   - Test it: open `https://flame-api.onrender.com/api/health` → should show `{"status":"ok"}`.

---

## Part 3 — Deploy the web client on Render (free)

1. **New → Static Site** → same **`flame-platform`** repo.
2. Configure:
   - **Name:** `flame-web`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. **Environment Variables:**
   - `VITE_API_BASE_URL` = your API URL from Part 2 (e.g. `https://flame-api.onrender.com`)
4. **Create Static Site.** Copy its URL, e.g. `https://flame-web.onrender.com`.

---

## Part 4 — Connect them

1. Open **flame-api → Environment** → set
   `CORS_ORIGIN` = your web URL (e.g. `https://flame-web.onrender.com`) → **Save** (redeploys).
2. If you changed `VITE_API_BASE_URL` after the first web build, open
   **flame-web → Manual Deploy → Clear build cache & deploy** (so the value is baked in).

Open the web URL — the site + admin are live.
Login: `admin@flame.org` / `Flame@Admin2026` (change for real use).

---

## Part 5 — Point the mobile app at the live API

In `flame-mobile/src/config.js`:
```js
export const API_BASE_URL = 'https://flame-api.onrender.com/api';
```
Now the phone works from anywhere (no shared Wi-Fi needed).

---

## Notes (free tier)
- **Cold start:** free API sleeps after ~15 min idle; first request wakes it in ~30–50s.
- **File uploads (PDFs)** don't persist on the free API disk (lost on redeploy). Data in Postgres persists. Ask to wire object storage (Cloudflare R2 / Supabase Storage, free) for permanent uploads.
- **Local dev:** the Prisma schema targets Postgres now. Put the Neon URL in `server/.env` as `DATABASE_URL` to run locally against the same DB, or temporarily switch the provider to `sqlite` with `DATABASE_URL="file:./dev.db"`.
