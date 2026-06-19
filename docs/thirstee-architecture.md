# Thirstee — Architecture

**App:** Thirstee — social drinking-session planner (web + mobile)
**Repo:** `khan-rafin-ahmed/Thirstee` (Turborepo monorepo)
**Web source:** [apps/web/src/](../apps/web/src/)
**Mobile source:** [apps/mobile/src/](../apps/mobile/src/)
**Backend:** [supabase/](../supabase/) (migrations + Edge Functions)
**Feature index:** [thirstee-features.md](thirstee-features.md) · **DB schema:** [thirstee-db-schema.md](thirstee-db-schema.md)

A 30,000-foot view of how Thirstee is wired so a new contributor can picture the whole system quickly. For *what* each feature does, see the [feature index](thirstee-features.md).

---

## 1. Mental model in one sentence

> **Thirstee is a Supabase-backed app: the web (Vite/React) and mobile (Expo/React Native) clients talk directly to Postgres through `@supabase/supabase-js` and a set of `SECURITY DEFINER` RPC functions, with Row Level Security as the authorization layer. Two Edge Functions handle the things a client shouldn't: creating an event with side-effects (`create-event`) and sending transactional email via SendGrid (`send-email`).**

There is **no traditional API server** in the hot path. The `backend/` folder exists but the production data path is **client → Supabase (RLS + RPC) → Edge Functions**.

---

## 2. High-level component map

```
        ┌─────────────────────────┐         ┌──────────────────────────┐
        │   Web app (apps/web)    │         │  Mobile app (apps/mobile)│
        │  React 19 + Vite        │         │  Expo 53 / RN 0.79       │
        │  react-router-dom 7     │         │  React Navigation 6      │
        │  Tailwind + shadcn/ui   │         │  NativeWind              │
        └────────────┬────────────┘         └────────────┬─────────────┘
                     │  TanStack Query + supabase-js       │
                     │  (auth token in localStorage)       │ (auth token in SecureStore)
                     └───────────────┬─────────────────────┘
                                     │  HTTPS (anon key + user JWT)
                                     ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                          SUPABASE                                 │
        │                                                                   │
        │  GoTrue Auth ── magic link · Google OAuth (PKCE)                  │
        │                                                                   │
        │  Postgres ── tables + RLS policies                                │
        │     events · rsvps · event_members · event_invitations           │
        │     crews · crew_members · crew_invitations                       │
        │     user_profiles · user_follows · notifications                  │
        │     event_photos · event_comments · event_ratings                │
        │     badges · user_badges · user_badge_progress · email_logs      │
        │                                                                   │
        │  RPC (SECURITY DEFINER funcs) ── get_user_events,                 │
        │     process_event_invitation_token, send_*_notification,          │
        │     award/check badges, create_invitation_token, …               │
        │                                                                   │
        │  Storage ── avatars · event-photos · covers                       │
        │                                                                   │
        │  Edge Functions (Deno)                                            │
        │     • create-event  → insert event + default cover + RSVP host   │
        │     • send-email    → SendGrid (event/crew invites, reminders)   │
        └─────────────────────────────────────────────────────────────────┘
                                     ▲
                                     │ external services
                 Mapbox GL · Google Places · SendGrid (noreply@thirstee.app)
```

---

## 3. Monorepo layout

Turborepo + npm workspaces ([package.json](../package.json), [turbo.json](../turbo.json)). Workspaces: `apps/*` and `packages/*`.

```
Thirstee/
├── apps/
│   ├── web/                 ← React 19 + Vite SPA (Vercel)
│   └── mobile/              ← Expo / React Native (EAS)
├── packages/
│   ├── shared/              ← @thirstee/shared — services, types, hooks shared by web + mobile
│   │   └── src/lib/         ← authService, eventService, crewService, userService, supabase, …
│   └── config/              ← @thirstee/config — base Tailwind + TypeScript configs
├── supabase/
│   ├── migrations/          ← 100+ ordered SQL migrations (schema, RLS, RPC, seeds)
│   └── functions/           ← Edge Functions: create-event, send-email
├── backend/                 ← standalone Node/TS service (not on the production hot path)
├── shared/types.ts          ← legacy top-level types (superseded by apps/web/src/types.ts)
└── scripts/                 ← changelog + tooling
```

Common Turbo tasks (run from repo root):

| Command | Effect |
|---|---|
| `npm run dev` | `turbo dev` — all apps |
| `npm run web:dev` / `npm run mobile:dev` | filter to one app |
| `npm run build` / `npm run web:build` | production builds |
| `npm run type-check` / `npm run lint` | across the workspace |

> ⚠️ The web app keeps its **own copy** of most services in [apps/web/src/lib/](../apps/web/src/lib/) (e.g. [eventService.ts](../apps/web/src/lib/eventService.ts), [crewService.ts](../apps/web/src/lib/crewService.ts)). [packages/shared/src/lib/](../packages/shared/src/lib/) holds the **shared** subset used by mobile. They overlap — when you change behavior, check whether both need the edit. This duplication is a known consequence of the monorepo migration ([MONOREPO_MIGRATION_SUMMARY.md](../MONOREPO_MIGRATION_SUMMARY.md)).

---

## 4. The Supabase client

Both clients construct a singleton Supabase client. The web client uses PKCE flow and a named storage key:

[apps/web/src/lib/supabase.ts:21-38](../apps/web/src/lib/supabase.ts#L21-L38)

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'thirstee-auth-token',
  },
  realtime: { params: { eventsPerSecond: 10 } },
})
```

Mobile uses the same library but persists the session via `expo-secure-store` and authenticates Google through `expo-auth-session` / `expo-web-browser`.

Environment is auto-detected (local vs production) via [envUtils.ts](../apps/web/src/lib/envUtils.ts); credentials come from `VITE_*` (web) / `EXPO_PUBLIC_*` (mobile) env vars. See the [development guide](thirstee-development-guide.md#environment-variables).

---

## 5. Request lifecycle (typical read)

1. A React component mounts and calls a service in `lib/` (e.g. `getUserEvents()`), usually wrapped in a **TanStack Query** hook for caching/refetch.
2. The service calls either:
   - a **table query** — `supabase.from('events').select(...)` — authorized by **RLS policies**, or
   - an **RPC** — `supabase.rpc('get_user_events', { ... })` — for queries that need joins/aggregations or to bypass RLS recursion (see §7).
3. Supabase validates the user JWT, applies RLS, returns rows.
4. The service maps rows to the TS types in [apps/web/src/types.ts](../apps/web/src/types.ts) and the component renders.

Caching helpers ([cacheService.ts](../apps/web/src/lib/cacheService.ts), [cache.ts](../apps/web/src/lib/cache.ts)) and [performanceOptimizer.ts](../apps/web/src/lib/performanceOptimizer.ts) reduce redundant fetches — see [NAVIGATION_OPTIMIZATION_SUMMARY.md](../NAVIGATION_OPTIMIZATION_SUMMARY.md).

## 6. Write lifecycle (event creation example)

Event creation does **not** just `insert` — it has side effects (default cover image, host auto-RSVP, slug). That logic lives in the `create-event` Edge Function so it runs server-side with the service role:

[supabase/functions/create-event/index.ts:4-20](../supabase/functions/create-event/index.ts#L4-L20)

```ts
const VIBE_COVER_IMAGES: Record<string, string> = {
  casual: '/assets/covers/Casual Hang.webp',
  party:  '/assets/covers/Party Mode.webp',
  shots:  '/assets/covers/Shots Night.webp',
  // …
}
function getDefaultCoverImage(vibe?: string): string {
  if (!vibe || !(vibe in VIBE_COVER_IMAGES)) return VIBE_COVER_IMAGES.other
  return VIBE_COVER_IMAGES[vibe]
}
```

Invitations and notifications are likewise driven by **RPC functions** (e.g. `process_event_invitation_token`, the `send_*_notification` family) so that a single call performs the insert *and* the notification/email fan-out atomically. This is why so many migrations are `fix_*` files iterating on those functions.

## 7. Authorization model — RLS + SECURITY DEFINER RPC

- Every table has **Row Level Security** enabled. Baseline policies: events are world-readable, but writable only by `created_by`; users manage only their own RSVPs/profiles. See [20240325_initial_schema.sql](../supabase/migrations/20240325_initial_schema.sql).
- Membership tables (crews, event_members) caused **RLS infinite-recursion** (a policy on `crew_members` querying `crew_members`). The fix was to move membership checks into `SECURITY DEFINER` functions that bypass RLS safely — see [fix_crew_rls_infinite_recursion.sql](../fix_crew_rls_infinite_recursion.sql) and [CREW_RLS_FIX_README.md](../CREW_RLS_FIX_README.md).
- **Takeaway for contributors:** prefer the existing RPC for membership / notification / invitation writes rather than direct table inserts, or you'll re-introduce the recursion and "someone" notification bugs.

## 8. Auth flow

- **Magic link** and **Google OAuth**, both via Supabase GoTrue with **PKCE**.
- Web redirects land on `/auth/callback` ([AuthCallback.tsx](../apps/web/src/pages/AuthCallback.tsx)); environment-aware redirect URLs handle localhost vs production ([LOCALHOST_AUTH_CONFIGURATION.md](../LOCALHOST_AUTH_CONFIGURATION.md)).
- A Postgres trigger creates a `user_profiles` row on signup; Google signups required hardening to avoid "Database error saving new user" ([fix_user_profile_trigger.sql](../fix_user_profile_trigger.sql), [GOOGLE_SIGNUP_DATABASE_ERROR_FIX.md](../GOOGLE_SIGNUP_DATABASE_ERROR_FIX.md)).
- Session state is provided app-wide by [auth-context.tsx](../apps/web/src/lib/auth-context.tsx); routes that require login are wrapped in [ProtectedRoute.tsx](../apps/web/src/components/ProtectedRoute.tsx).

## 9. Web routing

Routes are declared in [apps/web/src/App.tsx](../apps/web/src/App.tsx). Key user-facing routes:

| Path | Page | Notes |
|---|---|---|
| `/` | [HomePage](../apps/web/src/pages/HomePage.tsx) / Dashboard | Authed users see their dashboard |
| `/login`, `/auth/callback` | [LoginPage](../apps/web/src/pages/LoginPage.tsx), [AuthCallback](../apps/web/src/pages/AuthCallback.tsx) | Magic link + Google |
| `/events`, `/discover` | [Events](../apps/web/src/pages/Events.tsx), [Discover](../apps/web/src/pages/Discover.tsx) | Your sessions vs public feed |
| `/event/:slug`, `/private-event/:slug` | [EventDetail](../apps/web/src/pages/EventDetail.tsx) | Public vs private slug |
| `/profile/:username`, `/profile/:username/badges` | [UserProfile](../apps/web/src/pages/UserProfile.tsx), [BadgeDashboard](../apps/web/src/pages/BadgeDashboard.tsx) | |
| `/crew/:crewId`, `/crew/join/:inviteCode` | [CrewDetail](../apps/web/src/pages/CrewDetail.tsx), [CrewJoin](../apps/web/src/pages/CrewJoin.tsx) | |
| `/invitation/:token`, `/invitation/:type/:action/:token` | [InvitationAction](../apps/web/src/pages/InvitationAction.tsx) | Token-based accept/decline |

There are also numerous `/test-*` and `/debug/*` routes — internal QA pages, not part of the product surface.

> The `/event/:eventId` route is rewritten server-side for social crawlers in [apps/web/vercel.json](../apps/web/vercel.json) so link previews get proper Open Graph meta tags ([metaTagService.ts](../apps/web/src/lib/metaTagService.ts)).

## 10. Mobile structure

Expo app with React Navigation. Screens in [apps/mobile/src/screens/](../apps/mobile/src/screens/) mirror the web pages (Home, Discover, EventDetail, CreateEvent, CreateCrew, CrewDetail, CrewJoin, Profile, Notifications, InvitationAction, Login). The navigator is [AppNavigator.tsx](../apps/mobile/src/navigation/AppNavigator.tsx). Builds and OTA updates go through **EAS** with `development` / `staging` / `production` profiles ([apps/mobile/eas.json](../apps/mobile/eas.json)). See [THIRSTEE_MOBILE_ARCHITECTURE.md](../THIRSTEE_MOBILE_ARCHITECTURE.md).

## 11. Notifications & email

- **In-app notifications** are rows in the `notifications` table, surfaced by [NotificationBell.tsx](../apps/web/src/components/NotificationBell.tsx) via [notificationService.ts](../apps/web/src/lib/notificationService.ts).
- **Email** (event invitations, crew invitations, reminders) is sent by the `send-email` Edge Function through **SendGrid** from `noreply@thirstee.app`, logged to the `email_logs` table:

  [supabase/functions/send-email/index.ts:638-642](../supabase/functions/send-email/index.ts#L638-L642)

  ```ts
  const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL') || 'https://api.sendgrid.com/v3/mail/send'
  const emailApiKey   = Deno.env.get('SENDGRID_API_KEY')
  const fromAddress   = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@thirstee.app'
  const fromName      = Deno.env.get('EMAIL_FROM_NAME')    || 'Thirstee'
  ```

- The in-app and email channels are kept consistent by the notification-sync migrations ([20250111_email_notification_sync.sql](../supabase/migrations/20250111_email_notification_sync.sql), [EMAIL_NOTIFICATION_SYNC_IMPLEMENTATION.md](../EMAIL_NOTIFICATION_SYNC_IMPLEMENTATION.md)). Eliminating generic "Someone …" notifications (missing actor names) was a long bug saga — see the many `*_someone_notifications_*` migrations.

## 12. Where to look first

| You want to change… | Start at |
|---|---|
| An event field or the create flow | [eventService.ts](../apps/web/src/lib/eventService.ts) + `create-event` function + [thirstee-db-schema.md](thirstee-db-schema.md) |
| Crew membership / roles | [crewService.ts](../apps/web/src/lib/crewService.ts) + crew RLS functions |
| Invitations (email or token) | [eventInvitationService.ts](../apps/web/src/lib/eventInvitationService.ts), [invitationTokenService.ts](../apps/web/src/lib/invitationTokenService.ts), `send-email` |
| Notifications | [notificationService.ts](../apps/web/src/lib/notificationService.ts) + `send_*_notification` RPC |
| Badges | [badgeService.ts](../apps/web/src/lib/badgeService.ts) + [Thirstee_Badge_System_Architecture.md](../Thirstee_Badge_System_Architecture.md) |
| UI / theming | [thirstee-design-system.md](thirstee-design-system.md) |
