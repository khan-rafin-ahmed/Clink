import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { toast } from 'sonner'
import { signInWithGoogle as authSignInWithGoogle, signOut as authSignOut, handlePostAuthSetup, isNewUser } from './authService'

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const welcomeShownRef = useRef(new Set<string>()) // Track users who have been welcomed
  const isInitialLoadRef = useRef(true) // Track if this is the initial page load
  const userRef = useRef<User | null>(null) // Keep latest user for event checks

  // Restore welcomed users and sync across tabs so refreshes and tab switches don't trigger again
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'welcomeShownIds') {
        try {
          const ids: string[] = event.newValue ? JSON.parse(event.newValue) : []
          welcomeShownRef.current = new Set(ids)
        } catch {
          welcomeShownRef.current = new Set()
        }
      }
    }

    try {
      const stored = localStorage.getItem('welcomeShownIds')
      if (stored) {
        const ids: string[] = JSON.parse(stored)
        welcomeShownRef.current = new Set(ids)
      }
    } catch {
      // ignore parse errors
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Prevent multiple initializations
    if (initializingRef.current) return
    initializingRef.current = true

    const initializeAuth = async () => {
      try {
        // Check active sessions and sets the user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('Session error during initialization:', sessionError)
          setError(sessionError.message)
        }

        // If we have a session, ensure it's still valid and refresh if needed
        if (session) {
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at || 0

          // With 30-day sessions, refresh if expires within 24 hours (more conservative)
          if (expiresAt - now < 86400) {
            console.log('Session expires within 24 hours, attempting refresh...')
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) {
                console.warn('Session refresh failed:', refreshError)
              } else if (refreshData.session) {
                console.log('Session refreshed successfully - new expiry:', new Date(refreshData.session.expires_at! * 1000))
              }
            } catch (refreshErr) {
              console.warn('Session refresh error:', refreshErr)
            }
          }
        }

        if (mountedRef.current) {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          userRef.current = currentUser
          setLoading(false)
          setError(null)
          setIsInitialized(true)
          // Don't mark initial load as complete here - let the auth state change handler do it
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err)
        if (mountedRef.current) {
          setError(err.message || 'Authentication initialization failed')
          setLoading(false)
          setIsInitialized(true) // Still mark as initialized even on error
        }
      }
    }

    initializeAuth()

    // Disable session health check to reduce console noise
    // Supabase handles automatic token refresh internally
    // const sessionHealthCheck = setInterval(async () => {
    //   if (!mountedRef.current) return
    //   try {
    //     const { data: { session } } = await supabase.auth.getSession()
    //     if (session) {
    //       const now = Math.floor(Date.now() / 1000)
    //       const expiresAt = session.expires_at || 0
    //       if (expiresAt - now < 600) {
    //         console.log('Proactive session refresh triggered')
    //         await supabase.auth.refreshSession()
    //       }
    //     }
    //   } catch (error) {
    //     console.warn('Session health check failed:', error)
    //   }
    // }, 15 * 60 * 1000)

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      const newUser = session?.user ?? null

      // Handle user sign in with robust profile creation
      // Only show welcome for actual sign-in events, not initial page loads
      if (event === 'SIGNED_IN' && newUser && !userRef.current && !welcomeShownRef.current.has(newUser.id) && !isInitialLoadRef.current) {
        welcomeShownRef.current.add(newUser.id)
        localStorage.setItem('welcomeShownIds', JSON.stringify(Array.from(welcomeShownRef.current)))

        // Determine if this is a new user
        const userIsNew = isNewUser(newUser)

        // Handle post-auth setup (profile creation, avatar, welcome message)
        setTimeout(async () => {
          try {
            await handlePostAuthSetup(newUser, userIsNew)
          } catch (error: any) {
            // Show user-friendly error based on error type
            if (error.message?.includes('duplicate key') || error.code === '23505') {
              // Don't show error for duplicate key - this is expected in some cases
            } else {
              // Show error to user for other types of failures
              toast.error('Account setup had an issue, but you are signed in. Please refresh if you experience problems.')
            }
          }
        }, userIsNew ? 2000 : 500) // Longer delay for new users

        // Check for redirect after login
        const redirectPath = sessionStorage.getItem('redirectAfterLogin')
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin')
          // Use setTimeout to ensure the auth state is fully updated
          setTimeout(() => {
            window.location.href = redirectPath
          }, 100)
        }
      }

      // Show goodbye message on sign out and redirect to home
      if (event === 'SIGNED_OUT') {
        // Clear welcome tracking
        welcomeShownRef.current.clear()
        localStorage.removeItem('welcomeShownIds')

        toast.success('See you later! 👋')
        // Redirect to home page after sign out
        setTimeout(() => {
          window.location.href = '/'
        }, 500) // Small delay to show the toast
      }

      setUser(newUser)
      userRef.current = newUser
      setLoading(false)
      setError(null)

      // Mark initial load as complete after first auth state change
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
      // clearInterval(sessionHealthCheck) // Removed since we disabled the health check
      mountedRef.current = false
      initializingRef.current = false
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      await authSignInWithGoogle()
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error)

      // Handle specific Google OAuth errors
      if (error.message?.includes('Database error saving new user')) {
        toast.error('Google sign-in had a setup issue. Please try again or use magic link! 📧')
      } else if (error.message?.includes('server_error')) {
        toast.error('Google sign-in temporarily unavailable. Please try magic link! 📧')
      } else if (error.message?.includes('Provider not found')) {
        toast.error('Google sign-in not configured. Please try magic link! 📧')
      } else if (error.message?.includes('OAuth exchange failed')) {
        toast.error('Google sign-in authentication failed. Please try again or use magic link! 📧')
      } else {
        toast.error('Google sign-in failed. Please try magic link instead! 📧')
      }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authSignOut()
    } catch (error: any) {
      setError(error.message || 'Sign out failed')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const deleteAccount = async () => {
    try {
      setLoading(true)
      // Import deleteUserAccount dynamically to avoid circular imports
      const { deleteUserAccount } = await import('./deleteUserService')
      if (user) {
        await deleteUserAccount(user.id)
      }
    } catch (error: any) {
      setError(error.message || 'Account deletion failed')
      throw error // Re-throw so the component can handle it
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isInitialized, signInWithGoogle, signOut, deleteAccount, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.error('useAuth called outside of AuthProvider. This might be due to React Strict Mode or hot reloading.')
    console.error('Component stack:', new Error().stack)

    // In development, provide a fallback to prevent app crashes
    if (import.meta.env.DEV) {
      console.warn('Providing fallback auth state for development')
      return {
        user: null,
        loading: true,
        error: null,
        isInitialized: false,
        signInWithGoogle: async () => {},
        signOut: async () => {},
        deleteAccount: async () => {},
        clearError: () => {}
      }
    }

    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}