# Thirstee Skeleton & Preloader Components Architecture

## Overview

This document catalogs all skeleton loading states and preloader components implemented throughout the Thirstee app. The loading system follows the app's glassmorphism design system with consistent styling, animations, and responsive behavior.

## Table of Contents

1. [Skeleton Component Inventory](#skeleton-component-inventory)
2. [Implementation Patterns](#implementation-patterns)
3. [Component Details](#component-details)
4. [Design System Integration](#design-system-integration)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)

---

## Skeleton Component Inventory

### Core Skeleton Components

| Component | File Path | Usage Context |
|-----------|-----------|---------------|
| `SkeletonBox` | `frontend/src/components/SkeletonLoaders.tsx` | Base skeleton building block with shimmer effect |
| `Skeleton` | `frontend/src/components/ui/skeleton.tsx` | Primitive skeleton component from UI library |
| `LoadingSpinner` | `frontend/src/components/LoadingSpinner.tsx` | Enhanced glass spinner with multiple sizes |
| `FullScreenLoader` | `frontend/src/components/LoadingSpinner.tsx` | Full-screen loading with glassmorphism effects |

### Page-Level Skeletons

| Component | File Path | Usage Context |
|-----------|-----------|---------------|
| `FullPageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Generic page loading state (fallback) |
| `DiscoverPageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Discover page with view mode switching (list/grid) |
| `UserProfilePageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | User profile page with two-column layout |
| `CrewDetailPageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Crew detail page with member lists and actions |
| `ProfilePageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Basic profile page layout |
| `EnhancedProfilePageSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Advanced profile with glass effects and animations |

### Event-Related Skeletons

| Component | File Path | Usage Context |
|-----------|-----------|---------------|
| `EventCardSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Event cards with variants (default, featured, compact) |
| `EventsGridSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Grid layout for multiple event cards |
| `EventDetailSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Event detail page with two-column layout |
| `SessionCardSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Individual session/event cards |

### UI Component Skeletons

| Component | File Path | Usage Context |
|-----------|-----------|---------------|
| `ProfileSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | User profile header section |
| `PageHeaderSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Page title and subtitle areas |
| `FilterControlsSkeleton` | `frontend/src/components/SkeletonLoaders.tsx` | Search and filter controls |

### Error & Fallback Components

| Component | File Path | Usage Context |
|-----------|-----------|---------------|
| `ErrorFallback` | `frontend/src/components/SkeletonLoaders.tsx` | Error state with retry functionality |

---

## Implementation Patterns

### 1. Glassmorphism Loading Design

The skeleton system integrates seamlessly with Thirstee's glassmorphism design:

- **Glass Cards**: Use `glass-modal` and `glass-card` classes for container skeletons
- **Shimmer Effects**: Custom shimmer animations with glass-like transparency
- **Backdrop Blur**: Consistent `backdrop-filter` usage for depth
- **Glass Overlays**: Gradient overlays for enhanced glass effects

### 2. Animation Patterns

#### Shimmer Animation
```css
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200px 100%;
}
```

#### Pulse Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 3. Responsive Skeleton Patterns

- **Mobile-First**: Skeletons adapt to different screen sizes
- **Conditional Rendering**: Different skeleton variants based on viewport
- **Touch-Friendly**: Minimum 44px touch targets maintained in skeletons

### 4. State Management Patterns

#### Data Fetching Hook Integration
```typescript
const { data, isLoading, error } = useDataFetching(fetchFunction)

if (isLoading) return <EventCardSkeleton />
if (error) return <ErrorFallback onRetry={refetch} />
return <EventCard data={data} />
```

---

## Component Details

### SkeletonBox
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Props**:
- `className?: string` - Additional CSS classes
- `shimmer?: boolean` - Enable/disable shimmer effect (default: true)
- `...props` - Additional HTML attributes

**Usage**: Base building block for all skeleton elements

**Visual Description**: Rounded rectangle with optional shimmer animation, uses `bg-muted` background

### EventCardSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Props**:
- `variant?: 'default' | 'featured' | 'compact'` - Card layout variant

**Usage**: 
- Discover page event listings
- Event grids and search results
- Featured event highlights

**Visual Description**: 
- **Default**: Full event card with hero image, badges, content, and action buttons
- **Featured**: Enhanced version with ring border and larger dimensions
- **Compact**: Horizontal layout with smaller image and condensed info

### LoadingSpinner
**File**: `frontend/src/components/LoadingSpinner.tsx`

**Props**:
- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `className?: string` - Additional CSS classes
- `text?: string` - Loading text (default: "Loading...")
- `showLogo?: boolean` - Display Thirstee logo

**Usage**:
- Button loading states
- Modal loading overlays
- Inline loading indicators

**Visual Description**: Enhanced glass spinner with multiple rings, glow effects, and optional logo

### FullScreenLoader
**File**: `frontend/src/components/LoadingSpinner.tsx`

**Props**:
- `text?: string` - Loading message
- `showLogo?: boolean` - Display logo (default: true)

**Usage**:
- Page transitions
- Authentication loading
- Initial app loading

**Visual Description**: Full-screen overlay with floating glass elements, animated background, and centered spinner

### EventDetailSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Usage**:
- Event detail page loading
- Individual event view

**Visual Description**:
- **Hero Section**: Event status badges, title, and date/time
- **Mobile Layout**: Stacked vertical layout with CTA, cover image, event info, attendees, and description
- **Desktop Layout**: Two-column layout (7/5 split) with left column for primary content and sticky right sidebar
- **Glass Cards**: Consistent glassmorphism styling matching the actual event detail design
- **Responsive**: Different layouts for mobile and desktop with proper spacing and proportions

### ProfilePageSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Usage**:
- Profile page loading
- User profile views

**Visual Description**: Complete profile layout with avatar, info cards, stats grid, and activity tabs

### EnhancedProfilePageSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Usage**:
- Advanced profile pages
- Enhanced user experiences

**Visual Description**: Two-column layout with glassmorphism cards, shimmer overlays, and glass effects

### DiscoverPageSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Props**:
- `viewMode?: 'list' | 'grid'` - Display mode (default: 'list')

**Usage**:
- Discover page loading with view mode switching
- Events page loading (grid mode)
- Event discovery and search

**Visual Description**:
- **Page Header**: Title and subtitle skeleton
- **Search Section**: Search input with filter button
- **Filter Pills**: Horizontal row of filter option skeletons
- **Stats Row**: Results count and view toggle buttons
- **List Mode**: Timeline layout with left-side dates, timeline dots, and horizontal event cards
- **Grid Mode**: 3-column responsive grid (lg:grid-cols-3) with EventCardSkeleton components
- **Responsive**: Adapts to mobile (1 column), tablet (2 columns), desktop (3 columns)

### UserProfilePageSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Usage**:
- User profile page loading
- Public and private profile views

**Visual Description**:
- **Back Button**: Navigation skeleton
- **Two-Column Hero**: 50/50 split with glassmorphism cards
- **Left Column**: Avatar, name, bio, stats with glass effects and shimmer overlays
- **Right Column**: Action buttons and call-to-action cards
- **Activity Tabs**: Tab headers and content area skeletons
- **Responsive**: Stacks vertically on mobile, side-by-side on desktop

### CrewDetailPageSkeleton
**File**: `frontend/src/components/SkeletonLoaders.tsx`

**Usage**:
- Crew detail page loading
- Crew management interface

**Visual Description**:
- **Header**: Back button and navigation
- **Crew Info Card**: Name, vibe badges, description, member count with action buttons
- **Pending Requests**: List of pending member requests with approve/deny actions
- **Members List**: Grid of current members with avatars, names, and management options
- **Glass Cards**: Consistent glassmorphism styling throughout
- **Responsive**: Adapts button layouts and spacing for mobile devices

---

## Design System Integration

### Container Width Standards

All skeleton components follow the Thirstee design system container standards:

| Component | Container Class | Usage |
|-----------|----------------|-------|
| All Page Skeletons | `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8` | Standard page container |
| Background | `bg-bg-base` | Consistent dark background (#08090A) |
| Mobile Padding | `px-4` (16px) | Mobile edge spacing |
| Tablet Padding | `sm:px-6` (24px) | Tablet responsive spacing |
| Desktop Padding | `lg:px-8` (32px) | Desktop edge spacing |
| Vertical Spacing | `py-6 sm:py-8` | 24px mobile, 32px desktop |

### Color Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#08090A` | Page background |
| `--bg-glass` | `255 255 255 / 0.05` | Glass card backgrounds |
| `--bg-muted` | Muted background | Base skeleton color |
| `--text-primary` | `#FFFFFF` | Loading text |
| `--border` | `255 255 255 / 0.1` | Skeleton borders |

### Glass Effects

#### Glass Card Pattern
```css
.glass-modal {
  backdrop-filter: var(--blur-xl);
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.06) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: var(--shadow-glass-lg);
}
```

#### Glass Shimmer Overlay
```css
.glass-shimmer-overlay {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200px 100%;
  animation: shimmer 2s infinite;
}
```

### Animation Timing

- **Shimmer Duration**: 2s infinite
- **Pulse Duration**: 1.8s ease-in-out infinite
- **Fade Transitions**: 0.3s ease
- **Glass Effects**: 0.6s ease

### Responsive Behavior

#### Mobile (< 768px)
- Simplified skeleton layouts
- Reduced animation complexity
- Touch-optimized spacing

#### Desktop (≥ 768px)
- Full skeleton details
- Enhanced glass effects
- Hover state previews

---

## Code Examples

### Basic Skeleton Usage

```tsx
import { SkeletonBox } from '@/components/SkeletonLoaders'

// Simple skeleton element
<SkeletonBox className="h-4 w-32" />

// Skeleton without shimmer
<SkeletonBox className="h-8 w-8 rounded-full" shimmer={false} />
```

### Event Card Skeleton Implementation

```tsx
import { EventCardSkeleton } from '@/components/SkeletonLoaders'

// Default event card skeleton
<EventCardSkeleton />

// Featured event skeleton
<EventCardSkeleton variant="featured" />

// Compact event skeleton for lists
<EventCardSkeleton variant="compact" />
```

### Event Detail Skeleton Implementation

```tsx
import { EventDetailSkeleton } from '@/components/SkeletonLoaders'

// Event detail page loading
function EventDetailPage() {
  const { data: event, isLoading, error } = useDataFetching(fetchEvent)

  if (isLoading) {
    return <EventDetailSkeleton />
  }

  if (error) {
    return <ErrorFallback onRetry={refetch} />
  }

  return <EventDetailContent event={event} />
}
```

### Page-Specific Skeleton Usage

```tsx
import {
  DiscoverPageSkeleton,
  UserProfilePageSkeleton,
  CrewDetailPageSkeleton
} from '@/components/SkeletonLoaders'

// Discover page loading with view mode
function DiscoverPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const { data: events, isLoading, error } = useDataFetching(fetchEvents)

  if (isLoading) {
    return <DiscoverPageSkeleton viewMode={viewMode} />
  }

  return <DiscoverContent events={events} viewMode={viewMode} />
}

// Events page loading (grid only)
function EventsPage() {
  const { data: events, isLoading, error } = useDataFetching(fetchEvents)

  if (isLoading) {
    return <DiscoverPageSkeleton viewMode="grid" />
  }

  return <EventsContent events={events} />
}

// User profile loading
function UserProfilePage() {
  const { data: profile, isLoading } = useDataFetching(fetchProfile)

  if (isLoading) {
    return <UserProfilePageSkeleton />
  }

  return <UserProfileContent profile={profile} />
}

// Crew detail loading
function CrewDetailPage() {
  const { data: crew, isLoading } = useDataFetching(fetchCrew)

  if (isLoading) {
    return <CrewDetailPageSkeleton />
  }

  return <CrewDetailContent crew={crew} />
}
```

### Loading State Pattern

```tsx
import { useDataFetching } from '@/hooks/useDataFetching'
import { EventsGridSkeleton } from '@/components/SkeletonLoaders'

function EventsPage() {
  const { data: events, isLoading, error } = useDataFetching(fetchEvents)

  if (isLoading) {
    return <EventsGridSkeleton count={6} />
  }

  if (error) {
    return <ErrorFallback onRetry={refetch} />
  }

  return <EventsGrid events={events} />
}
```

### Custom Skeleton Component

```tsx
import { SkeletonBox } from '@/components/SkeletonLoaders'
import { Card, CardContent } from '@/components/ui/card'

export function CrewCardSkeleton() {
  return (
    <Card className="interactive-card">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-6 w-32" />
            <SkeletonBox className="h-5 w-16 rounded-full" />
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-2/3" />
          </div>
          
          {/* Members */}
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Glass Loading Spinner

```tsx
import { LoadingSpinner } from '@/components/LoadingSpinner'

// Small inline spinner
<LoadingSpinner size="sm" text="Saving..." />

// Large spinner with logo
<LoadingSpinner size="lg" showLogo text="Loading your events..." />

// Full screen loader
<FullScreenLoader text="Initializing Thirstee..." />
```

### Modal Loading States

```tsx
// Crew member loading in EditCrewModal
{loadingMembers ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-white" />
    <span className="ml-2 text-muted-foreground">Loading members...</span>
  </div>
) : (
  <MemberList members={members} />
)}
```

### Notification Loading

```tsx
// NotificationBell loading state
{isLoading ? (
  <div className="flex items-center justify-center px-4 py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
  </div>
) : (
  <NotificationList notifications={notifications} />
)}
```

---

## Best Practices

### When to Use Skeleton Loaders

1. **Data Fetching**: Always show skeletons during API calls
2. **Page Transitions**: Use full-page skeletons for route changes
3. **Component Loading**: Individual component skeletons for partial updates
4. **Form Submissions**: Button spinners for user feedback

### Loading Duration Guidelines

- **Quick Actions** (< 1s): Button spinners
- **Medium Actions** (1-3s): Component skeletons
- **Long Actions** (> 3s): Full-page skeletons with progress indication

### Performance Considerations

1. **Animation Optimization**: Use CSS transforms over layout changes
2. **Reduced Motion**: Respect `prefers-reduced-motion` settings
3. **Memory Usage**: Limit concurrent skeleton animations
4. **Mobile Performance**: Simplified animations on mobile devices

### Accessibility

1. **Screen Readers**: Use `aria-label="Loading"` on skeleton containers
2. **Focus Management**: Maintain focus context during loading states
3. **Color Contrast**: Ensure skeleton elements meet contrast requirements
4. **Motion Sensitivity**: Provide reduced motion alternatives

### Consistency Rules

1. **Matching Layouts**: Skeleton dimensions should match final content
2. **Animation Timing**: Use consistent animation durations across components
3. **Glass Effects**: Apply glassmorphism consistently with design system
4. **Responsive Behavior**: Ensure skeletons adapt to all screen sizes

### Error Handling

1. **Fallback States**: Always provide error fallbacks with retry options
2. **Timeout Handling**: Show error states after reasonable timeout periods
3. **User Feedback**: Clear messaging about what went wrong
4. **Recovery Actions**: Provide actionable steps for users

---

## Additional Loading Patterns

### Authentication Loading

```tsx
// LoginPage loading state
if (loading) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-base">
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="relative flex h-screen items-center justify-center">
        <div className="text-center space-y-6 fade-in">
          <div className="relative">
            <img src="/thirstee-logo.svg" alt="Thirstee" className="h-20 w-auto mx-auto" />
            <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl"></div>
          </div>
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-accent-primary mx-auto" />
            <p className="text-lg text-muted-foreground font-medium">Loading your session...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Crew Card Loading

```tsx
// CrewCard member loading
{members.length > 0 ? (
  <AvatarStack members={members} max={5} size="sm" />
) : (
  <div className="flex items-center gap-2 text-sm" style={{ color: '#B3B3B3' }}>
    <Users className="w-4 h-4" />
    <span>Loading...</span>
  </div>
)}
```

### Data Fetching Hook Patterns

```tsx
// useDataFetching hook states
export type DataState = 'idle' | 'loading' | 'success' | 'error'

interface DataFetchingState<T> {
  data: T | null
  state: DataState
  error: string | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isEmpty: boolean
}

// Enhanced auth data fetching
export function useRobustAuthData<T>(
  fetchFunction: (user: any) => Promise<T>,
  options: {
    requireAuth?: boolean
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    retryCount?: number
    retryDelay?: number
  } = {}
) {
  // Returns enhanced state with auth loading
  return {
    ...result,
    isAuthReady: isInitialized,
    authError,
    user,
    // Override loading to include auth loading
    isLoading: !isInitialized || loading || result.isLoading
  }
}
```

---

## CSS Animation Classes

### Core Animation Classes

```css
/* Shimmer effect for skeleton elements */
.shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200px 100%;
}

/* Glass shimmer variant */
.glass-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200px 100%;
}

/* Pulse glow for LIVE badges */
.animate-pulse-glow {
  animation: pulse-glow 1.8s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(255, 95, 46, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 30px rgba(255, 95, 46, 0.6);
  }
}
```

### Glass Effect Classes

```css
/* Glass card with shimmer overlay */
.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.6s ease;
}

.glass-card:hover::before {
  left: 100%;
}

/* Glass modal shimmer overlay */
.glass-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  border-radius: inherit;
}
```

### Performance Optimized Animations

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .shimmer,
  .glass-shimmer,
  .animate-pulse-glow {
    animation: none;
  }

  .animate-pulse {
    animation: none;
    opacity: 0.7;
  }
}

/* Hardware acceleration for smooth animations */
.shimmer,
.glass-shimmer {
  transform: translateZ(0);
  will-change: background-position;
}
```

---

## Maintenance Notes

### Design System Updates
- **Color Token Changes**: Update skeleton colors when design tokens change
- **Animation Consistency**: Ensure all skeleton animations follow design system timing
- **Glass Effect Updates**: Maintain glassmorphism consistency across all skeleton components

### Performance Monitoring
- **Loading Time Tracking**: Monitor skeleton display duration and user experience
- **Animation Performance**: Track frame rates and optimize for 60fps
- **Memory Usage**: Monitor skeleton component memory footprint

### Component Audits
- **Layout Accuracy**: Regularly review skeleton dimensions against final content
- **Responsive Behavior**: Test skeleton components across all breakpoints
- **Accessibility Compliance**: Ensure skeleton components meet WCAG guidelines

### Future Enhancements

1. **Progressive Loading**: Implement progressive skeleton reveals for better UX
2. **Smart Skeletons**: Dynamic skeleton generation based on content structure
3. **Performance Metrics**: Add loading time analytics and user engagement tracking
4. **A/B Testing**: Test different skeleton patterns for optimal user experience

### Development Guidelines

1. **New Skeleton Components**: Follow established patterns and use `SkeletonBox` as base
2. **Animation Testing**: Test all animations on low-end devices
3. **Accessibility Testing**: Verify screen reader compatibility and reduced motion support
4. **Cross-Browser Testing**: Ensure skeleton animations work across all supported browsers

### Skeleton Selection Guide

#### Page-Specific Skeletons (Preferred)
- **EventDetailSkeleton**: Event detail pages with two-column layout
- **DiscoverPageSkeleton**: Discover page and Events page with search/filters and grid
- **UserProfilePageSkeleton**: User profile pages with hero section and tabs
- **CrewDetailPageSkeleton**: Crew detail pages with member management

#### Generic Skeletons (Fallback)
- **FullPageSkeleton**: Generic fallback for unknown page types or wrapper components
- **EventCardSkeleton**: Individual event cards with variants
- **EventsGridSkeleton**: Grid layouts of event cards

#### Component-Level Skeletons
- **SkeletonBox**: Base building block for custom skeletons
- **LoadingSpinner**: Button loading states and inline indicators
- **FullScreenLoader**: App initialization and major transitions

### Responsive Design Verification

#### Mobile Testing Checklist
- [ ] Skeleton layouts stack properly on mobile
- [ ] Touch targets are minimum 44px
- [ ] Animations perform well on mobile devices
- [ ] Glass effects don't cause performance issues

#### Desktop Testing Checklist
- [ ] Two-column layouts display correctly
- [ ] Sticky sidebars work as expected
- [ ] Hover states preview correctly
- [ ] Grid layouts adapt to screen size

#### Cross-Device Consistency
- [ ] Skeleton proportions match final content across devices
- [ ] Animation timing is consistent
- [ ] Glass effects maintain visual hierarchy
- [ ] Loading states transition smoothly

#### Container Width Verification
- [ ] All skeletons use `max-w-4xl` container (matching design system)
- [ ] Responsive padding follows `px-4 sm:px-6 lg:px-8` pattern
- [ ] Vertical spacing uses `py-6 sm:py-8` standard
- [ ] Background uses `bg-bg-base` for consistency
- [ ] No skeleton uses `max-w-7xl` or other non-standard widths

---

## Quick Reference

### Common Skeleton Patterns

```tsx
// Basic skeleton element
<SkeletonBox className="h-4 w-32" />

// Avatar skeleton
<SkeletonBox className="h-8 w-8 rounded-full" />

// Button skeleton
<SkeletonBox className="h-10 w-24 rounded-md" />

// Card skeleton
<Card className="interactive-card">
  <CardContent className="p-4 space-y-3">
    <SkeletonBox className="h-6 w-3/4" />
    <SkeletonBox className="h-4 w-full" />
    <SkeletonBox className="h-4 w-2/3" />
  </CardContent>
</Card>
```

### Loading State Checks

```tsx
// Standard loading pattern
if (isLoading) return <ComponentSkeleton />
if (error) return <ErrorFallback onRetry={refetch} />
return <Component data={data} />

// Auth-aware loading (use specific skeletons when possible)
if (!isAuthReady || isLoading) return <EventDetailSkeleton />
if (authError) return <AuthErrorFallback />
return <AuthenticatedComponent />

// Generic fallback (for wrappers and unknown page types)
if (!isReady) return <FullPageSkeleton />
return <PageContent />
```

---

*Last Updated: 2025-07-06*
*Version: 1.0*
*Maintained by: Thirstee Development Team*
