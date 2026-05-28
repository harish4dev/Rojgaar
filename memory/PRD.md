# Rojgaar - Product Requirements

## Vision
Connect blue-collar workers (Mason, Helper, Electrician, Plumber, Welder, Carpenter, Driver, Security, etc.) with small/medium businesses. Partners (placement agents) help onboard workers and earn placement fees.

## Three Surfaces (single Expo app)
1. **Worker Mobile App** - multi-language, phone+OTP onboarding, job browsing, applications.
2. **Business Web Portal** (`/business`) - dashboard with stats, recent jobs table, Post Job form.
3. **Partner Web Portal** (`/partner`) - dashboard with stats, candidates table, Add Person form.

## Implemented Features (MVP)

### Worker app
- Splash screen → role chooser
- 10-step onboarding: Language → Phone → 4-digit OTP → City → Industry (multi) → Skills (multi) → Experience + Salary → Work Type → Ready
- Multi-language: English, Hindi, Kannada (Tamil/Telugu/Marathi shown as "Coming Soon")
- Bottom tabs: Home, Jobs, Activity, Profile
- Home: greeting, city, search, category chips (Nearby/Daily/Full Time/Construction), recommended jobs list
- Jobs tab: Industry grid filter + jobs list
- Job Detail: hero image, title/company/rating, salary, meta cards, description, requirements, Save + Call to Apply (creates application)
- Activity: Applied / Viewed / Saved tabs with status badges
- Saved jobs page
- Filter page: Job Type / Industry / Experience / Salary bucket filters
- Profile: avatar header, profile strength meter, details, language indicator, logout

### Business Portal (web route)
- Dark sidebar nav (Dashboard, Jobs, Applications, Workers, Partners, Analytics, Messages, Settings)
- Stats cards: Active Jobs, Applications, Hired, Profile Views
- Recent Jobs table with status
- Post New Job form with industry picker, salary range, location, description

### Partner Portal (web route)
- Dark sidebar nav (Dashboard, People, My Network, Job Matches, Earnings, Reports, Messages, Settings)
- Stats cards: People Added, Job Matches, Placed, Total Earnings
- Recently Added People table with status pills
- Add New Person form (Skill picker icons, Experience chips, Location)

## Mocked Integrations
- **OTP**: any 4-digit code accepted (no Twilio).

## Tech
- Frontend: Expo Router + React Native, system fonts, Ionicons
- Backend: FastAPI + Motor (MongoDB), prefix `/api`
- Seeded data: 11 jobs (incl. one "Test Job - Carpenter"), demo business + partner with 4 candidates
