# 🩺 SaveLife — Emergency SOS

A full-stack emergency SOS / ambulance web app.

- **Frontend:** React + Vite (`/frontend`)
- **Backend:** Node.js + Express REST API (`/backend`)
- **Database:** PostgreSQL

## Features

- **Accounts** with two roles: **user** (needs help) and **responder** (ambulance / first responder).
- **One-tap SOS** — users pick an emergency type (medical, accident, fire, crime, other),
  the browser captures their GPS location, and an alert is broadcast to responders.
- **Responder dashboard** — sees active emergencies with the requester's name, phone,
  blood type and a map link; can **Respond** and **Resolve**. Auto-refreshes every 10s.
- **Emergency contacts** — users store people to notify.
- **Profile** — phone number and blood type.
- **JWT auth**, with role-based access control on responder-only routes.

---

## Local development

### Prerequisites (already installed during setup)

- Node.js v20+ and npm
- PostgreSQL v17

Verify: `node -v`, `npm -v`, `psql --version`.

### 1. Database

```bash
# default user is "postgres"; use the password set during installation
psql -U postgres -c "CREATE DATABASE savelife;"
```

> On Windows, `psql` lives at `C:\Program Files\PostgreSQL\17\bin`.

### 2. Backend

```bash
cd backend
cp .env.example .env     # then set your DB password + a JWT secret
npm install
npm run dev              # http://localhost:4000  (tables auto-create on boot)
```

`npm run db:migrate` runs the schema manually, but the server also applies it
automatically on startup (it's idempotent).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Run both at once. Vite proxies `/api/*` to the backend. Open
http://localhost:5173, register one **user** and one **responder** (in two
browsers / an incognito window) to see the full flow.

> 📍 Geolocation needs `localhost` or HTTPS to work in the browser — both are fine here.

---

## API reference

| Method | Path                       | Access     | Description                  |
| ------ | -------------------------- | ---------- | ---------------------------- |
| GET    | `/api/health`              | —          | Health check                 |
| POST   | `/api/auth/register`       | —          | Create account (user/responder) |
| POST   | `/api/auth/login`          | —          | Log in, returns JWT          |
| GET    | `/api/auth/me`             | auth       | Current user                 |
| PUT    | `/api/auth/profile`        | auth       | Update phone / blood type    |
| GET    | `/api/contacts`            | auth       | List emergency contacts      |
| POST   | `/api/contacts`            | auth       | Add a contact                |
| DELETE | `/api/contacts/:id`        | auth       | Delete a contact             |
| POST   | `/api/alerts`              | auth       | Raise an SOS                 |
| GET    | `/api/alerts/mine`         | auth       | Your alerts                  |
| GET    | `/api/alerts/active`       | responder  | Open emergencies             |
| PATCH  | `/api/alerts/:id/respond`  | responder  | Accept an alert              |
| PATCH  | `/api/alerts/:id/resolve`  | owner/resp | Mark resolved                |
| PATCH  | `/api/alerts/:id/cancel`   | owner      | Cancel own alert             |

Authenticated requests send `Authorization: Bearer <token>`.

---

## Deploy to Render

The repo includes [`render.yaml`](render.yaml), a Blueprint that provisions a
web service **and** a managed PostgreSQL database in one go.

1. **Push to GitHub** (Render deploys from a Git repo):
   ```bash
   git init
   git add .
   git commit -m "SaveLife emergency SOS app"
   git branch -M main
   git remote add origin https://github.com/<you>/savelife.git
   git push -u origin main
   ```
2. In Render: **New → Blueprint**, connect the repo. Render reads `render.yaml`
   and sets up:
   - **savelife-db** — PostgreSQL (free plan)
   - **savelife** — the web service, with `DATABASE_URL` wired to the DB,
     `JWT_SECRET` auto-generated, `PGSSL=true`, and `NODE_ENV=production`.
3. Click **Apply**. First deploy installs both apps, builds the frontend, and
   starts the API — which serves the built frontend and auto-creates the tables.
4. Open the service URL. Done. 🚀

> The build command and start command are defined in `render.yaml`, so there's
> nothing to configure by hand. To deploy elsewhere, replicate those two
> commands and the environment variables.

---

## Project structure

```
SaveLife/
├── render.yaml               # Render Blueprint (web service + database)
├── backend/
│   └── src/
│       ├── index.js          # Express app; serves frontend in production
│       ├── db/
│       │   ├── pool.js        # PG pool (SSL-aware)
│       │   ├── schema.sql     # users · emergency_contacts · alerts
│       │   ├── initDb.js      # applies schema (runs on boot)
│       │   └── migrate.js     # manual migration script
│       ├── middleware/auth.js # JWT + role guards
│       └── routes/            # auth · contacts · alerts
└── frontend/
    └── src/
        ├── App.jsx            # SOS UI + responder dashboard
        └── api.js             # API client + geolocation helper
```

---

## Ideas for next steps

- Real notifications to emergency contacts (Twilio SMS / email).
- Live map of active alerts (Leaflet / Google Maps).
- WebSockets for instant responder updates instead of polling.
- Distance-based alert filtering for responders.
