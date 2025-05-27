import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'

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
 */
export function useRequireAuth() {
  const { authState, user, error } = useAuthState()

  return {
    user: authState === 'authenticated' ? user : null,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    error: authState === 'error' ? error : null,
    shouldRender: authState === 'authenticated'
  }
}

/**
 * Hook for pages that work with or without authentication
 * Returns auth state but allows rendering regardless
 */
export function useOptionalAuth() {
  const { authState, user, error } = useAuthState()

  return {
    user: authState === 'authenticated' ? user : null,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    error: authState === 'error' ? error : null,
    shouldRender: authState !== 'loading' // Render when auth state is determined
  }
}
