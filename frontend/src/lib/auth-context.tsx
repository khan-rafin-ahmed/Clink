import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { toast } from 'sonner'

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)

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
          console.error('Session error:', sessionError)
          setError(sessionError.message)
        }

        if (mountedRef.current) {
          setUser(session?.user ?? null)
          setLoading(false)
          setError(null)
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err)
        if (mountedRef.current) {
          setError(err.message || 'Authentication initialization failed')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      const newUser = session?.user ?? null

      // Show welcome message on sign in
      if (event === 'SIGNED_IN' && newUser && !user) {
        const username = newUser.email?.split('@')[0] || 'Champion'
        toast.success(`Welcome back, ${username}! 🍻 Ready to raise some hell?`)

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

      // Show goodbye message on sign out
      if (event === 'SIGNED_OUT') {
        toast.success('See you later! 👋')
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
      console.log('Initiating Google OAuth...')
      console.log('Using Supabase default redirect (no custom redirectTo)')

      // Try without custom redirectTo first - let Supabase handle it
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      console.log('Google OAuth response:', { data, error })

      if (error) {
        console.error('Google OAuth error details:', {
          message: error.message,
          status: error.status,
          details: error
        })

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

      console.log('Google OAuth initiated successfully')
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
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
      console.error('Error signing out:', error)
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
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut, clearError }}>
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