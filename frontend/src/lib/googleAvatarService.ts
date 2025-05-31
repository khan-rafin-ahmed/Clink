import { supabase } from './supabase'

/**
 * Service for handling Google avatar URLs from OAuth metadata
 */

// Cache for Google avatars to avoid repeated queries
const googleAvatarCache = new Map<string, string | null>()

/**
 * Get Google avatar URL for a specific user from their OAuth metadata
 * This creates a Supabase function that can access auth.users table
 */
export async function getGoogleAvatarUrl(userId: string): Promise<string | null> {
  // Check cache first
  if (googleAvatarCache.has(userId)) {
    return googleAvatarCache.get(userId) || null
  }

  try {
    // Call a Supabase function that can access auth.users table
    const { data, error } = await supabase.rpc('get_user_google_avatar', {
      user_id: userId
    })

    if (error) {
      googleAvatarCache.set(userId, null)
      return null
    }

    const avatarUrl = data || null
    googleAvatarCache.set(userId, avatarUrl)
    return avatarUrl
  } catch (error) {
    googleAvatarCache.set(userId, null)
    return null
  }
}

/**
 * Get Google avatar URL for the current authenticated user
 * This can access user_metadata directly from the auth context
 */
export async function getCurrentUserGoogleAvatar(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Check multiple possible locations for Google avatar
    const metadata = user.user_metadata || {}
    const googleAvatar = metadata.picture ||
                        metadata.avatar_url ||
                        metadata.photo ||
                        metadata.image ||
                        null

    return googleAvatar
  } catch (error) {
    return null
  }
}

/**
 * Update user profile with Google avatar if they don't have a custom one
 */
export async function updateProfileWithGoogleAvatar(userId: string): Promise<void> {
  try {
    // Add a small delay to ensure user session is stable
    await new Promise(resolve => setTimeout(resolve, 1000))

    // First check if user already has a custom avatar
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single()

    // If user already has a custom avatar, don't override it
    if (profile?.avatar_url) {
      return
    }

    // Get Google avatar using the current user method (more reliable for new users)
    const googleAvatarUrl = await getCurrentUserGoogleAvatar()

    if (googleAvatarUrl) {
      // Update profile with Google avatar
      await supabase
        .from('user_profiles')
        .update({ avatar_url: googleAvatarUrl })
        .eq('user_id', userId)
    }
  } catch (error) {
    // Silently fail to avoid disrupting user experience
  }
}

/**
 * Clear the Google avatar cache for a specific user
 */
export function clearGoogleAvatarCache(userId: string): void {
  googleAvatarCache.delete(userId)
}

/**
 * Clear all Google avatar cache
 */
export function clearAllGoogleAvatarCache(): void {
  googleAvatarCache.clear()
}
