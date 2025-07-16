import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  error: string | null
}

/**
 * Platform-agnostic auth hook
 * Manages authentication state without UI dependencies
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isInitialized: false,
    error: null
  })

  const updateAuthState = useCallback((session: Session | null, error?: any) => {
    setState({
      user: session?.user || null,
      session,
      isLoading: false,
      isAuthenticated: !!session?.user,
      isInitialized: true,
      error: error?.message || null
    })
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          updateAuthState(session, error)
        }
      } catch (error) {
        if (mounted) {
          updateAuthState(null, error)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (mounted) {
          updateAuthState(session)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [updateAuthState])

  return state
}

/**
 * Hook for components that require authentication
 */
export function useRequiredAuth() {
  const auth = useAuth()

  return {
    ...auth,
    shouldRender: auth.isInitialized && auth.isAuthenticated,
    shouldRedirect: auth.isInitialized && !auth.isAuthenticated
  }
}

/**
 * Hook for components that work with optional authentication
 */
export function useOptionalAuth() {
  const auth = useAuth()

  return {
    ...auth,
    shouldRender: auth.isInitialized,
    canFetchData: auth.isInitialized
  }
}

/**
 * Hook for data fetching that depends on auth state
 */
export function useAuthForDataFetching() {
  const auth = useAuth()

  return {
    user: auth.user,
    userId: auth.user?.id || null,
    isAuthenticated: auth.isAuthenticated,
    isAuthReady: auth.isInitialized,
    canFetchData: auth.isInitialized && !auth.isLoading,
    error: auth.error
  }
}
