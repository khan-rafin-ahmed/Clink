import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useDataFetching } from '@/hooks/useDataFetching'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

interface UseAuthStateReturn {
  authState: AuthState
  user: any
  error: string | null
  isReady: boolean
}

/**
 * Enhanced auth state hook that provides clear states for conditional rendering
 * Prevents components from rendering before auth state is determined
 */
export function useAuthState(): UseAuthStateReturn {
  const { user, loading, error, isInitialized } = useAuth()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!mountedRef.current) return

    // Don't update state until auth is fully initialized
    if (!isInitialized) {
      setAuthState('loading')
      return
    }

    if (error) {
      setAuthState('error')
    } else if (loading) {
      setAuthState('loading')
    } else if (user) {
      setAuthState('authenticated')
    } else {
      setAuthState('unauthenticated')
    }
  }, [user, loading, error, isInitialized])

  return {
    authState,
    user,
    error,
    isReady: isInitialized && authState !== 'loading'
  }
}

/**
 * Hook for pages that require authentication
 * Returns null until auth state is determined and user is authenticated
 * Automatically handles redirects and error states
 */
export function useRequireAuth() {
  const { authState, user, error } = useAuthState()

  return {
    user: authState === 'authenticated' ? user : null,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    error: authState === 'error' ? error : null,
    shouldRender: authState === 'authenticated',
    authState
  }
}

/**
 * Hook for pages that work with or without authentication
 * Returns auth state but allows rendering regardless
 * Waits for auth initialization to complete before allowing render
 */
export function useOptionalAuth() {
  const { authState, user, error } = useAuthState()

  return {
    user: authState === 'authenticated' ? user : null,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    error: authState === 'error' ? error : null,
    shouldRender: authState !== 'loading', // Render when auth state is determined
    authState
  }
}

/**
 * Enhanced hook for data fetching that depends on auth state
 * Prevents any data fetching until auth is fully initialized
 * Handles both authenticated and public data scenarios
 */
export function useAuthDependentData<T>(
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
  const { user, shouldRender, authState } = useOptionalAuth()
  const {
    requireAuth = false,
    enabled = true,
    ...fetchOptions
  } = options

  // Determine if we should fetch data
  const shouldFetch = useMemo(() => {
    // Never fetch if disabled
    if (!enabled) return false

    // Never fetch if auth isn't ready
    if (!shouldRender) return false

    // If auth is required, only fetch when user exists
    if (requireAuth && authState !== 'authenticated') return false

    // For public data, fetch once auth state is determined
    return true
  }, [enabled, shouldRender, requireAuth, authState])

  // Use existing useDataFetching hook with auth-aware conditions
  const result = useDataFetching(() => fetchFunction(user), {
    ...fetchOptions,
    immediate: shouldFetch,
    dependencies: [shouldFetch, user?.id]
  })

  return {
    ...result,
    isAuthReady: shouldRender,
    authState,
    user,
    // Override loading to include auth loading
    isLoading: !shouldRender || result.isLoading
  }
}
