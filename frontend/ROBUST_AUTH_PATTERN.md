# Robust Supabase + React + Vite Auth Pattern

This document provides the recommended pattern for implementing robust authentication and data fetching in your Thirstee app that prevents 404 errors on hard refresh and handles all edge cases.

## 🎯 Problem Solved

- ✅ **Hard refresh support** - No more 404 errors when refreshing pages
- ✅ **Direct URL access** - All routes work when accessed directly
- ✅ **Proper loading states** - Shows skeletons while auth initializes
- ✅ **Error recovery** - Graceful error handling with retry functionality
- ✅ **Auth state management** - Waits for `supabase.auth.getSession()` to complete

## 🏗️ Architecture Overview

### 1. Enhanced Auth Hooks (`useAuthState.ts`)
- `useOptionalAuth()` - For public pages that work with/without auth
- `useRequireAuth()` - For protected pages that require authentication
- `useAuthDependentData()` - For data fetching that depends on auth state

### 2. Page Wrapper (`PageWrapper.tsx`)
- `RobustPageWrapper` - Handles auth state, loading, and errors
- Prevents rendering until auth is fully initialized
- Automatic redirects for protected pages

### 3. Consistent Page Pattern
Every page follows the same structure for reliability.

## 📋 Implementation Patterns

### Pattern 1: Public Page (works with or without auth)

```typescript
// Example: Discover.tsx
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'

// 1. Data loading function (outside component)
const loadPageData = async (user: any) => {
  // Your API calls here
  // user will be null if not authenticated, or user object if authenticated
  return await fetchPublicData(user)
}

// 2. Content component
function PageContent() {
  const fetchData = useCallback(async (user: any) => {
    return loadPageData(user)
  }, [])

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useAuthDependentData(fetchData, {
    requireAuth: false, // Public page - doesn't require auth
    onSuccess: (data) => console.log('Data loaded:', data),
    onError: (error) => toast.error('Failed to load data'),
    retryCount: 2,
    retryDelay: 1000
  })

  if (isLoading) return <FullPageSkeleton />
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />

  return <div>{/* Your page content */}</div>
}

// 3. Main export
export function PageName() {
  return (
    <RobustPageWrapper requireAuth={false}>
      <PageContent />
    </RobustPageWrapper>
  )
}
```

### Pattern 2: Protected Page (requires authentication)

```typescript
// Example: Events.tsx, Profile.tsx
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'

// 1. Data loading function (outside component)
const loadUserData = async (user: any) => {
  if (!user) throw new Error('Authentication required')

  // Your authenticated API calls here
  return await fetchUserSpecificData(user.id)
}

// 2. Content component
function ProtectedPageContent() {
  const fetchData = useCallback(async (user: any) => {
    return loadUserData(user)
  }, [])

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    user
  } = useAuthDependentData(fetchData, {
    requireAuth: true, // Protected page - requires auth
    onSuccess: (data) => console.log('User data loaded:', data),
    onError: (error) => toast.error('Failed to load user data')
  })

  if (isLoading) return <FullPageSkeleton />
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />

  return <div>{/* Your protected content */}</div>
}

// 3. Main export
export function ProtectedPageName() {
  return (
    <RobustPageWrapper requireAuth={true}>
      <ProtectedPageContent />
    </RobustPageWrapper>
  )
}
```

### Pattern 3: Simple Page (no data fetching)

```typescript
// Example: Static pages, forms
import { RobustPageWrapper } from '@/components/PageWrapper'

function SimplePageContent() {
  // Your page logic here
  return <div>{/* Your content */}</div>
}

export function SimplePageName() {
  return (
    <RobustPageWrapper requireAuth={false}> {/* or true for protected */}
      <SimplePageContent />
    </RobustPageWrapper>
  )
}
```

## 🔧 Key Benefits

### ✅ Auth State Flow
```
Page Load → Auth Loading → Auth Ready → Data Fetching → Content Render
     ↓           ↓            ↓             ↓              ↓
   Show      Show         Check        Show           Show
  Nothing   Skeleton    Requirements  Skeleton      Content
```

### ✅ Error Handling
- Network errors → Show retry button
- Auth errors → Redirect to login
- 404/null data → Show empty state
- Component errors → Error boundary

### ✅ Loading States
- Auth loading → `FullPageSkeleton`
- Data loading → Page-specific skeleton
- Action loading → Button spinners

## 🚀 Migration Guide

To migrate existing pages:

1. **Replace manual auth checks** with `useAuthDependentData`
2. **Wrap with `RobustPageWrapper`** instead of manual error boundaries
3. **Move data fetching** outside component to prevent re-renders
4. **Use consistent loading/error states** with provided components

## 🔧 Real Examples from Thirstee

### ✅ Discover Page (Public + Auth-Optional)
```typescript
// frontend/src/pages/Discover.tsx
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'

const loadEventsData = async (currentUser: any = null): Promise<EventWithCreator[]> => {
  const publicEvents = await getPublicEvents()
  // ... rest of data loading logic
  return eventsWithCreators
}

function DiscoverContent() {
  const fetchEventsData = useCallback(async (currentUser: any): Promise<EventWithCreator[]> => {
    return loadEventsData(currentUser)
  }, [])

  const { data: events, isLoading, isError, error, refetch } = useAuthDependentData(
    fetchEventsData,
    {
      requireAuth: false, // Public page
      onSuccess: (data) => console.log('✅ Events loaded:', data?.length),
      onError: (error) => toast.error('Failed to load events'),
      retryCount: 2,
      retryDelay: 1000
    }
  )

  if (isLoading) return <FullPageSkeleton />
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />

  return <div>{/* Page content */}</div>
}

export function Discover() {
  return (
    <RobustPageWrapper requireAuth={false}>
      <DiscoverContent />
    </RobustPageWrapper>
  )
}
```

### ✅ Events Page (Protected)
```typescript
// frontend/src/pages/Events.tsx
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'

const loadEventsData = async (user: any): Promise<Event[]> => {
  if (!user) throw new Error('User authentication required')

  const data = await getUserAccessibleEvents()
  return data || []
}

function EventsContent() {
  const fetchEventsData = useCallback(async (user: any): Promise<Event[]> => {
    return loadEventsData(user)
  }, [])

  const { data: events, isLoading, isError, error, refetch, user } = useAuthDependentData(
    fetchEventsData,
    {
      requireAuth: true, // Protected page
      onSuccess: (data) => console.log('✅ Events loaded:', data?.length),
      onError: (error) => toast.error('Failed to load events')
    }
  )

  if (isLoading) return <FullPageSkeleton />
  if (isError) return <ErrorFallback error={error} onRetry={refetch} />

  return <div>{/* Protected content */}</div>
}

export function Events() {
  return (
    <RobustPageWrapper requireAuth={true}>
      <EventsContent />
    </RobustPageWrapper>
  )
}
```

## 📝 Notes

- Always use `useCallback` for fetch functions to prevent infinite re-renders
- Place data loading functions outside components for stability
- Use `requireAuth: true` for protected pages, `false` for public pages
- The pattern automatically handles redirects, loading states, and errors
- Test hard refresh on all pages to ensure no 404 errors
- Use browser dev tools to verify auth state is properly initialized
