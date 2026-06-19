# Thirstee — Documentation

**Thirstee** is a social app for planning and RSVPing to drinking sessions ("events") — create a session, invite your crew, see who's in, rate the night, and earn badges. It ships as a **web app** and a **React Native mobile app** sharing one **Supabase** backend.

> Originally prototyped under the name **"Clink"** (the root [README.md](../README.md) is the stale pre-monorepo version — prefer the docs in this folder).

This folder is the single source of truth for *how the app is built*. Start here, then jump to the doc that matches your task.

---

## Map of the docs

| Doc | Read it when you want to… |
|---|---|
| [thirstee-architecture.md](thirstee-architecture.md) | Picture the whole system in 5 minutes — monorepo layout, web ↔ mobile ↔ Supabase, request lifecycle, auth flow. |
| [thirstee-db-schema.md](thirstee-db-schema.md) | Know the Postgres tables, columns, enums, RLS model, and the RPC functions that back the app. |
| [thirstee-features.md](thirstee-features.md) | Find which files implement a feature. Master index of every capability with code pointers. |
| [thirstee-development-guide.md](thirstee-development-guide.md) | Get it running locally, build web/mobile, run Supabase, and deploy (Vercel + EAS). |
| [thirstee-design-system.md](thirstee-design-system.md) | Add or change UI — the glassmorphism dark theme, color tokens, Tailwind config, component library. |
| [_template.md](_template.md) | Write a new per-feature deep-dive under `features/`. |

---

## The app in one sentence

> A user signs in (magic link or Google OAuth) → creates an **event** with a place, time, vibe and cover image → invites people **individually, by crew, or by email** → invitees **RSVP** → everyone sees a live attendee list, photos, comments and ratings → actions award **badges** and fire **in-app + email notifications**. Everything is stored in **Supabase Postgres** behind **Row Level Security**, with **Edge Functions** for event creation and transactional email.

## Tech stack at a glance

| Layer | Web (`apps/web`) | Mobile (`apps/mobile`) |
|---|---|---|
| Framework | React 19 + Vite | Expo 53 / React Native 0.79 |
| Routing | react-router-dom 7 | React Navigation 6 |
| Styling | Tailwind + shadcn/ui (glass theme) | NativeWind 4 |
| Data | TanStack Query + `@supabase/supabase-js` | TanStack Query + `@supabase/supabase-js` |
| Auth storage | `localStorage` (PKCE) | `expo-secure-store` |
| Maps | Mapbox GL + Google Places | Mapbox |
| Hosting | Vercel (SPA) | EAS Build / Expo Updates |

**Backend (shared):** Supabase — Postgres + RLS, GoTrue auth, Storage (avatars, event photos), Edge Functions (`create-event`, `send-email` via SendGrid), 100+ SQL migrations under [supabase/migrations/](../supabase/migrations/).

**Monorepo:** Turborepo + npm workspaces. Shared code lives in [packages/shared](../packages/shared) (auth/event/crew/user services, types, hooks) and [packages/config](../packages/config) (Tailwind + TS base configs).

---

## Conventions for these docs

- **Cite real code.** Link with the `[path:start-end](../path#Lstart-Lend)` pattern so links are clickable and verifiable; don't paraphrase code.
- **Per-feature deep-dives** live at `docs/features/<slug>.md` and follow [_template.md](_template.md). The [feature index](thirstee-features.md) lists every feature with its primary files; deep-dives are filled in over time.
- **Keep docs in sync with code.** A feature change should update the relevant doc in the same commit.
