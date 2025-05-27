import { ReactNode, Suspense } from 'react'
import { useAuthState } from '@/hooks/useAuthState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface RobustPageWrapperProps {
  children: ReactNode
  requireAuth?: boolean
  fallbackSkeleton?: ReactNode
  onAuthError?: () => void
  title?: string
  description?: string
}

/**
 * Robust page wrapper that handles all auth states and loading scenarios
 * Prevents rendering until auth is fully initialized
 * Handles hard refresh, direct access, and navigation scenarios
 */
export function RobustPageWrapper({
  children,
  requireAuth = false,
  fallbackSkeleton,
  onAuthError
}: RobustPageWrapperProps) {
  const { authState, error, isReady } = useAuthState()
  const navigate = useNavigate()

  // Show loading skeleton until auth is fully determined
  if (!isReady) {
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

  // Handle auth requirement
  if (requireAuth && authState !== 'authenticated') {
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname)

    if (onAuthError) {
      onAuthError()
    } else {
      toast.error('Please sign in to access this page')
      navigate('/login')
    }

    return <FullPageSkeleton />
  }

  // Render children when everything is ready
  return (
    <ErrorBoundary>
      <Suspense fallback={fallbackSkeleton || <FullPageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}


