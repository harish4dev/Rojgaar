# Rojgaar Web

Standalone marketing site and web portals for **Rojgaar** — independent from the mobile app (`frontend/`) and API server (`backend/`).

## What's included

- **Landing page** — download-the-app CTAs, feature overview
- **Business & Partner login** — phone OTP auth (top-right on landing → `/portal`)
- **Business dashboard** — stats, jobs list, post new jobs
- **Partner dashboard** — stats, candidates list, add new people

## Setup

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Set `VITE_BACKEND_URL` in `.env` to your FastAPI server (default `http://localhost:8000`).

## Demo accounts

| Role     | Phone       | OTP (any 4 digits) |
|----------|-------------|--------------------|
| Business | 9999999999  | 1234               |
| Partner  | 8888888888  | 1234               |

## Scripts

| Command         | Description        |
|-----------------|--------------------|
| `npm run dev`   | Dev server :5173   |
| `npm run build` | Production build   |
| `npm run preview` | Preview build    |

## Routes

| Path                    | Page                          |
|-------------------------|-------------------------------|
| `/`                     | Landing page                  |
| `/privacy`              | Privacy Policy (Play Store)   |
| `/portal`               | Business / Partner picker     |
| `/business/login`       | Business OTP login / signup   |
| `/business/dashboard`   | Business dashboard            |
| `/partner/login`        | Partner OTP login / signup    |
| `/partner/dashboard`    | Partner dashboard             |
