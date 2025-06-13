import { supabase } from './supabase'
import { ensureUserProfileExists } from './userService'
import { updateProfileWithGoogleAvatar } from './googleAvatarService'
import { getAuthCallbackUrl, isLocalEnvironment, logEnvironmentInfo } from './envUtils'
import { toast } from 'sonner'

/**
 * Robust authentication service that handles user profile creation
 * This ensures user profiles are created reliably without depending on database triggers
 */

// Handle magic link sign-in with profile creation
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  try {
    // Log environment info for debugging in local development
    if (isLocalEnvironment()) {
      logEnvironmentInfo()
    }

    // Force localhost callback URL in local development
    let callbackUrl = redirectTo || getAuthCallbackUrl()

    // CRITICAL: When using production Supabase with local development,
    // we must explicitly force the localhost callback URL
    if (isLocalEnvironment()) {
      callbackUrl = 'http://localhost:3000/auth/callback'
      console.log('🔗 Magic Link Callback URL (forced localhost):', callbackUrl)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Explicitly set the redirect URL to override any Supabase dashboard settings
        emailRedirectTo: callbackUrl,
        // Additional options to ensure localhost redirect works
        data: {
          // Custom data to help identify local development requests
          environment: isLocalEnvironment() ? 'local' : 'production',
          requestedRedirect: callbackUrl
        }
      }
    })

    if (error) {
      console.error('❌ Magic Link Error:', error)
      throw error
    }

    console.log('✅ Magic link sent successfully to:', email)
    console.log('📧 Expected redirect URL:', callbackUrl)

    return { success: true }
  } catch (error) {
    console.error('❌ signInWithMagicLink failed:', error)
    throw error
  }
}

// Handle Google OAuth sign-in with profile creation
export async function signInWithGoogle() {
  try {
    // Log environment info for debugging in local development
    if (isLocalEnvironment()) {
      logEnvironmentInfo()
    }

    // Force localhost callback URL in local development
    let callbackUrl = getAuthCallbackUrl()

    // CRITICAL: When using production Supabase with local development,
    // we must explicitly force the localhost callback URL
    if (isLocalEnvironment()) {
      callbackUrl = 'http://localhost:3000/auth/callback'
      console.log('🔗 Google OAuth Callback URL (forced localhost):', callbackUrl)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: callbackUrl,
        // Skip automatic profile creation to handle it manually
        skipBrowserRedirect: false,
        // SECURITY: Use PKCE flow for better security (authorization code + code verifier)
        // This prevents tokens from appearing in URL fragments
        scopes: 'openid email profile'
      }
    })

    if (error) {
      console.error('❌ Google OAuth Error:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('❌ signInWithGoogle failed:', error)
    throw error
  }
}

// Handle post-authentication setup (profile creation, avatar, etc.)
export async function handlePostAuthSetup(user: any, isNewUser: boolean = false) {
  try {
    // Step 1: Ensure user profile exists (most critical)
    const profile = await ensureUserProfileExists(user)

    // Step 2: Update with Google avatar if available (non-critical)
    try {
      await updateProfileWithGoogleAvatar(user.id)
    } catch (avatarError) {
      // Don't throw - avatar update is not critical
    }

    // Step 3: Show welcome message
    const username = user.user_metadata?.full_name?.split(' ')[0] ||
                    user.user_metadata?.name?.split(' ')[0] ||
                    user.email?.split('@')[0] || 'Champion'

    if (isNewUser) {
      toast.success(`Welcome to Thirstee, ${username}! 🍻 Let's raise some hell!`)
    } else {
      toast.success(`Welcome back, ${username}! 🍻 Ready to raise some hell?`)
    }

    return { success: true, profile }

  } catch (error: any) {
    // Show user-friendly error message based on error type
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      toast.success(`Welcome back! 🍻`)
      return { success: true, profile: null }
    } else if (error.message?.includes('permission') || error.message?.includes('RLS')) {
      toast.error('Account setup failed due to permissions. Please contact support.')
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      toast.error('Network issue during setup. Please refresh the page and try again.')
    } else {
      toast.error('Account setup encountered an issue. Please refresh the page.')
    }

    throw error
  }
}

// Check if user is new (created within last minute)
export function isNewUser(user: any): boolean {
  if (!user?.created_at) return false

  const userCreatedAt = new Date(user.created_at)
  const now = new Date()
  const isNew = (now.getTime() - userCreatedAt.getTime()) < 60000 // Less than 1 minute old

  return isNew
}

// Handle auth callback with robust error handling
export async function handleAuthCallback() {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session?.user) {
      return { success: false, error: 'No session found' }
    }

    const user = session.user

    // Determine if this is a new user
    const userIsNew = isNewUser(user)

    // Handle post-auth setup with additional error handling
    try {
      await handlePostAuthSetup(user, userIsNew)
    } catch (setupError: any) {
      // For duplicate key errors, still consider it a success
      if (setupError.message?.includes('duplicate key') || setupError.code === '23505') {
        return { success: true, user, isNewUser: false }
      }

      // For other errors, still allow the user to proceed but log the issue
      toast.error('Account setup had an issue. Please refresh if you experience problems.')
      return { success: true, user, isNewUser, setupError: setupError.message }
    }

    return { success: true, user, isNewUser: userIsNew }

  } catch (error: any) {
    return { success: false, error: error.message || 'Callback failed' }
  }
}

// Robust sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    toast.success('See you later! 👋')

    return { success: true }
  } catch (error) {
    toast.error('Failed to sign out. Please try again.')
    throw error
  }
}
