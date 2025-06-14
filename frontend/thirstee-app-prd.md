# 🥂 Thirstee – Full PRD (Phased & Status-Based)

---

## 📱 App Description & Design System

- **Thirstee** is a social drinking event app for ages 21–35, designed for spontaneous casual meetups.
- **Tech Stack**: React + TailwindCSS + Supabase.
- **Design Tone**: Stone Cold Steve Austin energy with bold copy and fun drink-based identity.
- **Theming**: Black + Gold primary palette, charcoal/amber accents, shadcn/ui components.
- **Footer**: `© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘`
- Fully responsive across all screens. Safari iOS compatible.

---

## ⚡ Phase 1: MVP Core — ✅ Mostly Complete

| Feature | Status | Notes |
|--------|--------|-------|
| Authentication via Supabase | ✅ | Google login + hard refresh support |
| Create/Edit/Delete Events | ✅ | Includes time, vibe, privacy, RSVP |
| Discover Page | ✅ | Public events with filters |
| Mapbox Location Picker | ✅ | Replaces Google Maps autocomplete |
| RSVP System (with Host as default) | ✅ | RSVP count = host + accepted |
| Custom Cover Photo Upload | ✅ | Stored in Supabase |
| Default Cover by Vibe | ✅ | 6 optimized WebP images |
| Event Detail Page | ✅ | Shows full session info |
| Slug-based URL for events | ✅ | SEO friendly and shareable |
| Shareable Links | ✅ | Unique for each session |
| Party Crew System | ✅ | Replace follow model |
| Event Tabs (Upcoming | Past) | ✅ | In profile with responsive layout |
| Profile Overview | ✅ | Display name, drink, avatar, bio |
| Nicknames | ✅ | Text-yellow-400 italic everywhere |
| Next Event Banner in Profile | ✅ | Sticky alert before session |
| Public/Private Event Toggle | ✅ | Controls RSVP visibility |
| Mobile Responsiveness | ✅ | Layout scales across devices |

---

## 🎯 Phase 2: Social & Profile Personalization — 🔄 In Progress

| Feature | Status | Notes |
|--------|--------|-------|
| Avatar Upload + Google Fallback | ✅ | Avatar shown across app |
| Favorite Drink Field | ✅ | Optional during profile setup |
| Tagline / Bio in Profile | ✅ | Displayed publicly |
| Profile Privacy Settings | ✅ | Public / Crew Only / Private |
| Public Profile View | ✅ | Avatars, taglines, clink stats |
| Crew Page Design | ✅ | Crew view follows event detail UI |
| Invite via Email/Username/Link | ✅ | Fully working |
| Remove “Signed In As” block | ✅ | Cleaned profile layout |
| Profile Tabs Default to Upcoming | ✅ | With persistence option |
| Event Badges (“Joined”, “You're Hosting”) | ✅ | Display on cards |
| View RSVP List with Nicknames | ✅ | On Event Detail page |

---

## 📸 Phase 3: Engagement & Social Feedback — 🔧 Upcoming

| Feature | Status | Notes |
|--------|--------|-------|
| Post-Event Photo Gallery | ✅ | Only attendees can upload |
| Comments on Past Events | ✅ | Comments + emoji reactions |
| Host Moderation on Media | ❌ | Remove uploads/comments |
| Post-Event Rating System | ✅ | Star rating visible in event detail |
| Event Search Engine | ❌ | Elastic-style search across fields |
| Event Review Display | ✅ | Google Reviews-style rating panel |
| Clink Count on Profile | ❌ | Total joined + hosted |
| Public Profile Click from Events | ❌ | With privacy respect |
| Crew Events Filter | ❌ | Toggle in Discover page |
| Avatar Hover = Nickname Tooltip | ❌ | Optional mini identity moment |
| Delete Profile Option | ❌ | Inside Edit Profile; requires confirmation modal & session cleanup |

---

## 🚀 Phase 4: Growth, Notifications, & Polish — 🧠 Next Up

### 🔔 Notifications

| Feature | Status | Notes |
|--------|--------|-------|
| RSVP Push Notification | ❌ | “🍺 Rush just joined your party!” |
| 30 Min Before Reminder | ❌ | Toast + optional push |
| Crew Join Notification | ❌ | Toast/fallback if no push |
| New Crew Event Alert | ❌ | Optional opt-in |

---

### 🎭 Fun Identity & Progression

| Feature | Status | Notes |
|--------|--------|-------|
| Nickname Generator Pool | ✅ | Randomize fun titles |
| Unlockable Titles (e.g. Beer God) | ❌ | Based on milestones |
| Drink Badges / Achievement Icons | ❌ | e.g. “Clinked 10x this month” |
| Custom Avatar Flair (rare titles) | ❌ | Gold ring / emoji border |

---

### 🧱 Safety, Legal, & Controls

| Feature | Status | Notes |
|--------|--------|-------|
| Age Gate (21+) | ❌ | Modal on first access |
| Terms & Community Rules | ❌ | Footer/legal required |
| Block/Report Feature | ❌ | For sessions or users |

---

### 📐 UI/UX Upgrades

| Feature | Status | Notes |
|--------|--------|-------|
| UI Polish on Mobile | ❌ | Tab bar spacing, Safari edge bugs |
| Page Transitions / Route Caching | ❌ | Prevent data refetch on back |
| Smart Pagination (Discover) | ✅ | Hide next/prev when not needed |
| Animated Tab Transitions | ❌ | Micro UX |
| Updated Discover Layout (Meetup Style) | ❌ | Filter bar, pinned events |
| Featured Crew/Events Strip | ❌ | What’s trending module |

---

## 🛠 Technical Enhancements

| Feature | Status | Notes |
|--------|--------|-------|
| Supabase Auth Management | ✅ | Full state protection |
| Supabase Storage Optimization | ✅ | Cover photos, avatars, gallery |
| Caching for Places API | ✅ | Reduced API quota |
| `canViewEvent(user, event)` Permission Helper | ✅ | Access control utility |
| Route Prefetch & View Caching | ❌ | Avoids reload on back press |
| Redirect to Profile After Login | ✅ | Skip homepage |
| Welcome Toast on First Login Only | ✅ | No unnecessary repetition |
| Debug Logs Removed from Production | ✅ | Clean console & network |
| Session Timeout Policy | ✅ | Persistent login best practice |
| OAuth Token Security Implementation | ✅ | Prevents token exposure in URLs |
| User Profile Events Display | ✅ | Comprehensive 4-category event fetching |

---

## 📋 User Profile Events Display Requirements

### 🚨 CRITICAL IMPLEMENTATION - DO NOT SIMPLIFY

The `UserProfile.tsx` component **MUST** always fetch and display events from **4 mandatory categories**. This functionality has been broken multiple times by oversimplification - never reduce to only showing created events.

### ✅ Required Event Categories

#### 1. **Events User Created**
```sql
-- Query: events table where created_by = current_user_id
SELECT * FROM events WHERE created_by = user.id
```
- **Purpose**: Shows events the user is hosting
- **Display**: "Hosted by You" label, edit/delete actions available
- **Avatar**: Current user's avatar

#### 2. **Events User Manually Joined (RSVP)**
```sql
-- Query: events joined via RSVP system
SELECT e.* FROM events e
INNER JOIN rsvps r ON e.id = r.event_id
WHERE r.user_id = user.id AND r.status = 'going' AND e.created_by != user.id
```
- **Purpose**: Shows public events user clicked "Join" on
- **Display**: "Hosted by [Creator Name]" label, no edit actions
- **Avatar**: Event creator's avatar (fetched separately)

#### 3. **Events User Was Directly Invited To**
```sql
-- Query: events via direct crew invitations
SELECT e.* FROM events e
INNER JOIN event_members em ON e.id = em.event_id
WHERE em.user_id = user.id AND em.status = 'accepted' AND e.created_by != user.id
```
- **Purpose**: Shows events user was invited to during event creation
- **Display**: "Hosted by [Creator Name]" label, no edit actions
- **Avatar**: Event creator's avatar (fetched separately)

#### 4. **Events from Crews User Belongs To**
```sql
-- Query: events associated with user's crews
SELECT e.* FROM events e
WHERE e.crew_id IN (
  SELECT cm.crew_id FROM crew_members cm
  WHERE cm.user_id = user.id AND cm.status = 'accepted'
) AND e.created_by != user.id
```
- **Purpose**: Shows events from crews user is a member of
- **Display**: "Hosted by [Creator Name]" label, no edit actions
- **Avatar**: Event creator's avatar (fetched separately)

### 🔧 Implementation Requirements

#### **Deduplication Logic**
```javascript
// REQUIRED: Remove duplicates when user appears in multiple categories
const uniqueEvents = allEventsRaw.reduce((acc, event) => {
  if (!acc.find(e => e.id === event.id)) {
    acc.push(event)
  }
  return acc
}, [])
```

#### **Creator Profile Fetching**
```javascript
// REQUIRED: Fetch creator profiles separately for proper avatar display
if (!isHosting) {
  const { data: creatorProfile } = await supabase
    .from('user_profiles')
    .select('display_name, nickname, avatar_url, user_id')
    .eq('user_id', event.created_by)
    .single()
}
```

#### **Error Handling**
```javascript
// REQUIRED: Handle errors from all query types
const errors = [
  createdResult.error,
  rsvpResult.error,
  crewInvitedResult.error,
  crewAssociatedResult.error
].filter(Boolean)

if (errors.length > 0) {
  console.error('Errors fetching events:', errors)
  throw errors[0]
}
```

### 🚫 Common Mistakes to Avoid

1. **❌ NEVER simplify to only created events** - This breaks the user experience
2. **❌ NEVER skip creator profile fetching** - Results in missing avatars
3. **❌ NEVER forget deduplication** - Causes duplicate events in UI
4. **❌ NEVER use complex database functions** - Simple queries are more reliable
5. **❌ NEVER skip error handling** - One failed query shouldn't break all events

### 📊 Expected Results

#### **Upcoming Events Tab**
- Events user created with future `date_time`
- Events user RSVP'd to with future `date_time`
- Events user was invited to with future `date_time`
- Events from user's crews with future `date_time`
- All with proper host avatars and "Hosted by" labels

#### **Past Events Tab**
- Same 4 categories but with past `date_time`
- Sorted by most recent first
- Proper pagination for large lists

### 🔄 Maintenance Notes

- **This functionality has been broken 3+ times** by well-intentioned "simplifications"
- **Always test all 4 categories** when making changes to UserProfile.tsx
- **Never remove any of the 4 query types** without explicit user approval
- **Always verify avatars display correctly** for both hosted and joined events
- **Maintain comprehensive logging** for debugging future issues

---

## � Security Implementation

### OAuth Token Security ✅
- **Issue**: Google OAuth tokens were exposed in browser URLs during authentication flow
- **Solution**: Implemented comprehensive token cleanup system
- **Features**:
  - Immediate token detection and removal from URLs
  - Browser history protection (tokens never stored in history)
  - Support for both authorization code flow (secure) and implicit flow (legacy)
  - Security validation and monitoring
  - PKCE flow preference for enhanced security

### Security Components
- `authSecurity.ts`: Core security utilities for token handling
- Enhanced `AuthCallback.tsx`: Secure authentication processing
- Security test page: `/test-auth-security` for validation
- Comprehensive security documentation

### Security Best Practices Implemented
- Tokens cleared immediately upon detection
- Browser history protection via `history.replaceState()`
- Referrer policy configuration to prevent token leakage
- Cache control headers for authentication pages
- Comprehensive security logging (without exposing sensitive data)
- HTTPS enforcement in production environments

---

## �💡 Phase 5: Long-Term Explorations

- Spotify playlist integration per session
- Email notifications/reminders
- Host rating system
- Suggested people to Clink with (mutual RSVPs)
- Crew performance/stats (total events, members, etc.)
- RSVP limits with waitlist handling

## Database Schema

### `public.crew_invitations`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `crew_id`     | `uuid`                           | NOT NULL, FK → `public.crews(id)`                                                 |
| `invite_code` | `text`                           | NOT NULL, UNIQUE                                                                  |
| `created_by`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `expires_at`  | `timestamp with time zone`       |                                                                                   |
| `max_uses`    | `integer`                        |                                                                                   |
| `current_uses`| `integer`                        | DEFAULT `0`                                                                       |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.crew_members`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `crew_id`     | `uuid`                           | NOT NULL, FK → `public.crews(id)`                                                 |
| `user_id`     | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `status`      | `crew_member_status` (enum)      | NOT NULL, DEFAULT `'pending'`                                                     |
| `invited_by`  | `uuid`                           | FK → `auth.users(id)`                                                             |
| `joined_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.crews`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `name`        | `text`                           | NOT NULL                                                                          |
| `vibe`        | `text`                           | CHECK in (`casual`, `party`, `chill`, `wild`, `classy`, `other`), DEFAULT `casual` |
| `visibility`  | `crew_visibility` (enum)         | NOT NULL, DEFAULT `private`                                                       |
| `description` | `text`                           |                                                                                   |
| `created_by`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_comments`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`    | `uuid`                           | NOT NULL, FK → `public.events(id)`                                                |
| `user_id`     | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `content`     | `text`                           | NOT NULL                                                                          |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_comment_reactions`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `comment_id`  | `uuid`                           | NOT NULL, FK → `public.event_comments(id)`                                        |
| `user_id`     | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `reaction`    | `text`                           | CHECK in (`🍻`, `🙌`, `🤘`, `🥴`, `😂`, `❤️`, `🔥`), NOT NULL                        |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_invitations`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`    | `uuid`                           | NOT NULL, FK → `public.events(id)`                                                |
| `inviter_id`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `invitee_id`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `status`      | `text`                           | CHECK in (`pending`, `accepted`, `declined`), DEFAULT `pending`                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_members`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`    | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `invited_by`  | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`      | `text`                           | CHECK in (`pending`, `accepted`, `declined`), DEFAULT `pending`                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_photos`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | NOT NULL, FK → `public.events(id)`                                                |
| `uploaded_by`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `photo_url`    | `text`                           | NOT NULL                                                                          |
| `storage_path` | `text`                           | NOT NULL                                                                          |
| `caption`      | `text`                           |                                                                                   |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.event_ratings`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | NOT NULL, FK → `public.events(id)`                                                |
| `user_id`      | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `rating`       | `integer`                        | NOT NULL, CHECK `1 ≤ rating ≤ 5`                                                  |
| `feedback_text`| `text`                           |                                                                                   |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.events`
| Column           | Type                             | Constraints                                                                       |
|------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`             | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `title`          | `text`                           | NOT NULL                                                                          |
| `date_time`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `location`       | `text`                           | NOT NULL                                                                          |
| `notes`          | `text`                           |                                                                                   |
| `created_by`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `drink_type`     | `text`                           | CHECK in (`beer`,`wine`,`whiskey`,`cocktails`,`shots`,`mixed`,`other`) or NULL    |
| `vibe`           | `text`                           | CHECK in (`casual`,`party`,`chill`,`wild`,`classy`,`shots`,`other`) or NULL       |
| `is_public`      | `boolean`                        | DEFAULT `true`                                                                    |
| `event_code`     | `text`                           | UNIQUE, CHECK regex `^[A-Z0-9]{6}$` or NULL                                        |
| `latitude`       | `double precision`               | CHECK -90 ≤ latitude ≤ 90 or NULL                                                 |
| `longitude`      | `double precision`               | CHECK -180 ≤ longitude ≤ 180 or NULL                                              |
| `place_id`       | `text`                           |                                                                                   |
| `place_name`     | `text`                           |                                                                                   |
| `crew_id`        | `uuid`                           | FK → `public.crews(id)`                                                           |
| `place_nickname` | `text`                           |                                                                                   |
| `rsvp_count`     | `integer`                        | DEFAULT `1`                                                                       |
| `public_slug`    | `text`                           |                                                                                   |
| `private_slug`   | `text`                           |                                                                                   |
| `cover_image_url`| `text`                           |                                                                                   |

### `public.follows`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `follower_id`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `following_id` | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `status`       | `text`                           | CHECK in (`pending`,`accepted`,`rejected`), DEFAULT `pending`                     |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.notifications`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `user_id`      | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `type`         | `text`                           | CHECK in (`follow_request`,`follow_accepted`,`event_invitation`,`event_update`,`crew_invitation`,`event_rsvp`,`event_reminder`,`crew_invite_accepted`,`event_cancelled`,`event_rating_reminder`) |
| `title`        | `text`                           | NOT NULL                                                                          |
| `message`      | `text`                           | NOT NULL                                                                          |
| `data`         | `jsonb`                          | DEFAULT `{}`                                                                      |
| `read`         | `boolean`                        | DEFAULT `false`                                                                   |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.rsvps`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`      | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`       | `rsvp_status` (enum)             | NOT NULL, DEFAULT `'maybe'`                                                       |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.user_follows`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `follower_id`  | `uuid`                           | FK → `auth.users(id)`                                                             |
| `following_id` | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### `public.user_profiles`
| Column             | Type                             | Constraints                                                                       |
|--------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`               | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `user_id`          | `uuid`                           | UNIQUE, FK → `auth.users(id)`                                                     |
| `display_name`     | `text`                           |                                                                                   |
| `bio`              | `text`                           |                                                                                   |
| `avatar_url`       | `text`                           |                                                                                   |
| `favorite_drink`   | `text`                           |                                                                                   |
| `tagline`          | `text`                           |                                                                                   |
| `join_date`        | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `profile_visibility`| `text`                          | CHECK in (`public`,`crew_only`,`private`), DEFAULT `public`                       |
| `show_crews_publicly`| `boolean`                       | DEFAULT `true`                                                                    |
| `nickname`         | `text`                           |                                                                                   |
| `created_at`       | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`       | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
