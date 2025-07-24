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
- **Dynamic Badge Count**: Shows actual total earned badges (e.g., "15 Badges Earned") not just displayed count
- **Description Display**: Shows meaningful badge descriptions instead of color tiers
- **Enhanced Sorting Logic**:
  1. Tier/rarity (legendary → epic → rare → common)
  2. Earned date (most recent first)
  3. Alphabetical by name (tiebreaker)
- **Starter Badge Display**: If 0 earned badges, display 6 locked starter badges (First Pour, Vibe Initiator, Squad Recruit, Buzzword Rookie, Photo Bae I, Founding Thirstee)
- **Debug Tools**: Development badge-debug page for troubleshooting badge issues
- **TypeScript Compatibility**: Vercel-ready build with proper error handling
- **Public Badge Viewing**: Anyone can view others' earned badges via badge dashboard

---

## 🧭 3. User Flow

### 🧃 3.1 Profile View

**Position:** Between "Upcoming Session" and Stats section
**Component:** `BadgePreviewCard`

- **Displays up to 6 badges** with enhanced sorting (tier/rarity priority)
- **Smart Display Logic**: Shows earned badges OR 6 locked starter badges if user has 0 earned
- **Responsive Grid**: 2 cols mobile, 3 cols tablet, 6 cols desktop
- **Dynamic Count Display**: Shows total earned badges count (e.g., "15 Badges Earned")
- **Description-First**: Each badge shows icon + name + description (not color tier)
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
*You showed up. That counts for something... right?*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| First Pour | Made your debut – your glass is now in play | 1 | Attend 1 event |
| Regular Drip | Attend total events | 4 | 5 / 15 / 30 / 60 |
| Amped & Buzzin' | Showed up to a LIVE one – you wild | 1 | Event with `status = live` |
| Same Day Double | Two events, one calendar – you okay? | 1 | Date-based group logic |

---

### 🍻 Hosting & Crew
*Because you weren't content just showing up—you had to organize chaos.*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Vibe Initiator | Hosted your first – you brave soul | 1 | Host 1 event |
| Host With the Most | Host multiple events | 2 | 3 / 10 |
| Master of Ceremonies | 25 under your belt – applause! | 1 | Host 25 events |
| Certified Chaos Curator | 50 hosted – are you even okay? | 1 | Host 50 events |
| Party Pack | Threw a bash with 5+ attendees | 1 | Attendee count check |
| Squad Recruit | Joined your first crew – now it's real | 1 | Crew join |
| Ride or Die | Attend events with same crew | 3 | 5 / 15 / 30 |
| Deputy of Debauchery | Got promoted to co-host – power corrupts | 1 | `role = co_host` |

---

### 💬 Social Activity
*Talking, reacting, and posting? You social butterfly.*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Buzzword Rookie/Brawler/Boss | Post comments | 3 | 3 / 10 / 25 |
| Photo Bae | Upload event photos | 3 | 1 / 5 / 10 |
| Cheers Clicker | React to content | 3 | 10 / 50 / 150 |

---

### 🔥 Streaks & Time-Based
*Consistency is sexy. Or... at least mildly impressive.*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Streak Seeker | Weekly streak | 3 | 3 / 6 / 12 weeks |
| Founding Thirstee | One month in – welcome to the jungle | 1 | 30 days since signup |
| No Days Off | 4-day streak – we worry about you | 1 (hidden) | Date-streak |
| Midnight Mischief | Join an event titled “Midnight Mischief” | 1 (easter egg) | Title match logic |

---

### 🗓️ Weekly Sinners (Day-Based)
*Your week, your chaos calendar.*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Monday Mourner | 5 Mondays in – respect the struggle | 1 | Date day match |
| Tequila Tuesday | 5 Tuesdays – regrettably consistent | 1 | — |
| Wasted Wednesday | 5 Wednesdays – hump day hero | 1 | — |
| Thirstday Legend | 5 Thursdays – it's always Thursday somewhere | 1 | — |
| Freaky Friday | 5 Fridays – you belong in a montage | 1 | — |
| Spicy Saturday | 5 Saturdays – the main event | 1 | — |
| Sin-Day Devotee | 5 Sundays – you're spiritually...hydrated? | 1 | — |

---

### 🍹 Drink-Type Devotees
*You're not picky. You're just... passionate.*

| Badge | Description | Tiers | Unlock |
|-------|-------------|-------|--------|
| Lager Royalty | 10+ beer events – foamy and faithful | 1 | `drink_type = beer` |
| Wine Whisperer | 10+ wine events – swirling with purpose | 1 | `drink_type = wine` |
| Whiskey Wizard | 10+ whiskey events – strong and smoldering | 1 | — |
| Cocktail Creature | 10+ cocktails – mixed up and thriving | 1 | — |
| Shot Sensei | 10+ shots – blink and it's gone | 1 | — |
| Blend Baron | 10+ mixed drinks – chaos in a cup | 1 | — |
| Wildcard Sipper | 10+ mystery drinks – living dangerously | 1 | `drink_type = other` |

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

---

## 🔧 **Development Tools & Debug Features**

### **Badge Debug Page** (`/badge-debug`)
**Purpose**: Comprehensive debugging tool for badge system troubleshooting

**Features**:
- **Real-time Badge Analysis**: Shows all user badges, counts, and filtering
- **Starter Badge Verification**: Confirms starter badges load correctly
- **Service Method Testing**: Tests BadgeService.getAllUserBadges() and getStarterBadges()
- **Error Diagnostics**: Catches and displays badge fetching errors
- **User Activity Inspection**: Shows user ID, email, and badge data

**Usage**: Development/staging environments only for troubleshooting badge issues

### **Badge Test Page** (`/badge-test`)
**Purpose**: Manual badge awarding and testing functionality

**Features**:
- **Award Badges to All Users**: Triggers comprehensive badge checking system
- **Individual Badge Testing**: Test specific badge unlock criteria
- **Database Integration**: Works with updated badge names and descriptions
- **Retroactive Awards**: Awards badges based on existing user activity

**Usage**: Development tool for testing badge logic and awarding missed badges

---

## 📌 Summary - **UPDATED**

- ✅ **32 Total Badges** across 6 categories with personality-driven names and descriptions
- ✅ **Complete Badge System**: All 14 badge types implemented (drink_type, day_events, live_event, same_day_events, etc.)
- ✅ **Enhanced Profile Display**: 6 badges with tier/rarity sorting, dynamic count display, and description-first UI
- ✅ **Creative Badge Naming**: Humorous, personality-driven badge names matching Thirstee's brand voice
- ✅ **Public Badge Viewing**: Anyone can view others' earned badges via public dashboard
- ✅ **Dual Access Control**: Full management for owners, read-only for others
- ✅ **Development Tools**: Debug and test pages for troubleshooting and manual badge awards
- ✅ **TypeScript Compatible**: Vercel-ready build with proper error handling
- ✅ **Fully UI-integrated** with responsive design and glassmorphism styling
- ✅ **Earned from actions already tracked** with retroactive badge awards
- ✅ **Smart Badge Display Logic** with locked state support for new users
- ✅ **Aligned with Thirstee brand, tone, and frontend system**