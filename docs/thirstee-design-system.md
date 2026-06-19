# Thirstee — Design System

**Theme:** dark-first **glassmorphism** ("liquid glass") with a near-black base and white/neon accents
**Web tokens (CSS vars):** [apps/web/src/index.css](../apps/web/src/index.css) (`:root`)
**Tailwind base (shared):** [packages/config/tailwind/base.js](../packages/config/tailwind/base.js)
**shadcn/ui primitives:** [apps/web/src/components/ui/](../apps/web/src/components/ui/)
**Live reference:** the `/style-guide` route ([StyleGuide.tsx](../apps/web/src/components/StyleGuide.tsx))
**Architecture:** [thirstee-architecture.md](thirstee-architecture.md)

Read this before adding UI. It maps the color tokens, type/spacing scales, the glass + neon language, and the component library so new screens stay consistent.

---

## 1. Visual identity in one line

> **Ultra-dark charcoal base (`#08090A`) → frosted translucent "glass" cards (white at 5–8% opacity, backdrop blur) → white primary actions → neon accents reserved for highlights, badges, and RSVP flair.** Inter for text, JetBrains Mono for mono.

This is intentionally a **single dark theme** — `:root` *is* the dark palette; there's no light mode to maintain.

---

## 2. Two sources of design tokens (know which one you're touching)

| Source | Used by | What's in it |
|---|---|---|
| [apps/web/src/index.css](../apps/web/src/index.css) `:root` | **Web** (shadcn/ui semantic tokens) | `--background`, `--card`, `--primary`, `--border`, `--btn-*`, gradients, shadows — consumed via Tailwind's `hsl(var(--token))` mapping |
| [packages/config/tailwind/base.js](../packages/config/tailwind/base.js) | **Shared / mobile** Tailwind theme | named palette (`primary`, `dark`, `neon`, `bg`, `text`, `border`, `glass`), fonts, fontSize, spacing, radius, backdropBlur, animations |

When you add a color, add it as a **token** in the right place — don't hard-code hex in components.

---

## 3. Color palette

### Semantic tokens (web, `index.css`) — values are space-separated channels for `hsl()/rgb()`:

| Token | Value | Role |
|---|---|---|
| `--bg-base` | `#08090A` | App background (ultra-dark charcoal) |
| `--bg-glass` / `--bg-glass-hover` | white @ 0.05 / 0.08 | Frosted glass surfaces |
| `--background` / `--foreground` | `#08090A` / `#FFFFFF` | base / main text |
| `--card` / `--card-hover` | white @ 0.05 / 0.08 | Glass card |
| `--primary` | `#FFFFFF` | Primary action (white) |
| `--secondary` | `~#262626` | Dark secondary surfaces |
| `--muted-foreground` | `#B3B3B3` | Subtext / metadata |
| `--accent` | `#888888` | Hover / animated glow |
| `--highlight-pink` | `#FF5E78` | RSVP pulse / chips flair |
| `--destructive` | `#FF4D4F` | Errors |
| `--success` | `#34C9AE` | Confirmation toasts (sparingly) |
| `--warning` | `#FFC542` | Low-priority alerts |
| `--border` / `--border-hover` | white @ 0.1 / 0.3 | Dividers, outlines |

**Buttons** have dedicated tokens: `--btn-primary-bg: #FFFFFF` / `--btn-primary-text: #08090A` (white button, dark text); secondary = dark bg + white text + subtle white border.

**Gradients & shadows** are tokenized too: `--gradient-primary/secondary/glass/card/hero`, `--shadow-sm/shadow/…`.

### Named palette (`tailwind/base.js`):

- `primary.50–900` — a **green** scale (`#22c55e` mid). Brand green; used where a saturated accent is wanted.
- `dark.50–900` — slate neutrals.
- `neon` — `green #00FFA3`, `blue #00D4FF`, `purple #B347FF`, `pink #FF47B3`, `orange #FF5F2E`. Reserved for **badges**, highlights, and energetic flourishes — not body UI.
- `bg` — `base #08090A`, `card #1C1817`, `hover #2A2A2A`, `glass rgba(255,255,255,0.05)`.
- `text` — `primary #FFFFFF`, `secondary #A1A1AA`, `muted #71717A`.

> Two accent stories coexist: the web semantic theme leans **white + pink/teal**, while the Tailwind palette also defines a **green** `primary` and a full **neon** set (heavily used by the badge system's `color_tier`). Pick the token that matches the surface — neon for gamification, white/glass for the core app chrome.

---

## 4. Typography, spacing, radius, blur, motion

From [packages/config/tailwind/base.js](../packages/config/tailwind/base.js):

- **Fonts:** `sans: Inter`, `mono: JetBrains Mono`.
- **Font sizes:** standard `xs`→`6xl` scale with tuned line-heights.
- **Spacing extras:** `18` (4.5rem), `88` (22rem), `128` (32rem).
- **Radius:** `xl 0.75rem`, `2xl 1rem`, `3xl 1.5rem` (cards/modals trend large-radius).
- **Backdrop blur:** `xs`(2px)→`3xl`(64px) — the core of the glass look (`backdrop-blur-md` on most cards).
- **Animations:** `fade-in`, `slide-up`, `slide-down`, `pulse-glow`, `float` (+ keyframes). Web also uses `framer-motion` for richer transitions.

---

## 5. The "glass" recipe

A typical glass card combines: translucent white background (`--card`) + `backdrop-blur` + 1px white-at-10% border + large radius + subtle shadow. There are bespoke variants:

- [GyroGlassCard.tsx](../apps/web/src/components/GyroGlassCard.tsx) — glass card with gyroscope/pointer-reactive tilt + glow.
- `glass` color tokens (`glass.light/dark`) for quick translucent fills.

Skeleton/loading states use the same glass language — see [SkeletonLoaders.tsx](../apps/web/src/components/SkeletonLoaders.tsx) and [thirstee-skeleton-preloaders.md](../thirstee-skeleton-preloaders.md).

---

## 6. Component library

### Primitives — shadcn/ui ([apps/web/src/components/ui/](../apps/web/src/components/ui/))

`alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `command`, `dialog`, `dropdown-menu`, `form`, `hover-card`, `input`, `label`, `popover`, `scroll-area`, `select`, `sheet`, `skeleton`, `switch`, `tabs`, `textarea`. Built on Radix UI + `class-variance-authority` + `tailwind-merge` (`cn()` helper in [utils.ts](../apps/web/src/lib/utils.ts)).

### Composed app components (selected — [apps/web/src/components/](../apps/web/src/components/))

| Area | Components |
|---|---|
| Layout/nav | [Navbar](../apps/web/src/components/Navbar.tsx), [PageWrapper](../apps/web/src/components/PageWrapper.tsx) / [RobustPageWrapper](../apps/web/src/components/RobustPageWrapper.tsx), [CommandMenu](../apps/web/src/components/CommandMenu.tsx) (⌘K) |
| Events | [EventCard](../apps/web/src/components/EventCard.tsx) / [EnhancedEventCard](../apps/web/src/components/EnhancedEventCard.tsx), [EventForm](../apps/web/src/components/EventForm.tsx), [EventTabs](../apps/web/src/components/EventTabs.tsx), [EventTimeline](../apps/web/src/components/EventTimeline.tsx), [DashboardHero](../apps/web/src/components/DashboardHero.tsx) / [EnhancedHero](../apps/web/src/components/EnhancedHero.tsx) |
| People | [UserAvatar](../apps/web/src/components/UserAvatar.tsx), [AvatarStack](../apps/web/src/components/AvatarStack.tsx), [UserHoverCard](../apps/web/src/components/UserHoverCard.tsx), [ClickableUserAvatar](../apps/web/src/components/ClickableUserAvatar.tsx) |
| Maps | [InteractiveMap](../apps/web/src/components/InteractiveMap.tsx), [StaticMapThumbnail](../apps/web/src/components/StaticMapThumbnail.tsx), [GoogleLocationPicker](../apps/web/src/components/GoogleLocationPicker.tsx) |
| Gamification | [BadgeCard](../apps/web/src/components/BadgeCard.tsx), [BadgeIcon](../apps/web/src/components/BadgeIcon.tsx), [LiveBadge](../apps/web/src/components/LiveBadge.tsx), [ProgressAnalysisPanel](../apps/web/src/components/ProgressAnalysisPanel.tsx) |
| Feedback | [LoadingSpinner](../apps/web/src/components/LoadingSpinner.tsx), [SkeletonLoaders](../apps/web/src/components/SkeletonLoaders.tsx), `sonner` toasts, [StarRating](../apps/web/src/components/StarRating.tsx) |

Some components ship co-located mini-docs (`.md`): [EventTabs.md](../apps/web/src/components/EventTabs.md), [ReviewsPanel.md](../apps/web/src/components/ReviewsPanel.md).

### Mobile

Mobile uses **NativeWind 4** (Tailwind for RN) with the same [tailwind/base.js](../packages/config/tailwind/base.js) tokens and `@expo/vector-icons`. Components live in [apps/mobile/src/components/](../apps/mobile/src/components/); see [MOBILE_COMPONENTS_LIBRARY.md](../MOBILE_COMPONENTS_LIBRARY.md).

---

## 7. Rules for adding UI

1. **Use a token, not a literal.** New color → add to `index.css` (web semantic) and/or `tailwind/base.js` (named/mobile).
2. **Reach for a shadcn primitive first**; compose, don't fork.
3. **Glass for surfaces, white for primary actions, neon only for badges/flair.**
4. **Large radius + backdrop-blur** keeps cards on-brand.
5. **Verify on the `/style-guide` route** after changes.
6. **Keep web + mobile token parity** — if a token only exists in one place, note why.
