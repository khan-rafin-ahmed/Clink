import { ReactNode, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequireAuth, useOptionalAuth } from '@/hooks/useAuthState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
import { toast } from 'sonner'

interface PageWrapperProps {
  children: ReactNode
  requireAuth?: boolean
  fallbackSkeleton?: ReactNode
}

/**
 * Robust page wrapper that handles all auth states and loading scenarios
 * Prevents rendering until auth is fully initialized
 * Handles hard refresh, direct access, and navigation scenarios
 *
 * Usage:
 * - For public pages: <PageWrapper>{content}</PageWrapper>
 * - For protected pages: <PageWrapper requireAuth>{content}</PageWrapper>
 */
export function PageWrapper({
  children,
  requireAuth = false,
  fallbackSkeleton
}: PageWrapperProps) {
  const navigate = useNavigate()

  // Use appropriate auth hook based on requirements
  const authHook = requireAuth ? useRequireAuth() : useOptionalAuth()
  const { shouldRender, authState, error } = authHook

  // Show loading skeleton until auth is fully determined
  if (!shouldRender) {
    return fallbackSkeleton || <FullPageSkeleton />
  }

  // Handle auth errors
  if (authState === 'error') {
    return (
      <ErrorFallback
        error={error || 'Authentication error'}
        onRetry={() => {
          window.location.reload()
        }}
        title="Authentication Error"
        description="There was a problem with authentication. Please try again."
      />
    )
  }

  // Handle auth requirement for protected pages
  if (requireAuth && authState !== 'authenticated') {
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname)

    toast.error('Please sign in to access this page')
    navigate('/login')

    return <FullPageSkeleton />
  }

  // Render children when auth state is ready
  return <>{children}</>
}

/**
 * Enhanced page wrapper with error boundary and suspense
 * This is the recommended wrapper for all pages
 */
export function RobustPageWrapper(props: PageWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={props.fallbackSkeleton || <FullPageSkeleton />}>
        <PageWrapper {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Hook for pages that need to fetch data after auth is ready
 * Combines auth state management with data fetching
 *
 * Usage:
 * const { data, isLoading, error, refetch } = usePageData(
 *   async (user) => fetchMyData(user),
 *   { requireAuth: true }
 * )
 */
export function usePageData<T>(
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
  const { requireAuth = false } = options

  // Use appropriate auth hook
  const authHook = requireAuth ? useRequireAuth() : useOptionalAuth()
  const { shouldRender, authState } = authHook

  // Only fetch data when auth is ready and requirements are met
  const shouldFetch = shouldRender && (!requireAuth || authState === 'authenticated')

  // Import and use the enhanced auth-dependent data fetching
  const { useAuthDependentData } = require('@/hooks/useAuthState')

  return useAuthDependentData(fetchFunction, {
    ...options,
    requireAuth,
    enabled: shouldFetch
  })
}
