# Thirstee App Complete Inventory - Part 1

**Definitive Documentation: Architecture, Design System & Database**

> **📋 Documentation Split**: This is Part 1 of 2. See [`thirstee-app-complete-inventory-part2.md`](./thirstee-app-complete-inventory-part2.md) for Feature Inventory, Component Library, API Documentation, and Implementation Status.

---

## 📱 App Overview & Branding

### Core Description
**Thirstee** is a social drinking event app designed for ages 21-35, focusing on spontaneous casual meetups and real-time social coordination. The app eliminates planning friction by enabling users to launch drink plans, gather their crew, and coordinate in real-time with minimal setup.

### Brand Identity
- **Meta Title**: `Thirstee – Tap. Drink. Repeat.`
- **Tagline**: "Skip the planning drama. Launch a drink plan, gather your crew, and vibe in real-time."
- **Value Proposition**: 60-second event setup with maximum social coordination
- **Target Behavior**: Spontaneous, casual drinking meetups with crew-based social dynamics

### Brand Personality
- **Tone**: Rebellious, fun, anti-establishment
- **Footer**: `© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘`
- **Aesthetic**: Masculine neon-inspired with glassmorphism effects
- **User Experience**: Mobile-first, gesture-driven, minimal friction

---

## 🎨 Design System Documentation

### Color Palette (Monochromatic System)

#### Primary Colors
```css
--bg-base: #08090A;           /* Ultra-dark charcoal background */
--bg-glass: rgba(255,255,255,0.05);  /* Frosted glass layer */
--bg-glass-hover: rgba(255,255,255,0.08);  /* Glass hover state */
--text-primary: #FFFFFF;      /* Main text, headings, icons */
--text-secondary: #B3B3B3;    /* Secondary text, descriptions */
--accent-primary: #FFFFFF;    /* Primary accent (white) */
--accent-secondary: #888888;  /* Secondary accent (gray) */
```

#### Interactive States
```css
--btn-primary-bg: #FFFFFF;    /* Primary button background */
--btn-primary-text: #08090A;  /* Primary button text */
--btn-secondary-bg: #07080A;  /* Secondary button background */
--btn-border-subtle: rgba(255,255,255,0.1);  /* Subtle borders */
--error: #FF4D4F;            /* Error states */
```

#### Special Purpose Colors
```css
--highlight-pink: #FF5E78;    /* Optional pink highlights */
--neon-green: #00FFA3;       /* Success states, CTAs */
--live-badge: #FF5F2E;       /* LIVE event indicator */
--toast-bg: #1A1A1A;        /* Toast notification background */
--toast-text: #00FFA3;      /* Toast notification text */
--toast-border: rgba(0, 255, 163, 0.2);  /* Toast borders */
```

#### Mobile Menu Specific
```css
--bg-sidebar-solid: #0E0E10;
--menu-border: rgba(255,255,255,0.08);
--notification-counter-bg: #FF4D4F;
--notification-counter-fg: #FFFFFF;
--header-bg: rgba(8,9,10,0.95);
--avatar-card-bg: rgba(255,255,255,0.05);
--menu-item-hover: rgba(255,255,255,0.10);
--menu-item-icon: #888888;
--menu-active-item: #FFFFFF;
```

### Typography System

#### Font Hierarchy
- **Display**: Large headings, hero text
- **Heading**: Section headers, card titles
- **Body**: Regular text content
- **Caption**: Small text, metadata

#### Color Usage
- **Primary Text**: `#FFFFFF` - Main content, headings
- **Secondary Text**: `#B3B3B3` - Descriptions, metadata
- **Muted Text**: `#CFCFCF` - Placeholder text, disabled states

### Spacing System

#### Base Units
- **Minimum Edge Spacing**: `16px` from screen edges
- **Touch Target Minimum**: `44px` for all interactive elements
- **Grid System**: 8pt base unit (8px, 16px, 24px, 32px, 40px, 48px)

#### Container Widths
- **Standard Pages**: `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8`
- **Wide Pages**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Profile Pages**: `max-w-4xl` with responsive padding
- **Discover Pages**: `max-w-7xl` for grid layouts

### Glassmorphism Effects

#### Glass Card System
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.glass-nav {
  background: rgba(8, 9, 10, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### Blur Levels
```css
--blur-sm: blur(8px);
--blur-md: blur(12px);
--blur-lg: blur(20px);
--blur-xl: blur(40px);
```

### UI Patterns

#### Button System
- **Primary**: White background, dark text, full opacity
- **Secondary**: Dark background, white text, subtle border
- **Glass**: Translucent background with backdrop blur
- **Hover States**: Scale transforms, shadow effects, opacity changes

#### Badge System - **COMPREHENSIVE IMPLEMENTATION** ✅
- **Profile Display**: 6 badges with tier/rarity sorting (legendary → epic → rare → common)
- **Dynamic Badge Count**: Shows actual total earned badges (e.g., "15 Badges Earned") not just displayed count
- **Description-First Display**: Shows meaningful badge descriptions instead of color tiers
- **Public Badge Dashboard**: Anyone can view others' earned badges at `/profile/{username}/badges`
- **Starter Badge Display**: Users with 0 earned badges see 6 locked starter badges
- **Badge Categories**: 6 categories with 47 total badges across all achievement types
- **Comprehensive Logic**: All 14 badge types implemented (drink_type, day_events, live_event, same_day_events, etc.)
- **LIVE Badge**: `#FF5F2E` background with pulse animation
- **Status Badges**: Pill-shaped with appropriate color coding
- **Role Badges**: Crown emoji for hosts, co-host indicators
- **Badge Icons**: Tier-based colors with locked/unlocked states
- **Management Features**: Visibility toggles for profile owners only

#### Toast Notifications
- **Position**: Top-right desktop, top-center mobile
- **Styling**: `#1A1A1A` background, `#00FFA3` text/border
- **Padding**: `px-5 py-3`, `rounded-xl`
- **Duration**: 5000ms default

#### Modal System
- **Background**: Glass overlay with backdrop blur
- **Content**: Rounded corners, proper z-index stacking
- **Animations**: Slide-in transitions, fade effects

### Mobile-First Responsive Design

#### Breakpoints
```css
xs: '475px'
sm: '640px'
md: '768px'
lg: '1024px'
xl: '1280px'
2xl: '1536px'
3xl: '1600px'
```

#### Touch Optimization
- **Minimum Touch Targets**: 44px height/width
- **Gesture Support**: Swipe, tap, long-press
- **Safari iOS Compatibility**: Tested and optimized
- **Viewport Handling**: Proper mobile viewport configuration

#### Icon Usage Patterns
- **Dropdown Menus**: `MoreVertical` icon (not horizontal ellipsis)
- **Host Indicators**: Crown emoji `👑` at end of names
- **Interactive Elements**: Lucide React icon library
- **Sizing**: Consistent icon sizes across components

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6 with slug-based URLs
- **UI Components**: Shadcn UI component library
- **Icons**: Lucide React icon system
- **Notifications**: Sonner toast library
- **State Management**: React Query for server state
- **Build Tool**: Vite for development and bundling

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with OAuth providers
- **Real-time**: Supabase Realtime for live updates
- **File Storage**: Supabase Storage for images
- **Edge Functions**: Deno-based serverless functions

### Key Integrations

#### Mapbox Integration
- **Token**: `pk.eyJ1Ijoicm91Z2hpbiIsImEiOiJjbWJiMWh0a2YwdTVjMmtwcm5ubzI2MnpnIn0.zZ7-Pto8J7YiWZJzxf7kvQ`
- **Style**: `mapbox://styles/roughin/cmbb1ow4o001b01r0aux92662`
- **Usage**: Location selection, event mapping, venue discovery

#### SendGrid Email System
- **From Address**: `noreply@thirstee.app`
- **Integration**: Via Supabase Edge Functions
- **Features**: Transactional emails, invitation system, notifications
- **Templates**: Dark-mode HTML templates with design system compliance

#### Development Tools
- **Local Development**: Supabase CLI with Docker
- **Package Manager**: npm/yarn for dependency management
- **Version Control**: Git with GitHub integration
- **Environment**: Environment-aware configuration

### Development Principles

#### Code Quality Standards
- **DRY (Don't Repeat Yourself)**: Maximum component reuse
- **KISS (Keep It Simple, Stupid)**: Minimal complexity
- **YAGNI (You Ain't Gonna Need It)**: No premature optimization
- **SOC (Separation of Concerns)**: Clean architecture layers

#### Performance Optimization
- **Component Reuse**: Single components with conditional props
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: WebP format, responsive images
- **Bundle Optimization**: Tree shaking, minimal dependencies

---

## 🗄️ Database Schema

### Core Tables Overview

The database consists of 15+ interconnected tables supporting user management, event coordination, crew systems, and notification handling.

### User Management Tables

#### `user_profiles`
```sql
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  favorite_drink text,
  tagline text,
  join_date timestamptz DEFAULT now(),
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'crew_only', 'private')),
  show_crews_publicly boolean DEFAULT true,
  nickname text,
  email text,
  username text NOT NULL UNIQUE
);
```

**Key Features**:
- Unique username system for profile URLs (`/profile/:username`)
- Nickname support with italic gold display (`text-yellow-400`)
- Privacy controls for profile and crew visibility
- Avatar integration with Google fallback system

### Event System Tables

#### `events`
```sql
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamptz NOT NULL,
  location text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  drink_type text CHECK (drink_type IN ('beer', 'wine', 'whiskey', 'cocktails', 'shots', 'mixed', 'other')),
  vibe text CHECK (vibe IN ('casual', 'party', 'chill', 'wild', 'classy', 'shots', 'other')),
  is_public boolean DEFAULT true,
  event_code text UNIQUE CHECK (event_code ~ '^[A-Z0-9]{6}$'),
  latitude double precision CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision CHECK (longitude >= -180 AND longitude <= 180),
  place_id text,
  place_name text,
  crew_id uuid REFERENCES public.crews(id),
  place_nickname text,
  rsvp_count integer DEFAULT 1,
  public_slug text,
  private_slug text,
  cover_image_url text,
  end_time timestamptz,
  duration_type text DEFAULT 'specific_time' CHECK (duration_type IN ('now', 'custom', 'explicit')),
  duration_hours integer
);
```

**Key Features**:
- Unique 6-character event codes for sharing
- Public/private slug system for SEO-friendly URLs
- Mapbox integration with coordinates and place data
- Flexible duration system (timed, all-night, custom)
- Cover image support with default fallbacks

#### `event_members`
```sql
CREATE TABLE public.event_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id),
  user_id uuid REFERENCES auth.users(id),
  invited_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invitation_comment text,
  invitation_sent_at timestamptz DEFAULT now(),
  invitation_responded_at timestamptz,
  role text DEFAULT 'attendee' CHECK (role IN ('attendee', 'co_host', 'host'))
);
```

**Key Features**:
- Role-based permissions (host, co_host, attendee)
- Invitation tracking with timestamps
- RSVP status management
- Comment system for invitations

### Crew System Tables

#### `crews`
```sql
CREATE TABLE public.crews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vibe text DEFAULT 'casual' CHECK (vibe IN ('casual', 'party', 'chill', 'wild', 'classy', 'other')),
  visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `crew_members`
```sql
CREATE TABLE public.crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES public.crews(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role text DEFAULT 'member' CHECK (role IN ('member', 'co_host', 'host'))
);
```

**Key Features**:
- Hierarchical role system (host, co_host, member)
- Invitation and acceptance workflow
- Crew-based event coordination
- Privacy controls for crew visibility

### Notification System Tables

#### `notifications`
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN (
    'event_invitation', 'event_invitation_response', 'event_update',
    'event_rsvp', 'event_reminder', 'event_cancelled', 'event_rating_reminder',
    'crew_invitation', 'crew_invitation_response', 'crew_invite_accepted',
    'crew_promotion', 'event_promotion', 'crew_join'
  )),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Comprehensive notification type system
- JSON data storage for flexible notification content
- Read/unread state management
- Real-time notification delivery

### Email & Communication Tables

#### `email_logs`
```sql
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL CHECK (type IN ('event_invitation', 'event_reminder', 'crew_invitation', 'welcome', 'password_reset')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  message_id text,
  data jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `invitation_tokens`
```sql
CREATE TABLE public.invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  invitation_type text NOT NULL CHECK (invitation_type IN ('event', 'crew')),
  invitation_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('accept', 'decline')),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Features**:
- Secure token-based email responses
- Time-limited token expiration
- Single-use token validation
- Email-notification synchronization

### Badge System Tables ✅

#### `badges`
```sql
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('event_participation', 'hosting_crew', 'social_activity', 'streaks_time', 'weekly_sinners', 'drink_devotees')),
  color_tier text NOT NULL CHECK (color_tier IN ('common', 'rare', 'epic', 'legendary')),
  unlock_criteria jsonb NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### `user_badges`
```sql
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  is_visible_on_profile boolean DEFAULT true,
  display_order integer DEFAULT 0,
  UNIQUE(user_id, badge_id)
);
```

**Key Features**:
- **32 Total Badges** across 6 categories with comprehensive unlock criteria and personality-driven descriptions
- **Tier-based System**: Common, rare, epic, legendary with color coding
- **Dynamic Count Display**: Shows actual total earned badges count
- **Description-First UI**: Badge descriptions displayed instead of color tiers
- **Public Badge Viewing**: Anyone can view others' earned badges
- **Profile Display**: 6 badges with tier/rarity sorting
- **Comprehensive Logic**: All 14 badge types implemented (drink_type, day_events, live_event, etc.)

### Additional Supporting Tables

#### `event_photos`, `event_comments`, `event_ratings`
- Photo gallery system for events
- Comment system with reaction support
- 5-star rating system for event feedback

#### `email_preferences`
- User email notification preferences
- Frequency controls (immediate, daily, weekly, never)
- Category-based opt-in/opt-out

### Database Relationships

#### Primary Relationships
- **Users → Events**: One-to-many (creator relationship)
- **Events → Event Members**: One-to-many (RSVP system)
- **Users → Crews**: Many-to-many (via crew_members)
- **Crews → Events**: One-to-many (crew events)
- **Users → Notifications**: One-to-many (notification delivery)
- **Users → Badges**: Many-to-many (via user_badges) - Badge achievement system
- **Badges → User Badges**: One-to-many (badge instances)

#### Key Constraints
- **RLS Policies**: Row Level Security on all tables
- **Foreign Key Constraints**: Referential integrity enforcement
- **Check Constraints**: Data validation at database level
- **Unique Constraints**: Username, event codes, invitation tokens

---

*This concludes Part 1. Continue to [`thirstee-app-complete-inventory-part2.md`](./thirstee-app-complete-inventory-part2.md) for Feature Inventory, Component Library, API Documentation, and Implementation Status.*
