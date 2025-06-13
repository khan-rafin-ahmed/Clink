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

  // Restore welcomed users from session storage so refreshes don't trigger again
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('welcomeShownIds')
      if (stored) {
        const ids: string[] = JSON.parse(stored)
        welcomeShownRef.current = new Set(ids)
      }
    } catch {
      // ignore parse errors
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

          // If session expires within 5 minutes, try to refresh it
          if (expiresAt - now < 300) {
            console.log('Session expires soon, attempting refresh...')
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) {
                console.warn('Session refresh failed:', refreshError)
              } else if (refreshData.session) {
                console.log('Session refreshed successfully')
              }
            } catch (refreshErr) {
              console.warn('Session refresh error:', refreshErr)
            }
          }
        }

        if (mountedRef.current) {
          setUser(session?.user ?? null)
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

    // Set up session health check interval - reduced frequency to prevent HTTP/2 errors
    const sessionHealthCheck = setInterval(async () => {
      if (!mountedRef.current) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at || 0

          // If session expires within 10 minutes, refresh it
          if (expiresAt - now < 600) {
            console.log('Proactive session refresh triggered')
            await supabase.auth.refreshSession()
          }
        }
      } catch (error) {
        console.warn('Session health check failed:', error)
      }
    }, 15 * 60 * 1000) // Check every 15 minutes instead of 5 to reduce requests

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      const newUser = session?.user ?? null

      // Handle user sign in with robust profile creation
      // Only show welcome for actual sign-in events, not initial page loads
      if (event === 'SIGNED_IN' && newUser && !user && !welcomeShownRef.current.has(newUser.id) && !isInitialLoadRef.current) {
        welcomeShownRef.current.add(newUser.id)
        sessionStorage.setItem('welcomeShownIds', JSON.stringify(Array.from(welcomeShownRef.current)))

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
        sessionStorage.removeItem('welcomeShownIds')

        toast.success('See you later! 👋')
        // Redirect to home page after sign out
        setTimeout(() => {
          window.location.href = '/'
        }, 500) // Small delay to show the toast
      }

      setUser(newUser)
      setLoading(false)
      setError(null)

      // Mark initial load as complete after first auth state change
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionHealthCheck)
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}