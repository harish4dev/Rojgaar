# Rojgaar — MVP Roadmap & Production Audit

This document audits the current codebase and defines a phased plan to reach a **production-ready MVP**: real users can sign up, find jobs, apply, businesses can post and hire, and partners can onboard workers — with acceptable security, reliability, and deployability.

**Audit date:** May 2026  
**Branch audited:** `version0`  
**Surfaces:** `backend/`, `web/`, `frontend/`

---

## Executive summary

| Area | Current state | MVP-ready? |
|------|---------------|------------|
| Worker mobile app | Most complete surface; onboarding, jobs, apply, save, profile | **Partial** — needs real OTP, error UX, filter wiring |
| Web business portal | OTP login + profile setup, post jobs, review applications | **Partial** — no API auth, stub nav sections |
| Web partner portal | OTP login, add candidates with employee OTP verification | **Partial** — same auth gaps, stub nav |
| Backend API | Full CRUD flows, seed data, mock OTP | **No** — open endpoints, no JWT, no indexes |
| DevOps / deploy | Manual local setup only | **No** — no Docker, CI, env templates |
| Tests | Integration tests against remote/preview API | **Partial** — no local CI, no security tests |

**Bottom line:** The product demonstrates end-to-end flows well for demos and development. It is **not safe or reliable enough for public production** until auth, authorization, database constraints, and deployment tooling are in place.

---

## What works today (keep & polish)

These flows are implemented and should be preserved while hardening:

### Worker (`frontend/`)
- Splash → language → phone → OTP → onboarding (personal, city, industry, skills, experience, work type)
- Home, Jobs, Activity, Profile tabs
- Job detail, apply (Call to Apply), save/unsave
- Profile edit with gender, age, skills, salary, work type
- i18n for English, Hindi, Kannada (partial)
- Job translations from backend where seeded

### Business web (`web/`)
- Phone → OTP → profile setup (new users) → dashboard
- Stats, job list, post job form
- Applications grouped by job; accept/reject actions

### Partner web (`web/`)
- Phone → OTP → profile setup → dashboard
- Add employee: name, phone, gender, age, collar type, skill, experience, location
- Employee OTP verification → candidate + worker profile created
- Candidate table with status

### Backend (`backend/`)
- Modular FastAPI routers under `/api`
- Workers, jobs, applications, saved jobs, businesses, partners, meta
- Startup seed: 11+ jobs, demo business (`9999999999`), demo partner (`8888888888`)
- Partner pending registration with 15-minute TTL
- Profile strength calculation for workers
- Idempotent job apply (application-level, not DB-enforced)

---

## Detailed audit

### 1. Security & authentication

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Mock OTP | **Critical** | `backend/routers/auth.py`, `backend/routers/partners.py` | Any 4-digit code accepted; no SMS, no stored OTP |
| No JWT / sessions | **Critical** | All routers | `pyjwt`, `bcrypt` in requirements but unused |
| No Authorization headers | **Critical** | `web/src/api/client.ts`, `frontend/src/api/client.ts` | Clients send no tokens; backend trusts IDs in URLs/bodies |
| IDOR on all resources | **Critical** | `workers.py`, `businesses.py`, `applications.py`, `jobs.py` | Anyone can PATCH any worker, accept any application, post jobs as any business |
| CORS `*` + credentials | **High** | `backend/server.py` | Unsafe for production |
| Client-only session | **High** | `web/src/store/auth.ts`, `frontend/src/store/session.ts` | localStorage / AsyncStorage; tamperable |
| Demo auto-login (mobile B2B) | **Medium** | `frontend/app/business.tsx`, `frontend/app/partner.tsx` | Hardcoded phones `9999999999`, `8888888888` |
| Phone validation inconsistent | **Medium** | `backend/schemas.py` | Partner candidate validates 10-digit phone; auth OTP does not |

**MVP requirement:** Real SMS OTP (or provider like Twilio/MSG91), JWT issued on verify, middleware on protected routes, ownership checks (business can only manage own jobs/applications).

---

### 2. Database & data integrity

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| No MongoDB indexes | **Critical** | `backend/database.py` | No unique indexes on `phone`, application pairs, etc. |
| No migrations | **High** | — | Schema changes are ad hoc; only translation backfill in seed |
| Race on duplicate apply | **High** | `backend/routers/applications.py` | find-then-insert without unique compound index |
| Seed runs every startup | **High** | `backend/server.py`, `backend/seed/__init__.py` | Demo data recreated; not suitable for prod DB |
| Hardcoded `profile_views: 360` | **Low** | `backend/routers/businesses.py` | Fake analytics |
| N+1 queries | **Medium** | `backend/routers/businesses.py` | Per-job `applications_count` in loop |

**Recommended indexes for MVP:**

```
workers.phone          (unique)
businesses.phone       (unique)
partners.phone         (unique)
applications           (worker_id, job_id) unique
saved_jobs             (worker_id, job_id) unique
partner_candidates     (partner_id, employee_number) unique
jobs                   posted_by_business_id, active + city
```

**MVP requirement:** Index creation script on startup or migration step; `SEED_ON_STARTUP=false` in production.

---

### 3. Backend API gaps

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Shallow health check | **Medium** | `backend/routers/health.py` | Returns `{status: ok}` without Mongo ping |
| No rate limiting | **High** | OTP endpoints | Brute-force and SMS abuse risk |
| Job filters ignored | **Low** | `backend/routers/jobs.py` | `skill`, `experience` query params accepted but not used |
| Soft delete always succeeds | **Low** | `backend/routers/jobs.py` | DELETE returns success even if job missing |
| Regex search unescaped | **Medium** | `backend/services/jobs.py` | User search input in `$regex` |
| Bloated requirements | **Low** | `backend/requirements.txt` | Unused: pandas, numpy, boto3, jq, emergentintegrations |

---

### 4. Web app (`web/`)

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Stub sidebar nav | **Medium** | `business/Dashboard.tsx`, `partner/Dashboard.tsx` | Workers, Analytics, Messages, Settings, Earnings, etc. change highlight only — no content |
| Silent load failures | **Medium** | Dashboard pages | `refresh().catch(console.warn)` — user sees `—` with no error |
| Session not reactive | **Low** | Dashboard `useMemo(() => getSession())` | Won't update if session changes in another tab |
| No `.env.example` | **Medium** | `web/` | README references it; file missing |
| Store links are `#` | **Medium** | `web/src/pages/Landing.tsx` | Play Store / App Store non-functional |
| English only | **Low** | All web pages | No i18n |
| Hardcoded meta lists | **Low** | Dashboard forms | Industries/skills not from `/meta/*` |
| No deploy config | **High** | — | No Dockerfile, Vercel/Netlify config, CI |

**Working web flows:** Landing, portal gateway, business/partner OTP auth, profile onboarding, core dashboard actions.

---

### 5. Mobile app (`frontend/`)

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Business/partner are demo stubs | **High** | `app/business.tsx`, `app/partner.tsx` | Auto-login; not production portals |
| Filter screen doesn't persist | **Medium** | `app/filter.tsx` | Applies locally, navigates back without updating Jobs/Home |
| Activity "Viewed" tab empty | **Medium** | `app/(tabs)/activity.tsx` | No view tracking API |
| Jobs City/Skills tabs stub | **Low** | `app/(tabs)/jobs.tsx` | "Coming soon" |
| Help / Settings no-op | **Low** | `app/(tabs)/profile.tsx` | Menu rows without handlers |
| Hardcoded call number after apply | **Medium** | `frontend/src/utils/jobActions.ts` | `tel:+919876543210` |
| Home/Jobs errors silent | **Medium** | `home.tsx`, `jobs.tsx` | `console.warn` only |
| Incomplete hi/kn translations | **Medium** | `frontend/src/i18n/translations.ts` | ~15 keys fall back to English |
| Generic Expo app config | **Medium** | `frontend/app.json` | slug `frontend`, no EAS, no store IDs |
| No `.env.example` | **Medium** | — | `EXPO_PUBLIC_BACKEND_URL` undocumented in repo |
| Minimal accessibility | **Low** | App-wide | Few `accessibilityLabel` / roles |

**Working mobile flows:** Full worker journey from onboarding through apply/save/profile.

---

### 6. Testing & quality

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Tests hit remote API by default | **High** | `backend/tests/test_rojgaar_api.py` | Default URL is preview host, not local |
| No in-process FastAPI tests | **Medium** | — | No `TestClient` / `httpx.AsyncClient` fixtures |
| No security tests | **High** | — | No IDOR, auth, rate-limit coverage |
| No frontend tests | **Medium** | — | testIDs exist but no E2E suite |
| No CI pipeline | **High** | — | No GitHub Actions |

**Existing coverage:** ~47+ backend integration tests (auth, jobs, workers, applications, business, partner, meta, gender/age, translations).

---

### 7. DevOps & production ops

| Missing | Priority |
|---------|----------|
| `Dockerfile` + `docker-compose.yml` (API + Mongo) | P0 |
| `.env.example` for backend, web, frontend | P0 |
| GitHub Actions: lint, test, build | P0 |
| Production uvicorn config (workers, no `--reload`) | P1 |
| Structured logging + request IDs | P1 |
| Readiness probe with Mongo ping | P1 |
| Error tracking (Sentry) | P2 |
| CDN/static hosting for `web/` build | P1 |
| EAS Build for Expo (Android APK/AAB) | P1 |

---

## MVP definition (launch criteria)

An MVP is **ready for a limited production pilot** (one city, real users, monitored) when:

### Must have (P0)
- [ ] Real OTP via SMS provider (India: MSG91, Twilio, etc.)
- [ ] JWT auth; protected API routes; resource ownership enforced
- [ ] MongoDB indexes + unique constraints on phones and applications
- [ ] CORS restricted to known web/app origins
- [ ] `SEED_ON_STARTUP=false` in production; seed only for dev/staging
- [ ] Health check includes database connectivity
- [ ] `.env.example` files + documented secrets
- [ ] Docker Compose for local + staging parity
- [ ] CI: backend tests against local Mongo; web build; lint
- [ ] Web: hide or implement stub nav items; user-visible error states
- [ ] Mobile: remove demo auto-login from business/partner screens (link to web or add real auth)
- [ ] HTTPS everywhere (TLS at load balancer)

### Should have (P1)
- [ ] Rate limiting on OTP send/verify
- [ ] Pagination on job/candidate lists
- [ ] Filter state persisted (mobile filter → jobs list)
- [ ] Complete Hindi/Kannada strings for worker app
- [ ] Real App Store / Play Store links or remove from landing
- [ ] Deploy web to Vercel/Netlify/CloudFront
- [ ] Deploy API to Railway/Render/Fly.io/AWS
- [ ] MongoDB Atlas with backups
- [ ] Basic monitoring (uptime + error alerts)

### Nice to have (P2)
- [ ] Activity "Viewed" tracking
- [ ] Real profile_views analytics
- [ ] Web i18n (Hindi at minimum)
- [ ] E2E tests (Playwright / Detox)
- [ ] Partner earnings payout tracking (currently `placed * 2000` formula only)

---

## Phased roadmap

### Phase 0 — Foundation (Week 1–2)
**Goal:** Safe local/staging environment; stop shipping demo assumptions.

| # | Task | Owner | Files / notes |
|---|------|-------|---------------|
| 0.1 | Add `.env.example` for backend, web, frontend | DevOps | Document `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, SMS keys |
| 0.2 | Add `docker-compose.yml` (Mongo + API) | DevOps | Optional web container |
| 0.3 | Add `SEED_ON_STARTUP` env flag | Backend | `server.py`, `seed/__init__.py` |
| 0.4 | Create Mongo index script | Backend | New `backend/db_indexes.py`, call on startup |
| 0.5 | Trim `requirements.txt` to used deps | Backend | Remove pandas, numpy, unused auth libs until needed |
| 0.6 | GitHub Actions: pytest + web build | DevOps | `.github/workflows/ci.yml` |
| 0.7 | Add `.env.example` commit; update README | Docs | Link to this roadmap |

**Exit criteria:** `docker compose up` runs API + Mongo; CI passes on PR.

---

### Phase 1 — Auth & security (Week 2–4)
**Goal:** Only authenticated users can mutate data; clients send tokens.

| # | Task | Owner | Files / notes |
|---|------|-------|---------------|
| 1.1 | Integrate SMS OTP provider | Backend | Store hashed OTP + expiry in `otp_sessions` collection |
| 1.2 | Rate limit OTP (e.g. 5/min per phone) | Backend | slowapi or custom middleware |
| 1.3 | Issue JWT on `verify-otp` | Backend | `auth.py`; claims: `sub`, `role`, `phone` |
| 1.4 | Auth dependency `get_current_user` | Backend | New `services/auth.py` |
| 1.5 | Protect mutating routes | Backend | PATCH workers (own), POST jobs (business), PATCH applications (own business), partner routes |
| 1.6 | Lock CORS to env origins | Backend | `server.py` |
| 1.7 | Web: store JWT; send `Authorization` header | Web | `api/client.ts`, `store/auth.ts` |
| 1.8 | Mobile: store JWT securely | Mobile | SecureStore for token; `api/client.ts` |
| 1.9 | Remove mock OTP UI copy | Web + Mobile | OtpForm, otp.tsx |
| 1.10 | Security tests (401/403 on protected routes) | Backend | `tests/test_auth.py` |

**Exit criteria:** Unauthenticated POST `/jobs` returns 401; user A cannot PATCH user B's worker profile.

---

### Phase 2 — Core product hardening (Week 4–6)
**Goal:** Reliable flows for the three personas; no silent failures.

| # | Task | Owner | Files / notes |
|---|------|-------|---------------|
| 2.1 | Web dashboard loading + error UI | Web | Spinners, retry, toast on fetch fail |
| 2.2 | Hide or stub-label incomplete nav items | Web | Business/partner sidebars |
| 2.3 | Mobile: user-visible errors on Home/Jobs | Mobile | Replace `console.warn` with banner/alert |
| 2.4 | Wire filter screen to Jobs/Home query params | Mobile | `filter.tsx`, `(tabs)/jobs.tsx` |
| 2.5 | Fix job list `skill`/`experience` filters OR remove params | Backend | `routers/jobs.py`, `services/jobs.py` |
| 2.6 | Mobile business/partner: link to web portal OR remove routes | Mobile | Deep link to `web/portal` |
| 2.7 | Replace hardcoded apply call number | Mobile | Use job/business contact from API or remove |
| 2.8 | Complete hi/kn translation keys | Mobile | `i18n/translations.ts` |
| 2.9 | Readiness endpoint `/api/health/ready` | Backend | Mongo ping |
| 2.10 | Global exception handler + structured logs | Backend | `server.py` |

**Exit criteria:** Pilot user can complete worker apply and business hire flow without dev tools; errors are visible in UI.

---

### Phase 3 — Deploy & pilot (Week 6–8)
**Goal:** Staging + production environments; limited real-user pilot.

| # | Task | Owner | Files / notes |
|---|------|-------|---------------|
| 3.1 | Deploy API to staging (Railway/Render/Fly) | DevOps | Env vars, Mongo Atlas |
| 3.2 | Deploy web static site | DevOps | Vercel/Netlify; `VITE_BACKEND_URL` |
| 3.3 | MongoDB Atlas production cluster | DevOps | Backups, IP allowlist |
| 3.4 | EAS Build: Android internal testing track | Mobile | `eas.json`, update `app.json` branding |
| 3.5 | Landing page: real store URLs or waitlist form | Web | `Landing.tsx` |
| 3.6 | SMS provider production credentials | DevOps | MSG91/Twilio India route |
| 3.7 | Sentry (or similar) on API + web | DevOps | Error tracking |
| 3.8 | Runbook: deploy, rollback, seed staging | Docs | Add to README |
| 3.9 | Pilot in one city (e.g. Bengaluru) | Product | 50 workers, 5 businesses, 2 partners |

**Exit criteria:** Staging URL shared with team; 10 real OTP signups without manual DB edits.

---

### Phase 4 — Post-MVP growth (Week 8+)
**Goal:** Features that improve retention and partner economics but aren't launch blockers.

| # | Task | Notes |
|---|------|-------|
| 4.1 | Partner earnings dashboard (real ledger) | Beyond `placed * 2000` |
| 4.2 | Push notifications (new job matches) | FCM + Expo notifications |
| 4.3 | In-app messaging business ↔ worker | Messages nav stub |
| 4.4 | Job view analytics | Replace hardcoded profile_views |
| 4.5 | Admin panel | Moderate jobs, users |
| 4.6 | Tamil/Telugu/Marathi i18n | Already marked coming soon |
| 4.7 | Web worker lightweight portal | Optional PWA for workers without app install |

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Open API abused before auth ship | Data corruption, spam jobs | Do Phase 1 before any public URL |
| SMS cost abuse | Bill shock | Rate limits + captcha on OTP send |
| Mongo duplicate applications | Bad UX, bad analytics | Unique index in Phase 0 |
| Demo seed overwrites prod data | Outage | `SEED_ON_STARTUP=false` mandatory |
| Mobile store rejection | Delayed launch | Fix branding, privacy policy, real OTP before submission |
| Partner OTP confusion | Support load | Clear UX copy; SMS goes to employee, partner enters code |

---

## Environment matrix

| Variable | Backend | Web | Mobile | Production |
|----------|---------|-----|--------|------------|
| `MONGO_URL` | Required | — | — | Atlas URI |
| `DB_NAME` | Required | — | — | `rojgaar_prod` |
| `JWT_SECRET` | Required (Phase 1) | — | — | Strong random secret |
| `CORS_ORIGINS` | Required (Phase 1) | — | — | `https://rojgaar.in,...` |
| `SEED_ON_STARTUP` | Optional | — | — | `false` |
| `SMS_API_KEY` | Phase 1 | — | — | Provider key |
| `VITE_BACKEND_URL` | — | Required prod | — | `https://api.rojgaar.in` |
| `EXPO_PUBLIC_BACKEND_URL` | — | — | Required | Same API URL |

---

## Suggested team split

| Track | Focus |
|-------|--------|
| **Backend** | Auth, indexes, rate limits, health, deploy |
| **Web** | Portal polish, error UX, deploy, landing store links |
| **Mobile** | Worker stability, i18n, filters, EAS build, remove B2B demo |
| **DevOps** | Docker, CI, staging/prod, Mongo Atlas, monitoring |
| **Product/QA** | Pilot criteria, test scripts, partner onboarding playbook |

---

## Quick reference: file ownership map

```
backend/
  server.py              → CORS, lifespan, global middleware
  routers/auth.py        → OTP + JWT (Phase 1)
  routers/businesses.py  → Business stats, applications
  routers/partners.py    → Partner candidates + OTP
  services/partner_candidates.py → Employee registration flow
  seed/__init__.py       → Demo data (disable in prod)

web/
  src/components/OtpForm.tsx     → Business/partner login
  src/pages/business/Dashboard.tsx → Business MVP surface
  src/pages/partner/Dashboard.tsx  → Partner MVP surface
  src/pages/Landing.tsx          → Marketing + store links

frontend/
  app/onboarding/*       → Worker signup funnel
  app/(tabs)/*           → Worker main app
  app/business.tsx       → Demo only — replace in Phase 2
  app/partner.tsx        → Demo only — replace in Phase 2
  src/i18n/translations.ts → Localization
```

---

## Related docs

- [README.md](./README.md) — setup and API reference
- [web/README.md](./web/README.md) — web portal routes and demo logins
- [memory/PRD.md](./memory/PRD.md) — original product notes (may lag behind code)

---

*This roadmap should be updated at the end of each phase. Mark checklist items in the MVP definition section as they ship.*
