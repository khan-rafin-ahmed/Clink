import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { toast } from 'sonner'
import { updateProfileWithGoogleAvatar } from './googleAvatarService'
import { ensureUserProfileExists } from './userService'

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  isInitialized: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
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
          setError(sessionError.message)
        }

        if (mountedRef.current) {
          setUser(session?.user ?? null)
          setLoading(false)
          setError(null)
          setIsInitialized(true)
          isInitialLoadRef.current = false // Mark initial load as complete
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.message || 'Authentication initialization failed')
          setLoading(false)
          setIsInitialized(true) // Still mark as initialized even on error
        }
      }
    }

    initializeAuth()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      const newUser = session?.user ?? null

      // Show welcome message on sign in (only once per user per session and not on initial load)
      if (event === 'SIGNED_IN' && newUser && !user && !welcomeShownRef.current.has(newUser.id) && !isInitialLoadRef.current) {
        welcomeShownRef.current.add(newUser.id)

        const username = newUser.user_metadata?.full_name?.split(' ')[0] ||
                        newUser.email?.split('@')[0] || 'Champion'

        // Check if this is a new user (created recently)
        const userCreatedAt = new Date(newUser.created_at || '')
        const now = new Date()
        const isNewUser = (now.getTime() - userCreatedAt.getTime()) < 60000 // Less than 1 minute old

        if (isNewUser) {
          toast.success(`Welcome to Thirstee, ${username}! 🍻 Let's raise some hell!`)
        } else {
          toast.success(`Welcome back, ${username}! 🍻 Ready to raise some hell?`)
        }

        // Ensure user profile exists and update with Google avatar
        setTimeout(async () => {
          try {
            // First ensure the user profile exists (in case trigger failed)
            await ensureUserProfileExists(newUser)

            // Then update with Google avatar if user doesn't have one
            await updateProfileWithGoogleAvatar(newUser.id)
          } catch (error) {
            // Silently handle profile/avatar errors to not disrupt auth flow
          }
        }, isNewUser ? 2000 : 500) // Longer delay for new users

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

        toast.success('See you later! 👋')
        // Redirect to home page after sign out
        setTimeout(() => {
          window.location.href = '/'
        }, 500) // Small delay to show the toast
      }

      setUser(newUser)
      setLoading(false)
      setError(null)
    })

    return () => {
      subscription.unsubscribe()
      mountedRef.current = false
      initializingRef.current = false
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        // More specific error handling
        if (error.message.includes('server_error')) {
          toast.error('Google server error. This might be a configuration issue. Please try magic link! 📧')
        } else if (error.message.includes('Provider not found') || error.message.includes('not enabled')) {
          toast.error('Google sign-in is not enabled. Please use magic link for now! 📧')
        } else if (error.message.includes('redirect_uri')) {
          toast.error('Google OAuth redirect URL mismatch. Please contact support.')
        } else {
          toast.error(`Google sign-in failed: ${error.message}`)
        }
        throw error
      }
    } catch (error: any) {
      // Only show generic error if we haven't already shown a specific one
      if (!error.message?.includes('server_error') && !error.message?.includes('Provider not found')) {
        toast.error('Google sign-in failed. Please try magic link instead! 📧')
      }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Sign out failed')
      toast.error('Failed to sign out. Please try again.')
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
    <AuthContext.Provider value={{ user, loading, error, isInitialized, signInWithGoogle, signOut, clearError }}>
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