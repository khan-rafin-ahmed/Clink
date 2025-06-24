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

        console.log('🔍 AuthCallback: URL params:', {
          error_code,
          error_description,
          code: code ? 'present' : 'missing',
          fullUrl: window.location.href
        })

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
            await new Promise(resolve => setTimeout(resolve, 200))

            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
              console.error('❌ AuthCallback: Session retrieval failed:', error)
              navigate('/login?error=' + encodeURIComponent(`Authentication failed: ${error.message}`))
              return
            }

            if (session) {
              console.log('✅ AuthCallback: Implicit flow session established')
              // Don't call handleAuthCallback here - let AuthContext handle the welcome toast
              // Just navigate to profile and let the auth state change trigger the welcome
              navigate('/profile')
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

          // Let Supabase handle the PKCE flow automatically by checking for session
          // This avoids manual code exchange which can fail with PKCE issues
          let attempts = 0
          const maxAttempts = 10

          const waitForSession = async (): Promise<void> => {
            attempts++

            const { data: { session }, error } = await supabase.auth.getSession()

            if (session) {
              console.log('✅ AuthCallback: Session found after code flow')
              // Don't call handleAuthCallback here - let AuthContext handle the welcome toast
              // Just navigate to profile and let the auth state change trigger the welcome
              navigate('/profile')
              return
            }

            if (error) {
              console.error('❌ AuthCallback: Session error:', error)
              if (attempts >= maxAttempts) {
                navigate('/login?error=' + encodeURIComponent(`Session error: ${error.message}`))
                return
              }
            }

            if (attempts >= maxAttempts) {
              navigate('/login?error=' + encodeURIComponent('OAuth session timeout - please try again'))
              return
            }

            // Wait and try again
            setTimeout(waitForSession, 500)
          }

          await waitForSession()
          return
        } else {
          // For magic links (no code parameter), let AuthContext handle everything
          // Just wait for the auth state change and navigate
          console.log('🔄 AuthCallback: Waiting for auth state change (magic link flow)')

          // Wait for the main AuthContext to handle the auth state change
          setTimeout(() => {
            navigate('/profile')
          }, 500)

          // Clean up after 10 seconds if nothing happens
          setTimeout(() => {
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
