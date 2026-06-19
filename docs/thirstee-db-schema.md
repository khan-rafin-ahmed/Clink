# Thirstee — Database Schema

**Backend:** Supabase Postgres
**Migration source:** [supabase/migrations/](../supabase/migrations/) (100+ ordered `.sql` files)
**Canonical TS shapes:** [apps/web/src/types.ts](../apps/web/src/types.ts) and [apps/web/src/types/badge.ts](../apps/web/src/types/badge.ts)
**Architecture overview:** [thirstee-architecture.md](thirstee-architecture.md)

> ⚠️ **Read this first.** The schema evolved across **100+ migrations**, many of them `fix_*` / `*_v2` iterations that `ALTER` earlier tables. The *initial* migration ([20240325_initial_schema.sql](../supabase/migrations/20240325_initial_schema.sql)) is **not** the current shape. The most reliable description of the **current** schema is the TypeScript interface set in [apps/web/src/types.ts](../apps/web/src/types.ts), which is what this document is reconciled against. Treat column lists here as authoritative-by-type; treat the migration files as the authoritative *DDL* and the place to confirm exact SQL types, defaults, and RLS.
>
> Some tables (`crews`, `crew_members`) are referenced heavily by migrations and RPC but their original `CREATE TABLE` was applied outside the tracked migration set (Supabase dashboard / an early consolidated script). Their columns below come from the TS types and the functions that read them.

---

## Table of contents

| # | Table | Purpose |
|---|---|---|
| 1 | `user_profiles` | Per-user profile (username, avatar, drink, privacy) |
| 2 | `events` | Drinking sessions |
| 3 | `rsvps` | Going / maybe / not_going responses |
| 4 | `event_members` | Invited/added attendees with role + status |
| 5 | `event_invitations` | Pending invites + accept/decline tokens |
| 6 | `crews` | Named friend groups |
| 7 | `crew_members` | Crew membership + role |
| 8 | `crew_invitations` | Pending crew invites |
| 9 | `user_follows` / `follows` | Social follow graph |
| 10 | `notifications` | In-app notification feed |
| 11 | `event_photos` | Event gallery uploads |
| 12 | `event_comments` + `event_comment_reactions` | Event discussion + emoji reactions |
| 13 | `event_ratings` | Post-event 1–5 ratings + feedback |
| 14 | `badges`, `user_badges`, `user_badge_progress` | Gamification |
| 15 | `email_logs`, `email_preferences` | Email delivery audit + per-user prefs |

### Enums

```sql
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');   -- 20240325_initial_schema.sql
```

App-level (TS) enums not necessarily backed by Postgres enums:

- `MemberStatus` = `'pending' | 'accepted' | 'declined'` (event_members, crew_members)
- event/crew member `role` = `'attendee' | 'co_host' | 'host'` (events) · `'member' | 'co_host' | 'host'` (crews)
- crew `vibe` = `'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'`
- crew/event `visibility` / `is_public`, profile `profile_visibility` = `'public' | 'crew_only' | 'private'`
- event `duration_type` = `'specific_time' | 'all_night'`

---

## 1. `user_profiles`

One row per auth user, created by a signup trigger ([fix_user_profile_trigger.sql](../fix_user_profile_trigger.sql)). Username added in [20250625_add_username_to_profiles.sql](../supabase/migrations/20250625_add_username_to_profiles.sql); privacy in [20240527_add_privacy_and_follows.sql](../supabase/migrations/20240527_add_privacy_and_follows.sql); favorite drink & place nickname in the `20241201_*` migrations.

| Column | Type (TS) | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | → `auth.users.id` |
| `username` | text | unique handle, used in `/profile/:username` |
| `display_name` | text? | |
| `nickname` | text? | shown in invites/notifications |
| `bio`, `tagline` | text? | |
| `avatar_url` | text? | Supabase Storage (Google avatars copied in via [googleAvatarService.ts](../apps/web/src/lib/googleAvatarService.ts)) |
| `favorite_drink` | text? | |
| `join_date` | timestamptz? | |
| `profile_visibility` | `'public' \| 'crew_only' \| 'private'` | |
| `show_crews_publicly` | boolean | |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:4-19](../apps/web/src/types.ts#L4-L19).

## 2. `events`

The central table. Original columns in [20240325_initial_schema.sql](../supabase/migrations/20240325_initial_schema.sql); heavily extended (place/lat/long, vibe, drink_type, slugs, cover image, duration, event_code) by later migrations ([fix_event_schema_modern.sql](../supabase/migrations/fix_event_schema_modern.sql), [20241201_add_event_code.sql](../supabase/migrations/20241201_add_event_code.sql), [20250622_add_event_duration_support.sql](../supabase/migrations/20250622_add_event_duration_support.sql), [add_slug_generation.sql](../supabase/migrations/add_slug_generation.sql)).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `date_time` | timestamptz | start |
| `end_time` | timestamptz? | when `duration_type='specific_time'` |
| `duration_type` | `'specific_time' \| 'all_night'` | |
| `location` | text | human-readable |
| `place_nickname`, `place_name`, `place_id` | text? | Google Places metadata |
| `latitude`, `longitude` | numeric? | for the map |
| `notes` | text? | |
| `drink_type`, `vibe` | text? | vibe drives the default cover image |
| `cover_image_url` | text? | uploaded or vibe default |
| `is_public` | boolean | public vs private |
| `public_slug`, `private_slug` | text? | drive `/event/:slug` & `/private-event/:slug` |
| `event_code` | text? | short share/join code |
| `created_by` | uuid | → `auth.users.id` |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:39-77](../apps/web/src/types.ts#L39-L77). **Baseline RLS:** select = everyone; insert/update/delete = `auth.uid() = created_by`. Edit permissions extended to co-hosts in [20250712_add_event_edit_permissions.sql](../supabase/migrations/20250712_add_event_edit_permissions.sql) ([eventPermissions.ts](../apps/web/src/lib/eventPermissions.ts), [eventRoleService.ts](../apps/web/src/lib/eventRoleService.ts)).

## 3. `rsvps`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid | → `events.id` ON DELETE CASCADE |
| `user_id` | uuid | → `auth.users.id` |
| `status` | `rsvp_status` | default `'maybe'` |
| `created_at`, `updated_at` | timestamptz | |
| | | `UNIQUE(event_id, user_id)` |

DDL: [20240325_initial_schema.sql](../supabase/migrations/20240325_initial_schema.sql). FK repaired in [fix_rsvps_foreign_key.sql](../supabase/migrations/fix_rsvps_foreign_key.sql). **Attendee counts** combine RSVPs + accepted `event_members`; consistency was a recurring bug — see [fix_attendee_count_consistency.sql](../supabase/migrations/fix_attendee_count_consistency.sql) and [ATTENDEE_COUNT_FIX_SUMMARY.md](../ATTENDEE_COUNT_FIX_SUMMARY.md).

## 4. `event_members`

Attendees added/invited directly (distinct from a self-serve RSVP), carrying a **role** and **status**.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid | → `events.id` |
| `user_id` | uuid | the member |
| `invited_by` | uuid | inviter |
| `status` | `'pending' \| 'accepted' \| 'declined'` | |
| `role` | `'attendee' \| 'co_host' \| 'host'` | co-hosts can edit the event |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:29-38](../apps/web/src/types.ts#L29-L38).

## 5. `event_invitations`

Pending invitations with accept/decline **tokens** that power tokenized email links and the `/invitation/:token` route. Schema stabilized across the `20250111_*` / `20250121_*` / `20250628_*` / `20250714_*` migrations (e.g. [20250628_create_invitation_token_functions.sql](../supabase/migrations/20250628_create_invitation_token_functions.sql), [20250714_fix_individual_user_invitations.sql](../supabase/migrations/20250714_fix_individual_user_invitations.sql)). Driven server-side by `process_event_invitation_token` and friends ([invitationTokenService.ts](../apps/web/src/lib/invitationTokenService.ts), [eventInvitationService.ts](../apps/web/src/lib/eventInvitationService.ts)). Typical columns: `id`, `event_id`, `inviter_id`, `invitee_id`/`invitee_email`, `status`, `invitation_token` / `accept_token` / `decline_token`, `expires_at`, timestamps.

## 6. `crews`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `vibe` | `'casual' \| 'party' \| 'chill' \| 'wild' \| 'classy' \| 'other'` | |
| `visibility` | `'public' \| 'private'` | |
| `description` | text? | |
| `created_by` | uuid | |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:152-167](../apps/web/src/types.ts#L152-L167). Computed fields (`member_count`, `is_member`, `user_role`, `can_manage`) come from RPC, not columns.

## 7. `crew_members`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `crew_id` | uuid | → `crews.id` |
| `user_id` | uuid | |
| `status` | `'pending' \| 'accepted' \| 'declined'` | |
| `role` | `'member' \| 'co_host' \| 'host'` | |
| `invited_by` | uuid? | |
| `joined_at`, `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:169-191](../apps/web/src/types.ts#L169-L191). **RLS warning:** policies on this table must not self-query — see the infinite-recursion fix in [fix_crew_rls_infinite_recursion.sql](../fix_crew_rls_infinite_recursion.sql) / [fix_crew_rls_policies.sql](../fix_crew_rls_policies.sql). Promotion (member → co-host/host) fires a notification via `fix_crew_promotion_*` functions.

## 8. `crew_invitations`

DDL: [create_crew_invitations_table.sql](../supabase/migrations/create_crew_invitations_table.sql). Enhanced invite + email flow in [20250622_enhanced_crew_invitation_system.sql](../supabase/migrations/20250622_enhanced_crew_invitation_system.sql) and [20250622_crew_invitation_emails.sql](../supabase/migrations/20250622_crew_invitation_emails.sql). Also supports a shareable `inviteCode` link (`/crew/join/:inviteCode`).

## 9. `user_follows` / `follows`

Social follow graph (follower → following).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `follower_id` | uuid | |
| `following_id` | uuid | |
| `created_at` | timestamptz | |

Shape: [types.ts:21-27](../apps/web/src/types.ts#L21-L27). DDL across [20240527_add_privacy_and_follows.sql](../supabase/migrations/20240527_add_privacy_and_follows.sql) and [follow_system_schema.sql](../supabase/migrations/follow_system_schema.sql) ([followService.ts](../apps/web/src/lib/followService.ts)). Follow-notification cleanup: [20250708_cleanup_follow_notifications.sql](../supabase/migrations/20250708_cleanup_follow_notifications.sql).

## 10. `notifications`

In-app feed. The `type` enum/constraint and `data` JSON structure were repeatedly reworked (see the dense `20250708_*` migration cluster — RLS, constraints, data structure, removing DB-side auto-updates). Typical columns: `id`, `user_id` (recipient), `type`, `title`, `message`, `data` (jsonb — actor id/name, event/crew id), `read`/`is_read`, `created_at`. Read/written by [notificationService.ts](../apps/web/src/lib/notificationService.ts); surfaced in [NotificationBell.tsx](../apps/web/src/components/NotificationBell.tsx). Background: [thirstee-notification-system-architecture.md](../thirstee-notification-system-architecture.md), [NOTIFICATION_SYSTEM_INVESTIGATION_REPORT.md](../NOTIFICATION_SYSTEM_INVESTIGATION_REPORT.md).

## 11. `event_photos`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid | |
| `uploaded_by` | uuid | |
| `photo_url` | text | public URL |
| `storage_path` | text | Supabase Storage path |
| `caption` | text? | |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:195-208](../apps/web/src/types.ts#L195-L208). DDL: [add_event_media_comments.sql](../supabase/migrations/add_event_media_comments.sql) ([eventMediaService.ts](../apps/web/src/lib/eventMediaService.ts), [EventGallery.tsx](../apps/web/src/components/EventGallery.tsx)).

## 12. `event_comments` + `event_comment_reactions`

`event_comments`: `id`, `event_id`, `user_id`, `content`, timestamps ([types.ts:210-223](../apps/web/src/types.ts#L210-L223)).
`event_comment_reactions`: `id`, `comment_id`, `user_id`, `reaction` (one of `🍻 🙌 🤘 🥴 😂 ❤️ 🔥`), `created_at` ([types.ts:225-231](../apps/web/src/types.ts#L225-L231)). DDL: [add_event_media_comments.sql](../supabase/migrations/add_event_media_comments.sql).

## 13. `event_ratings`

Post-event rating, one per user per event.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid | |
| `user_id` | uuid | |
| `rating` | int | 1–5 |
| `feedback_text` | text? | |
| `created_at`, `updated_at` | timestamptz | |

Shape: [types.ts:233-246](../apps/web/src/types.ts#L233-L246). DDL: [add_event_ratings.sql](../supabase/migrations/add_event_ratings.sql) / [20250103_ensure_event_ratings_table.sql](../supabase/migrations/20250103_ensure_event_ratings_table.sql) ([eventRatingService.ts](../apps/web/src/lib/eventRatingService.ts)). Aggregates (`average_rating`, `total_ratings`) are computed and attached to events.

## 14. Badge system — `badges`, `user_badges`, `user_badge_progress`

Created in [20250123_create_badge_system.sql](../supabase/migrations/20250123_create_badge_system.sql), seeded by [20250123_seed_badges.sql](../supabase/migrations/20250123_seed_badges.sql), progress function in [create_badge_progress_function.sql](../supabase/migrations/create_badge_progress_function.sql).

**`badges`** (catalog): `id`, `name`, `description`, `category` (`event_participation | hosting_crew | social_activity | streaks_time | weekly_sinners | drink_devotees`), `tier`, `unlock_criteria` (jsonb), `icon_name`, `color_tier` (`bronze | silver | gold | neon`), `is_hidden`, `is_easter_egg`, `sort_order`, timestamps. — [badge.ts:21-37](../apps/web/src/types/badge.ts#L21-L37)

**`user_badges`** (earned): `id`, `user_id`, `badge_id`, `earned_at`, `progress_data` (jsonb), `is_visible_on_profile`, `display_order`, timestamps. — [badge.ts:39-50](../apps/web/src/types/badge.ts#L39-L50)

**`user_badge_progress`**: `id`, `user_id`, `badge_id`, `current_progress`, `target_progress`, `progress_data`, `last_updated`. — [badge.ts:52-60](../apps/web/src/types/badge.ts#L52-L60) (RLS: [fix_badge_progress_rls.sql](../supabase/migrations/fix_badge_progress_rls.sql))

Badges are awarded/checked by RPC ([award_single_badge_function.sql](../award_single_badge_function.sql)) called from [badgeService.ts](../apps/web/src/lib/badgeService.ts). Deep design: [Thirstee_Badge_System_Architecture.md](../Thirstee_Badge_System_Architecture.md).

## 15. `email_logs` + `email_preferences`

Created in the `20250622_email_notification_system.sql` / `20250111_email_notification_sync.sql` migrations.

- **`email_logs`** — one row per send attempt: recipient, type, status, `message_id`, `error_message`, timestamps. Written by the `send-email` Edge Function ([index.ts:704-722](../supabase/functions/send-email/index.ts#L704-L722)).
- **`email_preferences`** — per-user opt-in/out for invitation/reminder emails ([EmailPreferences.tsx](../apps/web/src/components/EmailPreferences.tsx)).

---

## RPC functions (the real API)

Because RLS + side effects live in the DB, a lot of behavior is in `SECURITY DEFINER` functions rather than table queries. Frequently used:

| Function | Purpose | Source |
|---|---|---|
| `get_user_events` / variants | Events for a user with creator info, bypassing RLS recursion | [fix_user_events_function.sql](../supabase/migrations/fix_user_events_function.sql), [fix_user_events_with_creator_info.sql](../supabase/migrations/fix_user_events_with_creator_info.sql) |
| `create_invitation_token`, `process_event_invitation_token` | Issue & redeem invite tokens | [20250628_create_invitation_token_functions.sql](../supabase/migrations/20250628_create_invitation_token_functions.sql), [20250708_fix_process_event_invitation_token.sql](../supabase/migrations/20250708_fix_process_event_invitation_token.sql) |
| `send_*_notification` family | Insert notification + queue email atomically (with real actor names) | `20250622_*`, `20250708_*` clusters |
| User search functions | Autocomplete invitees | [20250622_add_user_search_functions.sql](../supabase/migrations/20250622_add_user_search_functions.sql) |
| User deletion functions | GDPR-style account + data removal | [20241215_user_deletion_functions.sql](../supabase/migrations/20241215_user_deletion_functions.sql) ([deleteUserService.ts](../apps/web/src/lib/deleteUserService.ts)) |
| Badge award/check/progress | Gamification engine | [20250123_create_badge_system.sql](../supabase/migrations/20250123_create_badge_system.sql), [create_badge_progress_function.sql](../supabase/migrations/create_badge_progress_function.sql) |

> When adding a feature that touches membership, invitations, or notifications, extend the relevant RPC rather than inserting directly from the client — see [thirstee-architecture.md §7](thirstee-architecture.md#7-authorization-model--rls--security-definer-rpc).
