import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SimpleAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10
    let authListener: any = null

    const handleCallback = async () => {
      try {
        attempts++
        console.log(`Auth callback attempt ${attempts}/${maxAttempts}`)

        // Check URL for errors first
        const urlParams = new URLSearchParams(window.location.search)
        const error_code = urlParams.get('error')
        const error_description = urlParams.get('error_description')

        if (error_code) {
          console.error('Auth error from URL:', error_code, error_description)
          toast.error('Authentication failed: ' + (error_description || error_code))
          navigate('/login')
          return
        }

        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          toast.error('Authentication failed: ' + error.message)
          navigate('/login')
          return
        }

        if (session) {
          console.log('User authenticated successfully!')
          toast.success('Welcome back! 🍻')
          navigate('/profile')
          return
        }

        console.log('No session found, waiting for auth state change...')

        // If no session yet, wait for auth state change
        if (attempts === 1) {
          authListener = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session?.user?.email)

            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in via state change')
              toast.success('Welcome back! 🍻')
              navigate('/profile')
            }
          })
        }

        // Retry if we haven't reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(handleCallback, 1000)
        } else {
          console.log('Max attempts reached, redirecting to login')
          toast.error('Authentication timed out. Please try again.')
          navigate('/login')
        }
      } catch (error: any) {
        console.error('Callback error:', error)
        toast.error('Something went wrong. Please try again.')
        navigate('/login')
      }
    }

    // Start the callback handling
    const timer = setTimeout(handleCallback, 500)

    return () => {
      clearTimeout(timer)
      if (authListener) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
        <p className="text-xs text-muted-foreground">
          Verifying your magic link - this should only take a moment
        </p>
        <div className="mt-6 text-xs text-muted-foreground">
          <p>If this takes too long, you'll be redirected automatically</p>
        </div>
      </div>
    </div>
  )
}
