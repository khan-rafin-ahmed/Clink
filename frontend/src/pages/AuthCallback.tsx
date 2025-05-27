import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback triggered')
        console.log('Current URL:', window.location.href)

        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search)
        const error_code = urlParams.get('error')
        const error_description = urlParams.get('error_description')
        const code = urlParams.get('code')

        // Handle errors from URL
        if (error_code) {
          console.error('OAuth error from URL:', error_code, error_description)
          navigate('/login?error=' + encodeURIComponent(error_description || error_code))
          return
        }

        // If we have a code parameter, this is likely a Google OAuth callback
        if (code) {
          console.log('Found OAuth code:', code.substring(0, 20) + '...')
          console.log('Full URL params:', Object.fromEntries(urlParams.entries()))

          // Try to exchange the code for a session using Supabase's method
          try {
            console.log('Attempting to exchange OAuth code for session...')

            // Use Supabase's exchangeCodeForSession method
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            console.log('Exchange result:', { data: data?.session ? 'Session created' : 'No session', error })

            if (error) {
              console.error('Code exchange error:', error)
              navigate('/login?error=' + encodeURIComponent(`OAuth exchange failed: ${error.message}`))
              return
            }

            if (data?.session) {
              console.log('OAuth session successfully created!')
              navigate('/profile')
              return
            }

            console.log('No session from exchange, falling back to polling...')
          } catch (exchangeError: any) {
            console.error('Exchange method failed:', exchangeError)
            console.log('Falling back to session polling...')
          }

          // Fallback: Poll for session (in case exchangeCodeForSession doesn't work)
          let attempts = 0
          const maxAttempts = 15

          const checkForSession = async (): Promise<void> => {
            attempts++
            console.log(`Polling for session, attempt ${attempts}/${maxAttempts}`)

            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.error('Session polling error:', error)
              if (attempts >= maxAttempts) {
                navigate('/login?error=' + encodeURIComponent(`Session polling failed: ${error.message}`))
                return
              }
              // Retry after delay
              setTimeout(checkForSession, 1500)
              return
            }

            if (session) {
              console.log('OAuth session found via polling!')
              navigate('/profile')
              return
            }

            if (attempts >= maxAttempts) {
              console.log('Max polling attempts reached, no session found')
              navigate('/login?error=' + encodeURIComponent('OAuth session timeout - please try again'))
              return
            }

            // Retry after delay
            setTimeout(checkForSession, 1500)
          }

          await checkForSession()
          return
        }

        // For magic links (no code parameter), check session immediately
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('Session data:', session)
        console.log('Session error:', error)

        if (error) {
          console.error('Session error:', error)
          navigate('/login?error=' + encodeURIComponent(error.message))
          return
        }

        if (session) {
          console.log('Magic link session found!')
          navigate('/profile')
        } else {
          console.log('No session found, setting up auth listener...')

          // Listen for auth state change (for magic links)
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session?.user?.email)

            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in via auth state change')
              navigate('/profile')
            }
          })

          // Clean up listener after 10 seconds if nothing happens
          setTimeout(() => {
            authListener.subscription.unsubscribe()
            console.log('Auth callback timeout, redirecting to login')
            navigate('/login?error=magic_link_timeout')
          }, 10000)
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        navigate('/login?error=' + encodeURIComponent(error.message || 'callback_failed'))
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <img
          src="/thirstee-logo.svg"
          alt="Thirstee"
          className="h-16 w-auto mx-auto mb-4"
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Completing authentication...</p>
        <p className="text-xs text-muted-foreground">
          Processing your sign-in request
        </p>
      </div>
    </div>
  )
}
