import { supabase } from './supabase'
import { getCurrentUser } from './authUtils'
import { generateUsernameFromDisplayName } from './utils'
import type { UserProfile } from '../types'

/**
 * Platform-agnostic user service
 * Handles user profile management without UI dependencies
 */

export interface UserServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Get user profile by username (alias for getUserProfileByUsername)
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  return getUserProfileByUsername(username)
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Privacy check
    if (data) {
      const currentUser = await getCurrentUser()

      // Block private profiles for non-owners
      if (data.profile_visibility === 'private' && currentUser?.id !== data.user_id) {
        return null
      }

      // Block crew-only profiles for non-logged-in users
      if (data.profile_visibility === 'crew_only' && !currentUser?.id) {
        return null
      }

      // Block crew-only profiles for non-crew members
      if (data.profile_visibility === 'crew_only' && currentUser?.id && currentUser.id !== data.user_id) {
        const sharesCrew = await usersShareCrew(currentUser.id, data.user_id)
        if (!sharesCrew) {
          return null
        }
      }
    }

    return data || null
  } catch (error) {
    console.error('Error fetching user profile by username:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserServiceResult<UserProfile>> {
  try {
    // Generate username if not provided and display_name is being updated
    if (updates.display_name && !updates.username) {
      const currentProfile = await getUserProfile(userId)
      if (!currentProfile?.username) {
        updates.username = generateUsernameFromDisplayName(updates.display_name, userId)
      }
    }

    // Ensure username is not empty string
    if (updates.username === '') {
      delete updates.username
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create user profile
 */
export async function createUserProfile(
  userId: string, 
  profile: Partial<UserProfile>
): Promise<UserServiceResult<UserProfile>> {
  try {
    // Ensure username is provided
    if (!profile.username && profile.display_name) {
      profile.username = generateUsernameFromDisplayName(profile.display_name, userId)
    } else if (!profile.username) {
      profile.username = generateUsernameFromDisplayName('user', userId)
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id: userId, ...profile })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Ensure user profile exists (used during auth)
 */
export async function ensureUserProfileExists(user: any): Promise<UserServiceResult<UserProfile>> {
  try {
    if (!user?.id) {
      return { success: false, error: 'Invalid user data' }
    }

    // Check if profile already exists
    let profile = await getUserProfile(user.id)
    
    if (profile) {
      return { success: true, data: profile }
    }

    // Create new profile
    const displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User'

    const avatarUrl = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     null

    const result = await createUserProfile(user.id, {
      display_name: displayName,
      avatar_url: avatarUrl,
      profile_visibility: 'public',
      show_crews_publicly: true
    })

    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Search users
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

/**
 * Check if users share a crew
 */
export async function usersShareCrew(userId1: string, userId2: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('users_share_crew', {
      user1_id: userId1,
      user2_id: userId2
    })

    if (error) {
      console.warn('RPC function not available, using fallback crew check:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.warn('Error checking shared crews:', error)
    return false
  }
}

/**
 * Delete user profile and account
 */
export async function deleteUserAccount(userId: string): Promise<UserServiceResult> {
  try {
    const { error } = await supabase.rpc('delete_user_account', {
      user_id: userId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
