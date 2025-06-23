import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

interface AuthRedirectProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Component that redirects authenticated users to a different page
 * Used to redirect logged-in users away from public pages like home/login
 */
export function AuthRedirect({ children, redirectTo = '/profile' }: AuthRedirectProps) {
  const navigate = useNavigate()

  // Add error boundary for auth context
  let authState
  try {
    authState = useAuth()
  } catch (error) {
    console.error('AuthRedirect: useAuth failed - AuthProvider may not be mounted yet:', error)
    // Fallback: render children without redirect if auth context fails
    // This prevents the app from crashing during initial load
    return <>{children}</>
  }

  const { user, loading, isInitialized } = authState

  useEffect(() => {
    // Only redirect after auth is fully initialized and we have a user
    if (isInitialized && !loading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, isInitialized, navigate, redirectTo])

  // Show children while loading or if not authenticated
  return <>{children}</>
}
