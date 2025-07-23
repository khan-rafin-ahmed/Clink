# 🏅 Thirstee Badge System – Complete Product Requirements Document (PRD)

---

## 🧃 1. Objective

Create a badge system that:
- Rewards user behavior (event hosting, attendance, social activity)
- Reflects personality and vibe through public display
- Encourages repeat participation via streaks and milestones
- Supports badge customization and flex culture
- Fully matches Thirstee’s design system and tone

---

## 🔩 2. Core Functionalities

### 🏆 Badge Acquisition
- Based entirely on existing app behavior: event participation, crew, comments, drink types, etc.
- Tiered structure where relevant
- Includes hidden/easter egg and streak-based badges
- Badge names and descriptions are pun-heavy, rebellious, fun

### 👁️ Badge Display & Customization - **UPDATED**
- Profile shows **up to 6 badges**: sorted by tier/rarity priority, then by earned date
- **Enhanced Sorting Logic**:
  1. Tier/rarity (legendary → epic → rare → common)
  2. Earned date (most recent first)
  3. Alphabetical by name (tiebreaker)
- **Starter Badge Display**: If 0 earned badges, display 6 locked starter badges (First Sip, Party Starter, Crew Member, Comment Commander I, Photo Dropper I, Thirstee OG)
- **Public Badge Viewing**: Anyone can view others' earned badges via badge dashboard

---

## 🧭 3. User Flow

### 🧃 3.1 Profile View

**Position:** Between "Upcoming Session" and Stats section
**Component:** `BadgePreviewCard`

- **Displays up to 6 badges** with enhanced sorting (tier/rarity priority)
- **Smart Display Logic**: Shows earned badges OR 6 locked starter badges if user has 0 earned
- **Responsive Grid**: 2 cols mobile, 3 cols tablet, 6 cols desktop
- Each badge: Icon + name + tier color with locked state support
- “View All” button links to `/profile/:username/badges`

---

### 🔐 3.2 Badge Dashboard (`/profile/:username/badges`) - **ENHANCED WITH PUBLIC ACCESS**

- **Dual Access Control**:
  - **Own Profile**: Full management dashboard with visibility toggles and settings
  - **Other Users**: Public read-only view showing only earned badges
- **Public Badge Viewing**: Anyone can view others' earned badges and achievements
- **Sections:**
  - **Unlocked Badges:** Full grid with icons, name, earned date, requirements completed
  - **Locked Badges:** Grayed out, with unlock criteria + progress bar
- “Show/Hide on Profile” toggle for each unlocked badge

---

### 🧩 3.3 Badge Management (Inline Controls)

- **Location**: Directly on `/profile/:username/badges` page
- **Visibility Toggles**: Inline switches on each earned badge card
- **Max 4 badges visible on profile**: Automatic enforcement
- Includes “Reset to Default” (most recent 4 badges)
- **No Modal Required**: Full page experience for better mobile UX

---

## 🧱 4. Badge Categories & Catalog

### 🥂 Event Participation

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| First Sip | Attend your first event | 1 | Attend 1 event |
| The Regular | Attend total events | 4 | 5 / 15 / 30 / 60 |
| Live & Lit | Attend any LIVE event | 1 | Event with `status = live` |
| Double Trouble | Attend 2+ events same day | 1 | Date-based group logic |

---

### 🍻 Hosting & Crew

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Party Starter | Host your first event | 1 | Host 1 event |
| Thirst Commander | Host multiple events | 4 | 3 / 10 / 25 / 50 |
| Squad Goals | Host event with 5+ attendees | 1 | Attendee count check |
| Crew Member | Join your first crew | 1 | Crew join |
| Crew Champion | Attend events with same crew | 3 | 5 / 15 / 30 |
| Co-Captain | Get promoted to co-host | 1 | `role = co_host` |

---

### 💬 Social Activity

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Comment Commander | Post comments | 3 | 3 / 10 / 25 |
| Photo Dropper | Upload event photos | 3 | 1 / 5 / 10 |
| Cheers Machine | React to content | 3 | 10 / 50 / 150 |

---

### 🔥 Streaks & Time-Based

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Loyal Drinker | Weekly streak | 3 | 3 / 6 / 12 weeks |
| Thirstee OG | 1 month active user | 1 | 30 days since signup |
| No Breaks Baby | 4+ days in a row | 1 (hidden) | Date-streak |
| Midnight Mischief | Join an event titled “Midnight Mischief” | 1 (easter egg) | Title match logic |

---

### 🗓️ Weekly Sinners (Day-Based)

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Monday Mourner | 5 Monday events | 1 | Date day match |
| Too Much Tuesday | 5 Tuesday events | 1 | — |
| Wrecked Wednesday | 5 Wednesday events | 1 | — |
| Thirstday God | 5 Thursday events | 1 | — |
| Friday Fiend | 5 Friday events | 1 | — |
| Savage Saturday | 5 Saturday events | 1 | — |
| Sin-Day Saint | 5 Sunday events | 1 | — |

---

### 🍹 Drink-Type Devotees

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Lager Lord | 10+ beer events | 1 | `drink_type = beer` |
| Wino Supremo | 10+ wine events | 1 | `drink_type = wine` |
| Whiskey Wizard | 10+ whiskey events | 1 | — |
| Mixer Monster | 10+ cocktail events | 1 | — |
| Shot Caller | 10+ shots events | 1 | — |
| Blend Lord | 10+ mixed drink events | 1 | — |
| Wildcard Drinker | 10+ other drinks | 1 | `drink_type = other` |

---

## 🔐 5. Access Rules - **UPDATED**

- **Badge Dashboard Access**:
  - **Own Profile** (`/profile/{username}/badges`): Full management dashboard with all features
  - **Other Users** (`/profile/{username}/badges`): Public read-only view with earned badges only
- **Profile Badge Display**: Public, shows up to 6 badges with tier/rarity sorting
- **Management Features**: Visibility toggles and settings only available to profile owners
- **Public Badge Viewing**: Anyone can view others' earned badges and achievements

---

## 🎨 6. Design System Integration

- Use `glass-card`, `rounded-xl`, `backdrop-blur-md`
- Icons: 64x64 SVGs, tiered colors (bronze, silver, gold, neon)
- Locked badges: grayscale + `opacity-40`, hover shows unlock requirements
- Toast notifications on new badge earn

---

## 📊 7. Data Model (DB Overview)

| Table | Purpose |
|-------|---------|
| `badges` | Master badge list |
| `user_badges` | Track which badges a user earned |
| `badge_progress` | Optional: Track progress for locked badges |
| `badge_visibility` | Optional: Which badges are shown in profile preview |

---

## ✅ 8. Default Display Rules

| Condition | Result |
|-----------|--------|
| User has 4+ earned badges | Show pinned (or recent 4) |
| User has 1–3 earned | Show those + filler locked |
| User has 0 | Show 4 locked starter badges |
| New badge earned | Toast + added to preview unless overridden |

---

## 📌 Summary - **UPDATED**

- ✅ **47 Total Badges** across 6 categories with comprehensive unlock criteria
- ✅ **Complete Badge System**: All 14 badge types implemented (drink_type, day_events, live_event, same_day_events, etc.)
- ✅ **Enhanced Profile Display**: 6 badges with tier/rarity sorting and starter badge support
- ✅ **Public Badge Viewing**: Anyone can view others' earned badges via public dashboard
- ✅ **Dual Access Control**: Full management for owners, read-only for others
- ✅ **Comprehensive Migration**: Existing users automatically receive earned badges
- ✅ **Fully UI-integrated** with responsive design and glassmorphism styling
- ✅ **Earned from actions already tracked** with retroactive badge awards
- ✅ **Smart Badge Display Logic** with locked state support for new users
- ✅ **Aligned with Thirstee brand, tone, and frontend system**