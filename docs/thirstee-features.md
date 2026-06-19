# Thirstee — Feature Index

**App:** Thirstee — social drinking-session planner (web + mobile)
**Web source:** [apps/web/src/](../apps/web/src/) · **Mobile source:** [apps/mobile/src/](../apps/mobile/src/)
**Architecture:** [thirstee-architecture.md](thirstee-architecture.md) · **DB:** [thirstee-db-schema.md](thirstee-db-schema.md) · **Design:** [thirstee-design-system.md](thirstee-design-system.md)

The master index of every shipped feature with pointers to the primary code, so you can dive in fast. Per-feature deep-dives live at `docs/features/<slug>.md` (template: [_template.md](_template.md)); `_todo_` marks one not yet written.

> **Service layer note.** The web app's services live in [apps/web/src/lib/](../apps/web/src/lib/); the subset shared with mobile lives in [packages/shared/src/lib/](../packages/shared/src/lib/). When a feature spans both clients, check both. See [architecture §3](thirstee-architecture.md#3-monorepo-layout).
>
> **Filename prefixes inside `docs/features/`:** _(none)_ = user-facing feature · `internal-` = mechanics a contributor needs but a user never sees (RLS functions, token plumbing, caching, env detection).

---

## 1. Authentication & profiles

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Magic-link login | Passwordless email sign-in (PKCE) | [authService.ts](../apps/web/src/lib/authService.ts), [LoginPage.tsx](../apps/web/src/pages/LoginPage.tsx) | _todo_ |
| Google OAuth | Google sign-in, web + mobile | [authService.ts](../apps/web/src/lib/authService.ts), [AuthCallback.tsx](../apps/web/src/pages/AuthCallback.tsx) | _todo_ |
| Auth session/context | App-wide session, refresh, route guards | [auth-context.tsx](../apps/web/src/lib/auth-context.tsx), [ProtectedRoute.tsx](../apps/web/src/components/ProtectedRoute.tsx), [authSecurity.ts](../apps/web/src/lib/authSecurity.ts) | _todo_ |
| Profile create on signup | Trigger seeds `user_profiles`; Google avatar import | [googleAvatarService.ts](../apps/web/src/lib/googleAvatarService.ts), [fix_user_profile_trigger.sql](../fix_user_profile_trigger.sql) | _todo_ |
| Edit profile | Display name, nickname, bio, tagline, favorite drink, avatar | [EditProfile.tsx](../apps/web/src/pages/EditProfile.tsx), [userService.ts](../apps/web/src/lib/userService.ts), [AvatarUpload.tsx](../apps/web/src/components/AvatarUpload.tsx) | _todo_ |
| Username & public profile | `/profile/:username`, hover cards | [UserProfile.tsx](../apps/web/src/pages/UserProfile.tsx), [UserHoverCard.tsx](../apps/web/src/components/UserHoverCard.tsx) | _todo_ |
| Profile privacy | public / crew_only / private | [add_profile_privacy.sql](../supabase/migrations/add_profile_privacy.sql) | _todo_ |
| Delete account | Remove user + owned data | [deleteUserService.ts](../apps/web/src/lib/deleteUserService.ts), [DeleteProfileDialog.tsx](../apps/web/src/components/DeleteProfileDialog.tsx) | _todo_ |

## 2. Events (sessions)

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Create event | Server-side create with default cover, host auto-RSVP, slug | [create-event/index.ts](../supabase/functions/create-event/index.ts), [CreateEventModal.tsx](../apps/web/src/components/CreateEventModal.tsx), [QuickEventModal.tsx](../apps/web/src/components/QuickEventModal.tsx) | _todo_ |
| Edit / delete event | Owner + co-host edit; delete with confirm | [EditEventModal.tsx](../apps/web/src/components/EditEventModal.tsx), [EventForm.tsx](../apps/web/src/components/EventForm.tsx), [DeleteEventDialog.tsx](../apps/web/src/components/DeleteEventDialog.tsx) | _todo_ |
| Event detail | Public/private slug pages, OG meta for crawlers | [EventDetail.tsx](../apps/web/src/pages/EventDetail.tsx), [metaTagService.ts](../apps/web/src/lib/metaTagService.ts), [vercel.json](../apps/web/vercel.json) | _todo_ |
| Vibe & cover image | Vibe drives default cover; custom upload | [coverImageUtils.ts](../apps/web/src/lib/coverImageUtils.ts) | _todo_ |
| Duration | Specific end-time vs "all night" | [20250622_add_event_duration_support.sql](../supabase/migrations/20250622_add_event_duration_support.sql) | _todo_ |
| Location picker | Google Places autocomplete + Mapbox map + static thumb | [GoogleLocationPicker.tsx](../apps/web/src/components/GoogleLocationPicker.tsx), [LocationAutocomplete.tsx](../apps/web/src/components/LocationAutocomplete.tsx), [InteractiveMap.tsx](../apps/web/src/components/InteractiveMap.tsx), [googlePlacesService.ts](../apps/web/src/lib/googlePlacesService.ts) | _todo_ |
| Event lists / dashboard | Upcoming / past, your sessions | [Events.tsx](../apps/web/src/pages/Events.tsx), [Dashboard.tsx](../apps/web/src/pages/Dashboard.tsx), [EventCard.tsx](../apps/web/src/components/EventCard.tsx), [EventTimeline.tsx](../apps/web/src/components/EventTimeline.tsx) | _todo_ |
| Discover | Public session feed | [Discover.tsx](../apps/web/src/pages/Discover.tsx), [FilterModal.tsx](../apps/web/src/components/FilterModal.tsx) | _todo_ |
| Add to calendar | ICS / calendar links | [AddToCalendarButton.tsx](../apps/web/src/components/AddToCalendarButton.tsx) | _todo_ |
| Share event | Share modal + links | [ShareModal.tsx](../apps/web/src/components/ShareModal.tsx) | _todo_ |

All event reads/writes flow through [eventService.ts](../apps/web/src/lib/eventService.ts) / [eventUtils.ts](../apps/web/src/lib/eventUtils.ts) (+ shared [packages/shared/src/lib/eventService.ts](../packages/shared/src/lib/eventService.ts)).

## 3. RSVPs & attendance

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| RSVP (going/maybe/not) | Self-serve response | [RSVPButton.tsx](../apps/web/src/components/RSVPButton.tsx), [JoinEventButton.tsx](../apps/web/src/components/JoinEventButton.tsx) | _todo_ |
| Attendee management | Hosts add/remove/promote attendees | [EventAttendeeManagement.tsx](../apps/web/src/components/EventAttendeeManagement.tsx), [memberService.ts](../apps/web/src/lib/memberService.ts) | _todo_ |
| Roles & permissions | attendee / co_host / host edit rights | [eventPermissions.ts](../apps/web/src/lib/eventPermissions.ts), [eventRoleService.ts](../apps/web/src/lib/eventRoleService.ts), [20250712_add_event_edit_permissions.sql](../supabase/migrations/20250712_add_event_edit_permissions.sql) | _todo_ |
| Attendee count | Combined RSVP + accepted members | [fix_attendee_count_consistency.sql](../supabase/migrations/fix_attendee_count_consistency.sql), [AvatarStack.tsx](../apps/web/src/components/AvatarStack.tsx) | _todo_ |

## 4. Crews

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Create / edit crew | Named group, vibe, visibility | [CreateCrewModal.tsx](../apps/web/src/components/CreateCrewModal.tsx), [EditCrewModal.tsx](../apps/web/src/components/EditCrewModal.tsx), [crewService.ts](../apps/web/src/lib/crewService.ts) | _todo_ |
| Crew detail | Members, roles, sessions timeline | [CrewDetail.tsx](../apps/web/src/pages/CrewDetail.tsx), [CrewCard.tsx](../apps/web/src/components/CrewCard.tsx), [CrewSessionsTimeline.tsx](../apps/web/src/components/CrewSessionsTimeline.tsx) | _todo_ |
| Join by invite code | `/crew/join/:inviteCode` | [CrewJoin.tsx](../apps/web/src/pages/CrewJoin.tsx) | _todo_ |
| Roles & promotion | member / co_host / host, promotion notifications | [fix_crew_promotion_final.sql](../supabase/migrations/fix_crew_promotion_final.sql), [CREW_PROMOTION_NOTIFICATION_FIX.md](../CREW_PROMOTION_NOTIFICATION_FIX.md) | _todo_ |
| Crew RLS | Non-recursive membership policies | [fix_crew_rls_infinite_recursion.sql](../fix_crew_rls_infinite_recursion.sql) | `internal-crew-rls` _todo_ |

## 5. Invitations

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Invite people to event | Individuals, crews, or email | [eventInvitationService.ts](../apps/web/src/lib/eventInvitationService.ts), [EventInvitationCard.tsx](../apps/web/src/components/EventInvitationCard.tsx), [invite-people-architecture.md](../invite-people-architecture.md) | _todo_ |
| Tokenized accept/decline | `/invitation/:token` links from email | [invitationTokenService.ts](../apps/web/src/lib/invitationTokenService.ts), [InvitationAction.tsx](../apps/web/src/pages/InvitationAction.tsx), [20250628_create_invitation_token_functions.sql](../supabase/migrations/20250628_create_invitation_token_functions.sql) | _todo_ |
| Crew invitations | Invite to a crew + email | [create_crew_invitations_table.sql](../supabase/migrations/create_crew_invitations_table.sql), [20250622_enhanced_crew_invitation_system.sql](../supabase/migrations/20250622_enhanced_crew_invitation_system.sql) | _todo_ |
| User search (invitees) | Autocomplete by name/username | [userService.ts](../apps/web/src/lib/userService.ts), [20250622_add_user_search_functions.sql](../supabase/migrations/20250622_add_user_search_functions.sql) | _todo_ |

## 6. Notifications & email

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| In-app notifications | Bell, feed, mark-read | [notificationService.ts](../apps/web/src/lib/notificationService.ts), [NotificationBell.tsx](../apps/web/src/components/NotificationBell.tsx) | _todo_ |
| Transactional email | SendGrid via Edge Function; invites/reminders | [send-email/index.ts](../supabase/functions/send-email/index.ts), [emailService.ts](../apps/web/src/lib/emailService.ts), [emailTemplates.ts](../apps/web/src/lib/emailTemplates.ts) | _todo_ |
| Email/in-app sync | Keep both channels consistent | [20250111_email_notification_sync.sql](../supabase/migrations/20250111_email_notification_sync.sql), [thirstee-notification-system-architecture.md](../thirstee-notification-system-architecture.md) | `internal-notification-sync` _todo_ |
| Email preferences | Per-user opt-in/out | [EmailPreferences.tsx](../apps/web/src/components/EmailPreferences.tsx) | _todo_ |

## 7. Event social — photos, comments, ratings

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Photo gallery | Upload/view event photos | [eventMediaService.ts](../apps/web/src/lib/eventMediaService.ts), [EventGallery.tsx](../apps/web/src/components/EventGallery.tsx) | _todo_ |
| Comments + reactions | Threaded comments, emoji reactions | [EventComments.tsx](../apps/web/src/components/EventComments.tsx), [add_event_media_comments.sql](../supabase/migrations/add_event_media_comments.sql) | _todo_ |
| Ratings | Post-event 1–5 + feedback, aggregates | [eventRatingService.ts](../apps/web/src/lib/eventRatingService.ts), [EventRatingModal.tsx](../apps/web/src/components/EventRatingModal.tsx), [StarRating.tsx](../apps/web/src/components/StarRating.tsx), [ReviewsPanel.tsx](../apps/web/src/components/ReviewsPanel.tsx) | _todo_ |

## 8. Social graph

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Follow / unfollow | Follower→following graph | [followService.ts](../apps/web/src/lib/followService.ts), [follow_system_schema.sql](../supabase/migrations/follow_system_schema.sql) | _todo_ |
| User stats | Sessions hosted/attended, etc. | [UserStats.tsx](../apps/web/src/components/UserStats.tsx), [userStatsService.ts](../packages/shared/src/lib/userStatsService.ts) | _todo_ |

## 9. Badges (gamification)

| Feature | Description | Primary code | Doc |
|---|---|---|---|
| Badge engine | Award/check on actions; progress tracking | [badgeService.ts](../apps/web/src/lib/badgeService.ts), [progressTracker.ts](../apps/web/src/lib/progressTracker.ts), [20250123_create_badge_system.sql](../supabase/migrations/20250123_create_badge_system.sql) | _todo_ |
| Badge dashboard | Earned + progress, profile display | [BadgeDashboard.tsx](../apps/web/src/pages/BadgeDashboard.tsx), [BadgeCard.tsx](../apps/web/src/components/BadgeCard.tsx), [ProgressAnalysisPanel.tsx](../apps/web/src/components/ProgressAnalysisPanel.tsx) | _todo_ |
| Live badge unlock | Real-time unlock toast/animation | [LiveBadge.tsx](../apps/web/src/components/LiveBadge.tsx), [ToastRecap.tsx](../apps/web/src/components/ToastRecap.tsx) | _todo_ |

Full design: [Thirstee_Badge_System_Architecture.md](../Thirstee_Badge_System_Architecture.md), [Thirstee_Badge_System_PRD_Complete.md](../Thirstee_Badge_System_PRD_Complete.md).

## 10. Cross-cutting / internal

| Concern | Description | Primary code | Doc |
|---|---|---|---|
| Env detection | local vs prod credential/redirect selection | [envUtils.ts](../apps/web/src/lib/envUtils.ts), [envValidator.ts](../apps/web/src/lib/envValidator.ts) | `internal-env-detection` _todo_ |
| Caching & perf | Query caching, navigation optimization | [cacheService.ts](../apps/web/src/lib/cacheService.ts), [performanceOptimizer.ts](../apps/web/src/lib/performanceOptimizer.ts) | _todo_ |
| Skeleton loaders | Perceived-perf placeholders | [SkeletonLoaders.tsx](../apps/web/src/components/SkeletonLoaders.tsx), [thirstee-skeleton-preloaders.md](../thirstee-skeleton-preloaders.md) | _todo_ |
| Haptics & sound | Mobile/web interaction feedback | [hapticFeedback.ts](../apps/web/src/lib/hapticFeedback.ts), [soundEffects.ts](../apps/web/src/lib/soundEffects.ts) | _todo_ |
| Meta tags / SEO | OG tags for shared event links | [metaTagService.ts](../apps/web/src/lib/metaTagService.ts) | _todo_ |
| Command menu | ⌘K quick nav | [CommandMenu.tsx](../apps/web/src/components/CommandMenu.tsx) | _todo_ |

---

## Mobile parity

The mobile app ([apps/mobile/src/screens/](../apps/mobile/src/screens/)) covers the core loop: Login, Home, Discover, EventDetail, CreateEvent, CreateCrew, CrewDetail, CrewJoin, Profile/ProfileView, Notifications, InvitationAction. It reuses [packages/shared](../packages/shared) services. See [THIRSTEE_MOBILE_ARCHITECTURE.md](../THIRSTEE_MOBILE_ARCHITECTURE.md) and [thirstee-monorepo-mobile-prd.md](../thirstee-monorepo-mobile-prd.md).
