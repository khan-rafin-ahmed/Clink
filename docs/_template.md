# <Feature name>

> One-line summary that fits in a tooltip.

## Summary

What the feature does, in 2-4 sentences. Cover the *what* and the *why* — not the *how* (that comes later). State the user-facing outcome. Note whether it exists on **web only**, **mobile only**, or **both**, and whether the logic is shared via [packages/shared](../../packages/shared).

## User flow

How a user actually reaches and uses the feature. Concrete steps:

1. From **<screen / route>** the user opens **<modal / page>**.
2. They click **<button>** / fill in **<field>**.
3. Save / submit / observe the resulting behavior.

If the feature is invisible to end-users (a token redemption, a cron-like trigger, a notification fan-out), describe the sequence of requests / RPC calls / events instead.

## Data & backend surface

What the feature reads/writes and how authorization works.

**Tables** (see [thirstee-db-schema.md](../thirstee-db-schema.md))
- `events` — columns: `…`
- `notifications` — written via RPC

**RPC / Edge Functions**
- `supabase.rpc('process_event_invitation_token', { … })` — what it does (SECURITY DEFINER? bypasses RLS?)
- Edge Function `create-event` / `send-email` — when invoked

**RLS notes**
- Which policies gate this. If it touches membership tables, confirm it doesn't re-introduce the crew RLS recursion.

If the feature is read-only, say so.

## How it works

Walk the reader through the implementation in numbered steps, **following the request: UI → service → Supabase (table/RPC/Edge Function) → DB → response → UI update**. Each step gets a short prose explanation followed by a real code excerpt.

Rules:

- **Show both sides** for a UI feature: at least one React/TSX excerpt *and* the service/SQL it calls.
- **Cite real lines** with `[path/file.ext:start-end](../../path/file.ext#Lstart-Lend)` so links are clickable and verifiable. Don't paraphrase code; copy it.
- **Keep excerpts tight** (5-25 lines). Trim with `// …`.
- **Pick the right fence:** ` ```tsx ` (React components), ` ```ts ` (services/helpers), ` ```sql ` (migrations/RPC), ` ```ts ` (Edge Functions / Deno).

### Suggested step ordering for a typical UI feature

1. **Component** — where the user clicks/types: JSX, local state, the service call. (`apps/web/src/components/<X>.tsx` or `apps/web/src/pages/<X>.tsx`)
2. **Service** — how the action becomes a Supabase call. (`apps/web/src/lib/<x>Service.ts` and/or `packages/shared/src/lib/<x>Service.ts`)
3. **Supabase** — the table query, `rpc()` call, or Edge Function invocation.
4. **DB** — the RPC body / RLS policy / trigger that runs. (`supabase/migrations/<file>.sql`)
5. **Side-effects** — notification insert, email queued to `send-email`, badge check.
6. **Response** — TanStack Query cache update, toast, list refresh, optimistic UI.

## Files touched

Bullet every file involved, grouped by layer, with one-line notes.

**Frontend (web)**
- [apps/web/src/pages/Foo.tsx](../../apps/web/src/pages/Foo.tsx) — page container
- [apps/web/src/components/Foo.tsx](../../apps/web/src/components/Foo.tsx) — component
- [apps/web/src/lib/fooService.ts](../../apps/web/src/lib/fooService.ts) — Supabase calls

**Shared / mobile**
- [packages/shared/src/lib/fooService.ts](../../packages/shared/src/lib/fooService.ts) — shared logic
- [apps/mobile/src/screens/FooScreen.tsx](../../apps/mobile/src/screens/FooScreen.tsx) — mobile screen

**Backend (Supabase)**
- [supabase/migrations/<file>.sql](../../supabase/migrations/) — table / RPC / RLS
- [supabase/functions/<fn>/index.ts](../../supabase/functions/) — Edge Function (if any)

Drop rows that don't apply.

## Edge cases / known issues

- Behavior under invalid/expired input (e.g. expired invite token).
- RLS gotchas (membership recursion, public vs private events).
- Notification correctness (actor name present, no duplicate/"someone" notifications).
- Optimistic-update rollbacks / stale cache after a failed request.
- Web vs mobile divergence (duplicated service drifted).
- Anything a future maintainer should know before changing this code.

## Related

- Feature index: [thirstee-features.md](../thirstee-features.md)
- Architecture: [thirstee-architecture.md](../thirstee-architecture.md)
- Existing design/PRD docs at repo root (link the relevant `*_ARCHITECTURE.md` / `*_FIX_*.md`).

---

## Author checklist (delete before committing)

- [ ] Summary explains *what* and *why*, and states web/mobile/shared scope.
- [ ] User flow has concrete clicks / requests, not vague descriptions.
- [ ] Data section lists every table, RPC, Edge Function, and the RLS model.
- [ ] **How it works** has at least one component excerpt **and** the service/SQL it calls.
- [ ] Every excerpt has a `[path:start-end](#Lx-Ly)` link and the right fence.
- [ ] **Files touched** covers frontend, shared/mobile, and backend as applicable.
- [ ] Edge cases mention RLS, notification correctness, and web/mobile drift.
- [ ] Linked from [thirstee-features.md](../thirstee-features.md) under the right section.
