import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { handleAuthCallback } from '@/lib/authService'
import {
  hasAuthTokensInUrl,
  clearAuthTokensFromUrl,
  validateTokenCleanup,
  logAuthSecurityInfo,
  setupAuthSecurityPolicies
} from '@/lib/authSecurity'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // SECURITY: Set up security policies and perform security checks
        setupAuthSecurityPolicies()
        logAuthSecurityInfo()

        // SECURITY: Immediately detect and clear any authentication tokens from URL
        const hasTokens = hasAuthTokensInUrl()
        if (hasTokens) {
          console.log('🔒 AuthCallback: Detected authentication tokens in URL - clearing for security')
          clearAuthTokensFromUrl()

          // Validate that tokens were successfully cleared
          if (!validateTokenCleanup()) {
            console.error('❌ AuthCallback: Failed to clear tokens from URL - security risk!')
          }
        }

        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search)
        const error_code = urlParams.get('error')
        const error_description = urlParams.get('error_description')
        const code = urlParams.get('code')

        // Handle errors from URL
        if (error_code) {
          navigate('/login?error=' + encodeURIComponent(error_description || error_code))
          return
        }

        // Handle URL fragments (implicit flow) - this happens when tokens are in URL hash
        if (hasTokens) {
          console.log('🔄 AuthCallback: Processing implicit OAuth flow (tokens were in URL)')

          // Let Supabase handle the session from URL fragments
          // The tokens have already been cleared from the URL above for security
          try {
            // Wait a moment for Supabase to process the session from URL
            await new Promise(resolve => setTimeout(resolve, 500))

            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.error('❌ AuthCallback: Session retrieval failed:', error)
              navigate('/login?error=' + encodeURIComponent(`Authentication failed: ${error.message}`))
              return
            }

            if (session) {
              console.log('✅ AuthCallback: Implicit flow session established')
              const result = await handleAuthCallback()
              if (result.success) {
                navigate('/profile')
              } else {
                navigate('/login?error=' + encodeURIComponent(result.error || 'Setup failed'))
              }
              return
            } else {
              console.log('⚠️ AuthCallback: No session found after implicit flow, falling back to polling')
            }
          } catch (implicitError: any) {
            console.error('❌ AuthCallback: Implicit flow error:', implicitError)
            // Fall through to other handling methods
          }
        }

        // If we have a code parameter, this is the authorization code flow
        if (code) {
          console.log('🔄 AuthCallback: Processing authorization code flow')

          // Try to exchange the code for a session using Supabase's method
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
              console.error('❌ AuthCallback: OAuth exchange failed:', error)

              // Handle specific Google OAuth errors
              if (error.message?.includes('Database error saving new user')) {
                console.log('🔧 AuthCallback: Database error detected, attempting recovery')

                // Wait a moment for any background processes to complete
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Try to get session - user might have been created despite the error
                const { data: sessionData } = await supabase.auth.getSession()
                if (sessionData?.session?.user) {
                  console.log('✅ AuthCallback: User session found despite error, proceeding with manual setup')

                  // Force profile creation using our manual function
                  try {
                    const { data: profileCreated } = await supabase.rpc('create_profile_for_user', {
                      target_user_id: sessionData.session.user.id
                    })
                    console.log('🔧 AuthCallback: Manual profile creation result:', profileCreated)
                  } catch (profileError) {
                    console.log('⚠️ AuthCallback: Manual profile creation failed, continuing anyway:', profileError)
                  }

                  const result = await handleAuthCallback()
                  if (result.success) {
                    navigate('/profile')
                    return
                  }
                } else {
                  console.log('❌ AuthCallback: No session found, redirecting to login with retry option')
                  navigate('/login?error=' + encodeURIComponent('Google signup had an issue. Please try again or use magic link.'))
                  return
                }
              }

              navigate('/login?error=' + encodeURIComponent(`OAuth exchange failed: ${error.message}`))
              return
            }

            if (data?.session) {
              console.log('✅ AuthCallback: Authorization code exchange successful')
              // Use our robust auth callback handler
              const result = await handleAuthCallback()
              if (result.success) {
                navigate('/profile')
              } else {
                navigate('/login?error=' + encodeURIComponent(result.error || 'Setup failed'))
              }
              return
            }
          } catch (exchangeError: any) {
            console.error('❌ AuthCallback: Exchange error:', exchangeError)
            // Exchange failed, falling back to polling
          }

          // Fallback: Poll for session (in case exchangeCodeForSession doesn't work)
          let attempts = 0
          const maxAttempts = 15

          const checkForSession = async (): Promise<void> => {
            attempts++

            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              if (attempts >= maxAttempts) {
                navigate('/login?error=' + encodeURIComponent(`Session polling failed: ${error.message}`))
                return
              }
              setTimeout(checkForSession, 1500)
              return
            }

            if (session) {
              // Use our robust auth callback handler
              const result = await handleAuthCallback()
              if (result.success) {
                navigate('/profile')
              } else {
                navigate('/login?error=' + encodeURIComponent(result.error || 'Setup failed'))
              }
              return
            }

            if (attempts >= maxAttempts) {
              navigate('/login?error=' + encodeURIComponent('OAuth session timeout - please try again'))
              return
            }

            setTimeout(checkForSession, 1500)
          }

          await checkForSession()
          return
        }

        // For magic links (no code parameter), use our robust handler
        const result = await handleAuthCallback()
        if (result.success) {
          navigate('/profile')
        } else if (result.error) {
          navigate('/login?error=' + encodeURIComponent(result.error))
        } else {
          // Listen for auth state change (for magic links)
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              const setupResult = await handleAuthCallback()
              if (setupResult.success) {
                navigate('/profile')
              } else {
                navigate('/login?error=' + encodeURIComponent(setupResult.error || 'Setup failed'))
              }
            }
          })

          // Clean up listener after 10 seconds if nothing happens
          setTimeout(() => {
            authListener.subscription.unsubscribe()
            navigate('/login?error=magic_link_timeout')
          }, 10000)
        }
      } catch (error: any) {
        navigate('/login?error=' + encodeURIComponent(error.message || 'callback_failed'))
      }
    }

    handleCallback()
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
