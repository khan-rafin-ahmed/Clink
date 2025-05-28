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
  const { user, loading, isInitialized } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect after auth is fully initialized and we have a user
    if (isInitialized && !loading && user) {
      console.log('🔄 Redirecting authenticated user to:', redirectTo)
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, isInitialized, navigate, redirectTo])

  // Show children while loading or if not authenticated
  return <>{children}</>
}
