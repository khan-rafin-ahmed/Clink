# Thirstee — Development & Deployment Guide

> From "I just cloned the repo" to running web + mobile locally against Supabase, and shipping to Vercel (web) and EAS/Expo (mobile).

**Repo root:** monorepo with Turborepo + npm workspaces ([package.json](../package.json), [turbo.json](../turbo.json)).
**Architecture:** [thirstee-architecture.md](thirstee-architecture.md) · **DB:** [thirstee-db-schema.md](thirstee-db-schema.md)

---

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | ≥ 18 (CI/EAS use 20.17) | Engines field in [package.json](../package.json); EAS base profile pins 20.17 |
| **npm** | 10.x | `packageManager: npm@10.0.0` |
| **Docker Desktop** | latest | Required for local Supabase |
| **Supabase CLI** | latest | Local DB, migrations, edge functions |
| **Expo / EAS CLI** | EAS ≥ 16 | Mobile dev + builds (`eas-cli` is a mobile devDep) |
| **Watchman** (macOS) | latest | RN file watching (recommended) |

External service accounts you'll eventually need keys for: **Supabase**, **Mapbox**, **Google Maps/Places**, **Google OAuth**, **SendGrid**.

---

## 2. First-time setup

```bash
git clone https://github.com/khan-rafin-ahmed/Thirstee.git
cd Thirstee

# Install all workspace deps from the root (web, mobile, packages)
npm install
```

There is also a convenience script that bootstraps local Supabase + env files (note: it predates the monorepo and references the old `frontend/` layout — read before running):

```bash
./setup-local-dev.sh      # checks tools, starts Supabase, writes .env.local
./setup-supabase.sh       # Supabase-only bootstrap
```

---

## 3. Project layout

```
Thirstee/
├── apps/
│   ├── web/                ← Vite SPA. Dev server on :3000
│   │   ├── src/{pages,components,lib,hooks,types}
│   │   └── vercel.json     ← SPA rewrites + crawler OG rewrite + security headers
│   └── mobile/             ← Expo app
│       ├── src/{screens,navigation,components,hooks,lib}
│       ├── app.json · eas.json
├── packages/
│   ├── shared/             ← @thirstee/shared (services/types/hooks for both clients)
│   └── config/             ← @thirstee/config (Tailwind base + TS base)
├── supabase/
│   ├── migrations/         ← ordered SQL (apply in filename order)
│   └── functions/          ← create-event, send-email (Deno)
├── backend/                ← standalone Node service (not on prod hot path)
└── scripts/update-changelog.js
```

---

## 4. Environment variables

Copy the examples and fill in real values. **Never commit `.env.local`.**

**Web** — [apps/web/.env.example](../apps/web/.env.example) → `apps/web/.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:54321        # or your hosted project URL
VITE_SUPABASE_ANON_KEY=<from `supabase status`>
VITE_MAPBOX_ACCESS_TOKEN=<mapbox token>
VITE_MAPBOX_STYLE_URL=mapbox://styles/<...>
VITE_GOOGLE_MAPS_API_KEY=<google maps/places key>
VITE_ENVIRONMENT=local                          # local | production (auto-detected by envUtils.ts)
```

**Mobile** — [apps/mobile/.env.example](../apps/mobile/.env.example) → `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_MAPBOX_TOKEN=<mapbox token>
EXPO_PUBLIC_ENVIRONMENT=development
```

> For EAS builds, secrets are provided via `eas secret:create` (not `.env` files) and referenced in [apps/mobile/eas.json](../apps/mobile/eas.json). Only the **anon** key belongs in client env — the **service role** key is server-only (Edge Function secrets).

---

## 5. Run local Supabase

```bash
# from repo root, Docker running
supabase start                      # boots Postgres, Auth, Studio, Storage
supabase status                     # prints local URLs + anon/service keys

# apply schema — migrations live in supabase/migrations (apply in filename order)
supabase db reset                   # drops + re-applies all migrations + seeds
```

Local URLs: API `http://localhost:54321`, Studio `http://localhost:54323`. Put the printed anon key into `apps/web/.env.local`.

**Edge Functions** locally:

```bash
supabase functions serve create-event
supabase functions serve send-email   # needs SENDGRID_API_KEY etc. as function secrets
```

Google OAuth on localhost needs the redirect URI `http://localhost:3000/auth/callback` registered in Google Cloud Console **and** the provider enabled in Supabase Studio → Auth. See [LOCALHOST_AUTH_CONFIGURATION.md](../LOCALHOST_AUTH_CONFIGURATION.md) and [MAGIC_LINK_LOCALHOST_FIX.md](../MAGIC_LINK_LOCALHOST_FIX.md).

---

## 6. Run the apps

From the **repo root** (Turbo orchestrates workspaces):

```bash
npm run dev            # everything
npm run web:dev        # web only  → http://localhost:3000
npm run mobile:dev     # mobile only → Expo dev server
```

Per-app:

```bash
# web
cd apps/web && npm run dev          # Vite :3000  (npm run dev:local for --mode local)

# mobile
cd apps/mobile && npm run start     # then press i (iOS), a (Android), or scan QR
```

Quality gates (root): `npm run lint`, `npm run type-check`, `npm run build`.

---

## 7. Database changes (migrations)

1. Create a new file in [supabase/migrations/](../supabase/migrations/) using the date-prefixed convention (`YYYYMMDD_short_description.sql`).
2. Write idempotent SQL where possible (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) — this repo's history shows many repair migrations; defensive SQL avoids breaking `db reset`.
3. Prefer extending an existing `SECURITY DEFINER` RPC for membership/invitation/notification writes (see [architecture §7](thirstee-architecture.md#7-authorization-model--rls--security-definer-rpc)).
4. Test with `supabase db reset` locally, then push: `supabase db push` (or apply via the dashboard).
5. **Update [thirstee-db-schema.md](thirstee-db-schema.md)** in the same change.

> ⚠️ The repo also has many ad-hoc `*.sql` files at the **root** (e.g. `fix_*.sql`, `debug_*.sql`). Those are historical one-off scripts / investigations, not part of the migration pipeline. Don't assume they've been applied — the canonical pipeline is `supabase/migrations/`.

---

## 8. Deploy — Web (Vercel)

- The web app is a Vite SPA deployed on **Vercel**. Routing/headers are configured in [apps/web/vercel.json](../apps/web/vercel.json):
  - SPA fallback rewrite to `/index.html` for all non-asset routes.
  - A crawler-targeted rewrite of `/event/:eventId` → `/api/event/:eventId` (matched by `facebookexternalhit`, `Twitterbot`, `Slackbot`, `Googlebot`, …) so shared links get server-rendered Open Graph tags.
  - Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`.
- Set the `VITE_*` env vars in the Vercel project settings (Production + Preview).
- See [deploy_frontend_single_source.md](../deploy_frontend_single_source.md).

## 9. Deploy — Mobile (EAS / Expo)

Profiles are defined in [apps/mobile/eas.json](../apps/mobile/eas.json): `development` (internal, APK/dev client), `staging` (internal release), `production` (store builds).

```bash
# from repo root
npm run mobile:build:dev        # eas build --profile development
npm run mobile:build:staging
npm run mobile:build:prod
npm run mobile:submit           # eas submit (App Store / Play)
npm run mobile:update:prod      # OTA update via expo-updates (production branch)
npm run mobile:update:staging
```

Env per profile is injected by EAS (`EXPO_PUBLIC_*`); store secrets with `eas secret:create`. See [apps/mobile/DEPLOYMENT_READY.md](../apps/mobile/DEPLOYMENT_READY.md) and [EXPO_SDK_UPDATE_SUMMARY.md](../EXPO_SDK_UPDATE_SUMMARY.md).

## 10. Edge Functions deploy

```bash
supabase functions deploy create-event
supabase functions deploy send-email

# function secrets (server-only)
supabase secrets set SENDGRID_API_KEY=... EMAIL_FROM_ADDRESS=noreply@thirstee.app EMAIL_FROM_NAME=Thirstee
```

---

## 11. Changelog

Entries follow [Keep a Changelog](https://keepachangelog.com/) via [scripts/update-changelog.js](../scripts/update-changelog.js):

```bash
cd apps/web
npm run changelog            # interactive add
npm run changelog:validate
npm run changelog:template
```

Update the `[Unreleased]` section of [CHANGELOG.md](../CHANGELOG.md) with your change.

---

## 12. Troubleshooting pointers

| Symptom | Look at |
|---|---|
| Google sign-in → "Database error saving new user" | [GOOGLE_SIGNUP_DATABASE_ERROR_FIX.md](../GOOGLE_SIGNUP_DATABASE_ERROR_FIX.md), [fix_user_profile_trigger.sql](../fix_user_profile_trigger.sql) |
| OAuth redirects to wrong host | [LOCALHOST_AUTH_CONFIGURATION.md](../LOCALHOST_AUTH_CONFIGURATION.md), [CRITICAL_GOOGLE_OAUTH_DEBUG.md](../CRITICAL_GOOGLE_OAUTH_DEBUG.md) |
| Crew query hangs / RLS recursion | [CREW_RLS_FIX_README.md](../CREW_RLS_FIX_README.md) |
| Wrong / missing attendee count | [ATTENDEE_COUNT_FIX_SUMMARY.md](../ATTENDEE_COUNT_FIX_SUMMARY.md) |
| "Someone" notifications (no actor name) | the `*_someone_notifications_*` migrations, [thirstee-notification-system-architecture.md](../thirstee-notification-system-architecture.md) |
| Invite emails not sending | [send-email/index.ts](../supabase/functions/send-email/index.ts), `email_logs` table, [EMAIL_INVITATION_FIX_SUMMARY.md](../EMAIL_INVITATION_FIX_SUMMARY.md) |
| Event edit page broken | [TROUBLESHOOTING-EVENT-EDIT.md](../TROUBLESHOOTING-EVENT-EDIT.md) |
