# Rojgaar Worker App — Production Build

## Ship checklist (invite workers to register)

1. **Deploy the API** (the old `rojgaar-connect.preview.emergentagent.com` URL is down)
   - Use `backend/Dockerfile` + `backend/render.yaml` on [Render](https://render.com), or any host that runs Docker
   - Set env: `MONGO_URL`, `DB_NAME`, `JWT_SECRET` (long random string), Twilio vars, `OTP_DEV_MODE=false`
   - Confirm: `GET https://YOUR-API/api/` → `{"status":"ok"}`

2. **Point the app at your API**
   - `frontend/eas.json` → `production.env.EXPO_PUBLIC_BACKEND_URL` and `preview.env.EXPO_PUBLIC_BACKEND_URL`
   - For local device testing: `frontend/.env` → `http://YOUR_LAN_IP:8000` (not `0.0.0.0`)

3. **Build a shareable APK**
   ```bash
   cd frontend
   eas login
   eas init   # once — sets EAS_PROJECT_ID in app.config.ts / Expo dashboard
   eas build --platform android --profile preview
   ```
   Share the APK link from the EAS dashboard. Workers install → language → phone → **real SMS OTP** → name/age → optional profile → home.

4. **Businesses post real jobs** via `web/` business portal (`npm run dev` or deploy `web/dist`).

## Prerequisites

1. Node.js 18+ and Yarn
2. Copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_BACKEND_URL` to your production API (HTTPS, no trailing slash)
3. For store builds: [Expo EAS](https://docs.expo.dev/build/setup/) account (`npm i -g eas-cli`, then `eas login` and `eas init` in `frontend/`)

## Local development

```bash
cd frontend
cp .env.example .env
# Edit .env → EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
yarn install
yarn start
```

## Web production bundle

```bash
cd frontend
yarn build:web
```

Output: `frontend/dist/` — host on any static CDN.

## Android (APK preview / Play Store AAB)

```bash
cd frontend
eas build --platform android --profile preview      # internal APK
eas build --platform android --profile production # Play Store AAB
```

Update `EXPO_PUBLIC_BACKEND_URL` in `eas.json` `production.env` before release builds.

## iOS

```bash
cd frontend
eas build --platform ios --profile production
```

Requires Apple Developer account and credentials in EAS.

## Worker features included

- Onboarding: language, phone OTP, profile (city, industry, skills, experience, work type)
- Home: recommended jobs + all jobs, search, filter screen (persisted), quick actions
- Job detail: apply, call employer (`contact_phone` from business), save
- Activity: applied, viewed (local history), saved
- Profile: edit, language, help, settings, logout
