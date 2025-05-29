import { supabase } from './supabase'
import { ensureUserProfileExists } from './userService'
import { updateProfileWithGoogleAvatar } from './googleAvatarService'
import { toast } from 'sonner'

/**
 * Robust authentication service that handles user profile creation
 * This ensures user profiles are created reliably without depending on database triggers
 */

// Handle magic link sign-in with profile creation
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  console.log('🔗 signInWithMagicLink: Starting for email:', email)

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('❌ signInWithMagicLink: Failed:', error)
      throw error
    }

    console.log('✅ signInWithMagicLink: Magic link sent successfully')
    return { success: true }
  } catch (error) {
    console.error('💥 signInWithMagicLink: Error:', error)
    throw error
  }
}

// Handle Google OAuth sign-in with profile creation
export async function signInWithGoogle() {
  console.log('🔗 signInWithGoogle: Starting Google OAuth')

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('❌ signInWithGoogle: Failed:', error)
      throw error
    }

    console.log('✅ signInWithGoogle: OAuth initiated successfully')
    return { success: true }
  } catch (error) {
    console.error('💥 signInWithGoogle: Error:', error)
    throw error
  }
}

// Handle post-authentication setup (profile creation, avatar, etc.)
export async function handlePostAuthSetup(user: any, isNewUser: boolean = false) {
  console.log('🔧 handlePostAuthSetup: Starting for user:', user.id, 'isNewUser:', isNewUser)

  try {
    // Step 1: Ensure user profile exists (most critical)
    console.log('📝 handlePostAuthSetup: Ensuring user profile exists')
    const profile = await ensureUserProfileExists(user)
    console.log('✅ handlePostAuthSetup: User profile ensured:', profile?.id)

    // Step 2: Update with Google avatar if available (non-critical)
    try {
      console.log('🖼️ handlePostAuthSetup: Updating Google avatar')
      await updateProfileWithGoogleAvatar(user.id)
      console.log('✅ handlePostAuthSetup: Google avatar updated')
    } catch (avatarError) {
      console.warn('⚠️ handlePostAuthSetup: Avatar update failed (non-critical):', avatarError)
      // Don't throw - avatar update is not critical
    }

    // Step 3: Show welcome message
    const username = user.user_metadata?.full_name?.split(' ')[0] ||
                    user.email?.split('@')[0] || 'Champion'

    if (isNewUser) {
      toast.success(`Welcome to Thirstee, ${username}! 🍻 Let's raise some hell!`)
    } else {
      toast.success(`Welcome back, ${username}! 🍻 Ready to raise some hell?`)
    }

    console.log('✅ handlePostAuthSetup: Setup completed successfully')
    return { success: true, profile }

  } catch (error) {
    console.error('💥 handlePostAuthSetup: Critical error:', error)

    // Show user-friendly error message
    toast.error('Account setup encountered an issue. Please refresh the page.')

    throw error
  }
}

// Check if user is new (created within last minute)
export function isNewUser(user: any): boolean {
  if (!user?.created_at) return false

  const userCreatedAt = new Date(user.created_at)
  const now = new Date()
  const isNew = (now.getTime() - userCreatedAt.getTime()) < 60000 // Less than 1 minute old

  console.log('🆕 isNewUser: User created at:', userCreatedAt, 'isNew:', isNew)
  return isNew
}

// Handle auth callback with robust error handling
export async function handleAuthCallback() {
  console.log('🔄 handleAuthCallback: Starting auth callback handling')

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ handleAuthCallback: Session error:', error)
      throw error
    }

    if (!session?.user) {
      console.log('⚠️ handleAuthCallback: No session found')
      return { success: false, error: 'No session found' }
    }

    const user = session.user
    console.log('👤 handleAuthCallback: User found:', user.id)

    // Determine if this is a new user
    const userIsNew = isNewUser(user)

    // Handle post-auth setup
    await handlePostAuthSetup(user, userIsNew)

    console.log('✅ handleAuthCallback: Callback handled successfully')
    return { success: true, user, isNewUser: userIsNew }

  } catch (error: any) {
    console.error('💥 handleAuthCallback: Error:', error)
    return { success: false, error: error.message || 'Callback failed' }
  }
}

// Robust sign out
export async function signOut() {
  console.log('👋 signOut: Starting sign out')

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ signOut: Failed:', error)
      throw error
    }

    console.log('✅ signOut: Signed out successfully')
    toast.success('See you later! 👋')

    return { success: true }
  } catch (error) {
    console.error('💥 signOut: Error:', error)
    toast.error('Failed to sign out. Please try again.')
    throw error
  }
}
