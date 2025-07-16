import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@shared/lib/supabase'
import { ensureUserProfileExists } from '@shared/lib/userService'
import { isNewUser } from '@shared/lib/authUtils'

// Polyfill for structuredClone (React Native compatibility)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj))
}

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession()

export interface AuthResult {
  success: boolean
  error?: string
  profile?: any
  isNewUser?: boolean
}

/**
 * Mobile-specific Google OAuth sign-in using Expo AuthSession
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Use custom scheme directly - AuthSession.makeRedirectUri isn't working properly
    const redirectUri = 'thirstee://auth/callback'

    console.log('🔗 Mobile OAuth Redirect URI:', redirectUri)
    console.log('🔧 Development mode:', __DEV__)
    console.log('✅ Using custom scheme for OAuth redirect')

    // Start OAuth session with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true, // Important for mobile
      }
    })

    if (error) {
      console.error('❌ Supabase OAuth Error:', error)
      return { success: false, error: error.message }
    }

    if (!data?.url) {
      return { success: false, error: 'No OAuth URL received' }
    }

    console.log('🚀 Opening OAuth URL:', data.url)

    // Open OAuth URL in browser with proper configuration
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri,
      {
        // Add options to help with iOS WebAuthenticationSession
        showInRecents: false,
      }
    )

    console.log('📱 OAuth Result:', result)

    if (result.type === 'cancel') {
      console.log('🚫 User cancelled OAuth flow')
      return { success: false, error: 'Sign in was cancelled' }
    }

    if (result.type === 'dismiss') {
      console.log('🚫 OAuth session was dismissed')
      return { success: false, error: 'Sign in was dismissed' }
    }

    if (result.type === 'success') {
      // Parse the callback URL to extract tokens or code
      const url = result.url
      console.log('🔍 Callback URL:', url)

      // Try to extract from URL fragment first (implicit flow)
      let params = new URLSearchParams(url.split('#')[1])
      if (!params.get('access_token')) {
        // Try query parameters (authorization code flow)
        params = new URLSearchParams(url.split('?')[1])
      }

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const code = params.get('code')

      console.log('🔑 Extracted tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!code
      })

      if (accessToken) {
        // Direct token flow
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('❌ Session Error:', sessionError)
          return { success: false, error: sessionError.message }
        }

        if (sessionData.user) {
          const userIsNew = isNewUser(sessionData.user)
          const profileResult = await ensureUserProfileExists(sessionData.user)

          if (!profileResult.success) {
            return { success: false, error: profileResult.error }
          }

          return {
            success: true,
            profile: profileResult.data,
            isNewUser: userIsNew
          }
        }
      } else if (code) {
        // Authorization code flow - manually exchange code for session
        console.log('🔄 Processing authorization code...')

        try {
          // Try method 1: Use exchangeCodeForSession
          console.log('🔄 Attempting code exchange...')
          const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (sessionData?.user && !exchangeError) {
            console.log('✅ Successfully exchanged code for session')
            const userIsNew = isNewUser(sessionData.user)
            const profileResult = await ensureUserProfileExists(sessionData.user)

            if (!profileResult.success) {
              return { success: false, error: profileResult.error }
            }

            return {
              success: true,
              profile: profileResult.data,
              isNewUser: userIsNew
            }
          }

          // Method 1 failed, try method 2: Let Supabase process the callback URL
          console.log('🔄 Fallback: Processing callback URL with Supabase...')

          // Simulate what Supabase does internally - process the callback URL
          const callbackUrl = url // This is the full callback URL with the code

          // Wait a moment and check for session
          await new Promise(resolve => setTimeout(resolve, 2000))

          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (session?.user) {
            console.log('✅ Session found after callback processing')
            const userIsNew = isNewUser(session.user)
            const profileResult = await ensureUserProfileExists(session.user)

            if (!profileResult.success) {
              return { success: false, error: profileResult.error }
            }

            return {
              success: true,
              profile: profileResult.data,
              isNewUser: userIsNew
            }
          }

          // Both methods failed
          console.error('❌ Both code exchange methods failed')
          console.error('Exchange error:', exchangeError)
          console.error('Session error:', sessionError)
          return { success: false, error: 'Failed to authenticate with authorization code' }

        } catch (error: any) {
          console.error('❌ Code exchange failed:', error)
          return { success: false, error: error.message || 'Code exchange failed' }
        }
      }
    } else if (result.type === 'cancel') {
      return { success: false, error: 'Sign in was cancelled' }
    }

    return { success: false, error: 'OAuth flow failed' }
  } catch (error: any) {
    console.error('❌ signInWithGoogle failed:', error)
    return { success: false, error: error.message || 'Authentication failed' }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error && error.status !== 401 && error.status !== 403) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ signOut failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Refresh session
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
