import { supabase } from './supabase'
import type { UserProfile, UserFollow } from '@/types'
import { withCache, CACHE_KEYS, invalidateUserCaches } from './cache'

// Disable debug logging to reduce console noise
const DEBUG_LOGGING = false

// Debug logging helpers
const debugLog = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.log(...args)
  }
}

const debugError = (...args: any[]) => {
  if (DEBUG_LOGGING) {
    console.error(...args)
  }
}

// User Profile Functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // STRONGEST GUARD: Validate input parameters
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    debugError('🚨 getUserProfile: Invalid userId provided:', userId)
    throw new Error('Invalid user ID provided')
  }

  debugLog('🔍 getUserProfile: Fetching profile for userId:', userId)

  return withCache(
    CACHE_KEYS.USER_PROFILE(userId),
    async () => {
      try {
        // First try with all columns including favorite_drink
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          debugError('🚨 getUserProfile: Supabase error:', error)

          if (error.code === 'PGRST116') {
            debugLog('📭 getUserProfile: No profile found for userId:', userId)
            return null // No rows returned
          }

          // If error might be due to missing column, try with basic columns only
          if (error.message?.includes('column') || error.message?.includes('Content-Length')) {
            debugLog('🔄 getUserProfile: Retrying with basic columns due to column error')

            const { data: basicData, error: basicError } = await supabase
              .from('user_profiles')
              .select('id, user_id, display_name, bio, avatar_url, created_at, updated_at')
              .eq('user_id', userId)
              .single()

            if (basicError) {
              if (basicError.code === 'PGRST116') {
                debugLog('📭 getUserProfile: No profile found (basic query) for userId:', userId)
                return null
              }
              debugError('🚨 getUserProfile: Basic query failed:', basicError)
              throw basicError
            }

            debugLog('✅ getUserProfile: Basic profile loaded for userId:', userId)
            // Return data with favorite_drink as null if column doesn't exist
            return {
              ...basicData,
              favorite_drink: null
            } as UserProfile
          }

          throw error
        }

        debugLog('✅ getUserProfile: Full profile loaded for userId:', userId)
        return data
      } catch (error) {
        debugError('🚨 getUserProfile: Unexpected error:', error)
        throw error
      }
    },
    2 * 60 * 1000 // Cache for 2 minutes
  )
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  // First try to update
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  // If no rows were updated (profile doesn't exist), create it
  if (error && error.code === 'PGRST116') {
    debugLog('Profile not found, creating new one...')
    const result = await createUserProfile(userId, updates)
    // Invalidate cache after creating
    invalidateUserCaches(userId)
    return result
  }

  if (error) throw error

  // Invalidate cache after successful update
  invalidateUserCaches(userId)
  return data
}

export async function createUserProfile(userId: string, profile: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId, ...profile })
    .select()
    .single()

  if (error) throw error
  return data
}

// Robust user profile creation with multiple retry attempts
export async function ensureUserProfileExists(user: any, maxRetries = 3): Promise<any> {
  console.log('🔄 ensureUserProfileExists: Starting for user:', user.id)
  console.log('🔍 ensureUserProfileExists: User data:', {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    raw_user_meta_data: (user as any).raw_user_meta_data,
    created_at: user.created_at
  })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 ensureUserProfileExists: Attempt ${attempt}/${maxRetries} - Checking if profile exists`)

      // Check if profile already exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        console.log('✅ ensureUserProfileExists: Profile already exists:', existingProfile.id)
        return existingProfile
      }

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ ensureUserProfileExists: Error checking profile:', selectError)
        throw selectError
      }

      console.log('📝 ensureUserProfileExists: Profile not found, creating new one')

      // Profile doesn't exist, create it with improved metadata extraction
      // Try to get display name from various Google OAuth sources
      const displayName = user.user_metadata?.full_name ||
                         user.user_metadata?.name ||
                         user.user_metadata?.display_name ||
                         // Also try raw_user_meta_data if available (Google OAuth often stores data here)
                         (user as any).raw_user_meta_data?.full_name ||
                         (user as any).raw_user_meta_data?.name ||
                         (user as any).raw_user_meta_data?.display_name ||
                         // Try first name + last name combination
                         ((user.user_metadata?.first_name || (user as any).raw_user_meta_data?.first_name) &&
                          (user.user_metadata?.last_name || (user as any).raw_user_meta_data?.last_name) ?
                          `${user.user_metadata?.first_name || (user as any).raw_user_meta_data?.first_name} ${user.user_metadata?.last_name || (user as any).raw_user_meta_data?.last_name}` : null) ||
                         (user.email ? user.email.split('@')[0] : null) ||
                         'User'

      console.log('📝 ensureUserProfileExists: Creating profile with display_name:', displayName)
      console.log('🔍 ensureUserProfileExists: Available metadata sources:', {
        user_metadata: user.user_metadata,
        raw_user_meta_data: (user as any).raw_user_meta_data
      })

      // Try using RPC function first (more reliable when trigger is disabled)
      try {
        console.log('🔧 ensureUserProfileExists: Trying RPC function approach')
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('create_profile_for_user', { target_user_id: user.id })

        console.log('🔧 ensureUserProfileExists: RPC result:', { rpcResult, rpcError })

        if (!rpcError && rpcResult === true) {
          console.log('✅ ensureUserProfileExists: Profile created via RPC function')

          // Wait a moment for the profile to be available
          await new Promise(resolve => setTimeout(resolve, 500))

          // Fetch the created profile
          const { data: createdProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, user_id, display_name')
            .eq('user_id', user.id)
            .single()

          if (createdProfile && !fetchError) {
            console.log('✅ ensureUserProfileExists: Profile fetched successfully:', createdProfile.id)
            return createdProfile
          } else {
            console.log('⚠️ ensureUserProfileExists: Could not fetch created profile, trying direct insert')
          }
        } else {
          console.log('⚠️ ensureUserProfileExists: RPC function failed, trying direct insert. Error:', rpcError)
        }
      } catch (rpcError) {
        console.log('⚠️ ensureUserProfileExists: RPC function not available, trying direct insert. Error:', rpcError)
      }

      // Fallback to direct insert
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: displayName
        })
        .select('id, user_id, display_name')
        .single()

      if (error) {
        console.error(`❌ ensureUserProfileExists: Insert error on attempt ${attempt}:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        if (error.code === '23505') {
          // Unique constraint violation - profile was created by another process
          console.log('⚠️ ensureUserProfileExists: Profile created by another process, fetching it')

          // Wait a bit for the other process to complete
          await new Promise(resolve => setTimeout(resolve, 500))

          const { data: fetchedProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, user_id, display_name')
            .eq('user_id', user.id)
            .single()

          if (fetchedProfile) {
            console.log('✅ ensureUserProfileExists: Retrieved existing profile:', fetchedProfile.id)
            return fetchedProfile
          }

          if (fetchError) {
            console.error('❌ ensureUserProfileExists: Failed to fetch existing profile:', fetchError)
          }
        }

        // Handle permission/RLS errors specifically
        if (error.message?.includes('permission') || error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Profile creation failed due to permissions. This may be a database configuration issue.')
        }

        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return data

    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Follow Functions
export async function followUser(followingId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_follows')
    .insert({
      follower_id: user.id,
      following_id: followingId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unfollowUser(followingId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) throw error
}

export async function getFollowers(userId: string): Promise<UserFollow[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      follower:user_profiles!user_follows_follower_id_fkey(*)
    `)
    .eq('following_id', userId)

  if (error) throw error
  return data || []
}

export async function getFollowing(userId: string): Promise<UserFollow[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      following:user_profiles!user_follows_following_id_fkey(*)
    `)
    .eq('follower_id', userId)

  if (error) throw error
  return data || []
}

export async function getFollowCounts(userId: string) {
  return withCache(
    CACHE_KEYS.FOLLOW_COUNTS(userId),
    async () => {
      // Use a single query with aggregation for better performance
      const { data, error } = await supabase
        .rpc('get_follow_counts', { target_user_id: userId })

      if (error) {
        // Fallback to separate queries if RPC doesn't exist
        const [followersResult, followingResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId)
        ])

        return {
          followers: followersResult.count || 0,
          following: followingResult.count || 0
        }
      }

      return data || { followers: 0, following: 0 }
    },
    1 * 60 * 1000 // Cache for 1 minute
  )
}

export async function isFollowing(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// Search users
export async function searchUsers(query: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`display_name.ilike.%${query}%`)
    .limit(20)

  if (error) throw error
  return data || []
}
