import { supabase } from './supabase'
import type { UserProfile, UserFollow } from '@/types'
import { withCache, CACHE_KEYS, invalidateUserCaches } from './cache'

// User Profile Functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Temporarily disable caching to avoid issues
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    throw error
  }
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
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
