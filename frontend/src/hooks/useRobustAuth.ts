import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface RobustAuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isReady: boolean
  error: string | null
  userId: string | null
}

/**
 * Robust auth hook that handles race conditions and provides reliable auth state
 * This hook ensures auth state is properly initialized before allowing data fetching
 */
export function useRobustAuth(): RobustAuthState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || !mountedRef.current) return
    
    initializingRef.current = true
    
    try {
      // Get session first (faster than getUser)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (mountedRef.current) {
        setUser(session?.user || null)
        setError(null)
        setIsLoading(false)
        setIsReady(true)
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Authentication error')
        setUser(null)
        setIsLoading(false)
        setIsReady(true)
      }
    } finally {
      initializingRef.current = false
    }
  }, [])

  useEffect(() => {
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      // Handle auth state changes
      const newUser = session?.user || null
      
      setUser(newUser)
      setError(null)
      setIsLoading(false)
      setIsReady(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth])

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isReady,
    error,
    userId: user?.id || null
  }
}

/**
 * Hook for components that require authentication
 * Provides additional safety checks and retry logic
 */
export function useRequiredAuth() {
  const auth = useRobustAuth()
  const [hasRetried, setHasRetried] = useState(false)

  // Retry auth initialization if it fails the first time
  useEffect(() => {
    if (auth.isReady && !auth.user && !auth.error && !hasRetried) {
      setHasRetried(true)
      // Wait a bit and check session again
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            // Force a re-initialization
            window.location.reload()
          }
        } catch (error) {
          console.error('Auth retry failed:', error)
        }
      }, 1000)
    }
  }, [auth.isReady, auth.user, auth.error, hasRetried])

  return {
    ...auth,
    shouldRender: auth.isReady && auth.isAuthenticated,
    shouldRedirect: auth.isReady && !auth.isAuthenticated && !auth.error
  }
}

/**
 * Hook for components that work with optional authentication
 * Waits for auth to be ready but allows rendering regardless of auth state
 */
export function useOptionalAuth() {
  const auth = useRobustAuth()

  return {
    ...auth,
    shouldRender: auth.isReady,
    canFetchData: auth.isReady
  }
}

/**
 * Hook for data fetching that depends on auth state
 * Provides safe user context and prevents premature data fetching
 */
export function useAuthForDataFetching() {
  const auth = useRobustAuth()
  const [isDataReady, setIsDataReady] = useState(false)

  useEffect(() => {
    // Only allow data fetching when auth is fully ready
    if (auth.isReady && !auth.isLoading) {
      setIsDataReady(true)
    }
  }, [auth.isReady, auth.isLoading])

  return {
    user: auth.user,
    userId: auth.userId,
    isAuthenticated: auth.isAuthenticated,
    isAuthReady: auth.isReady,
    canFetchData: isDataReady,
    error: auth.error
  }
}

/**
 * Utility function to get current user safely
 * Use this in event handlers and other non-hook contexts
 */
export async function getCurrentUserSafe(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Utility function to check if user is authenticated
 * Use this for quick auth checks without hooks
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}
