---
# 🧪 Thirstee – Phase 4: UI/UX Revamp PRD

## 🎯 Objective

Revamp the entire Thirstee user interface to align with a clean, minimalistic aesthetic inspired by **Luma** while leveraging Apple's **Liquid Glass (glassmorphism)** design principles. The experience should be:

- Visually elegant and futuristic
- Fluid, with seamless micro-interactions and transitions
- Primarily dark mode with vibrant accents and frosted transparency
- Fully mobile-first and responsive

---

## 🎨 Visual Language & Design Tokens

### ✨ Style Principles

- Dark Mode (Elegant, semi-translucent, layered depth)
- Frosted glass panels (Apple Vision Pro inspired)
- Bright, dynamic lighting with subtle reflections
- Glass panels that subtly react to touch and motion
- Elements float with depth: shadows, layered opacity, 3D feel
- Smooth 3D micro-animations on touch & scroll
- Minimalist UI (reduced text, icon-driven)
- Emoji integrations for casual/fun tone where appropriate
- Breath effect on blur: intensifies when idle
- Drink splash ripple on RSVP tap
- Glass cracking sound on login errors

### 🖍️ Color Palette (Draft)

| Token                | Color                    | Notes                                              |
| -------------------- | ------------------------ | -------------------------------------------------- |
| `--bg-base`          | `#08090A`                | Ultra-dark charcoal, main app background           |
| `--bg-glass`         | `rgba(255,255,255,0.05)` | Frosted glass layer with backdrop blur             |
| `--accent-primary`   | `#FFFFFF`                | White(cool highlight for active elements)    |
| `--accent-secondary` | `#888888`                | Gray (used for hover, animated state glow) |
| `--text-primary`     | `#FFFFFF`                | Main text, headings, icons                         |
| `--text-secondary`   | `#B3B3B3`                | Subtext, metadata, supporting copy                 |
| `--border-subtle`    | `rgba(255,255,255,0.1)`  | For outlines, dividers, and subtle button borders  |
| `--btn-primary-bg`   | `#FFFFFF`           | Grey text on white background 
| `--btn-primary-text` | `#888888`                | White text on primary buttons                      |
| `--btn-secondary-bg` | `#07080A`                | For secondary buttons
| `--btn-secondary-text` | `#FFFFFF`                | For secondary buttons text    
| `--error`            | `#FF4D4F`                | Warnings, validation errors                        |

---

## 🧱 Page-by-Page Breakdown

### 1. Landing Page
- Animated Thirstee logo with glass backdrop
- CTA: Join a Crew / Host a Party
- Swiping background video loop (low-opacity drink animations)

### 2. Login / Signup Flow
- Glass modal cards
- Slide transition between login and sign-up
- Face ID / Apple Sign-In priority
- Glass cracking animation for failed logins

### 3. Home Feed
- Event Cards with layered glass and hover tilt
- Depth transforms: subtle card tilt + shadows
- “What’s Hot” trending crew strip (scrollable)
- Filter + sort bar with subtle glow
- Scroll-based fade-ins

### 4. Event Detail
- Header with blur on scroll
- RSVP button = animated pulse + drink splash ripple
- Attendee avatars in floating carousel
- Vibe Tags: glassy chips with icons (🔥, 🧊, 🎉)

### 5. Create Event Flow
- Multi-step wizard (3 steps) with progress indicators
- Each step in a floating modal card with glassmorphism
- Custom Vibe Picker with emoji + color gradient
- Performance-optimized (no heavy transitions)
- Stone Cold Steve Austin tone in copy

### 5.1. Create Crew Flow
- Multi-step wizard (2 steps) following same design pattern as Create Event
- Step 1: Basic Info (Name, Description, Vibe selection)
- Step 2: Settings & Members (Visibility, Member invitations)
- Consistent glassmorphism styling and responsive design
- Same navigation pattern with Back/Next buttons

### 6. Profile Page
- User avatar in glowing glass ring (gyro-reactive tilt)
- Clink Score + # of parties attended
- Bio + social link icons
- “Delete Profile” in glass-danger zone (shatters on press 🧨)

### 7. Edit Profile
- Editable fields in soft panels
- Age gate input field (age ≥ 19 required)
- Upload photo + emoji bio

### 8. Crew Page
- Crew avatar stack with floating invite buttons
- Invite code modal (copyable with animation)
- Crew history timeline (past events)

### 9. Notifications
- Push style toasts with bounce animation
- Notification center page with stacked glass panels
- Activity grouped by type (Invites, Comments, Crews)
- Animated "New" indicator (pulse dot on tab icon)
- Swipe-to-clear gesture on each notification item
- Sound/haptic feedback on new toast (optional)
- Deep linking to event/crew/profile on tap

### 10. Bottom Navigation
- Glass pill-style nav
- Icon transitions: subtle glow on active, bounce tap
- Active nav item lifts with hover shadow

### 11. Settings Page
- Toggle switches (glass sliders)
- Options: Age gate, Privacy, Logout, Delete Account

### 12. Error / Empty States
- Animated glass bubbles with sad emoji and retry
- “You’re all caught up!” = confetti particle animation

---

## 🧩 Additional Components

| Component   | Notes                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Modal Cards | All modals follow same translucent card system with multi-step flow   |
| Buttons     | Glass with soft neon glow, no heavy transitions for performance       |
| Emoji Chips | Used for tags, vibes, reactions                                       |
| Toasts      | Appear from top with haptic pop and shadow                            |
| Form Fields | Semi-translucent fields, focused state glows                          |
| 3D Elements | Optional 3D avatars or drink icons with Spline or device gyro tilt    |
| Step Progress | Horizontal progress bars for multi-step modals (Create Event/Crew)   |

---

## ⚡ Performance Optimizations

### Comprehensive Animation Removal
- **Eliminated `transition-all` classes** throughout the app for better performance
- **Removed heavy transforms**: `scale`, `rotate`, `translate` animations
- **Simplified hover effects** to essential feedback only (box-shadow, border-color)
- **Removed performance-heavy CSS animations**: `shimmer`, `pulse-glow`, `float`, `breathe`, `tilt`
- **Disabled modal transitions** that caused visual quality issues
- **Removed 3D transforms** from GyroGlassCard and other components
- **Eliminated excessive keyframe animations** from Tailwind config

### Specific Components Optimized
- **LoginPage**: Removed logo scaling, background pulse animations, button transforms
- **ProfileInfoCard**: Removed shimmer effect and heavy 3D transforms
- **HomePage**: Removed floating glass elements animations, card hover lifts
- **EventCard**: Simplified hover states, removed scale animations
- **Navbar**: Removed avatar scaling, button transforms, dropdown animations
- **UserProfile**: Removed slide-up animations, button transforms, background floaters
- **Discover**: Removed search animations, filter button transforms
- **CrewCard**: Simplified hover effects, removed scale animations

### Preserved Essential UX
- **Maintained subtle hover effects** for interactive feedback (shadows, borders)
- **Kept loading states** and progress indicators for user feedback
- **Preserved accessibility** focus states and keyboard navigation
- **Maintained glassmorphism effects** without heavy animations
- **Kept essential transitions** for modal open/close and tab switching

---

## 🚀 Goals & Milestones

| Milestone | Deliverables                                  |
| --------- | --------------------------------------------- |
| Week 1    | Landing + Login UI revamp (design + frontend) |
| Week 2    | Home Feed + Event Cards complete              |
| Week 3    | Profile & Event Detail pages                  |
| Week 4    | Finalize Create Event flow, test transitions  |
| Week 5    | Remaining components + polish + animations    |

---

## 🔧 Tools & Stack

- **Tailwind CSS** (with custom tokens)
- **shadcn/ui** for base components
- **Framer Motion + React Spring** for animations
- **Supabase** backend
- **Three.js / Spline** (optional) for 3D accents and movement

---

## 🔍 QA Checklist (to follow later)

- Responsiveness  
- Transition smoothness  
- Tap targets & micro animations  
- Blur depth consistency  
- Accessibility contrast check  
- Motion behavior (gyro, hover, animation feedback)

---

> Ready to be versioned and dropped into `docs/uiux-phase-4.md`
