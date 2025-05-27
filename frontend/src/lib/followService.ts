import { supabase } from './supabase'

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'follow_request' | 'follow_accepted' | 'event_invitation' | 'event_update'
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export interface InnerCircleMember {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  email?: string
}

// Follow Management
export async function sendFollowRequest(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
      status: 'pending'
    })

  if (error) throw error
}

export async function respondToFollowRequest(followId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .update({ status })
    .eq('id', followId)

  if (error) throw error
}

export async function unfollowUser(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  if (error) throw error
}

// Get follow status between two users
export async function getFollowStatus(followingId: string): Promise<Follow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Get Inner Circle members (people YOU follow)
export async function getInnerCircle(userId?: string): Promise<InnerCircleMember[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = userId || user?.id
  if (!currentUserId) return []

  // Try the new follows table first - get people that the current user follows
  let { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('id, following_id')
    .eq('follower_id', currentUserId)
    .eq('status', 'accepted')

  // If no data in new table or error, try the old user_follows table
  if ((!follows || follows.length === 0) && !followsError) {
    const { data: oldFollows, error: oldFollowsError } = await supabase
      .from('user_follows')
      .select('id, following_id')
      .eq('follower_id', currentUserId)

    if (!oldFollowsError && oldFollows && oldFollows.length > 0) {
      // Convert old format to new format
      follows = oldFollows.map(follow => ({
        id: follow.id,
        following_id: follow.following_id
      }))
    }
  }

  if (followsError) throw followsError
  if (!follows || follows.length === 0) return []

  // Get the user profiles for the people you follow
  const followingIds = follows.map(follow => follow.following_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', followingIds)

  if (profilesError) throw profilesError

  // Combine the data
  return follows.map(follow => {
    const profile = profiles?.find(p => p.user_id === follow.following_id)
    return {
      id: follow.id,
      user_id: follow.following_id,
      display_name: profile?.display_name || null,
      avatar_url: profile?.avatar_url || null
    }
  })
}

// Get Inner Circle count
export async function getInnerCircleCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
    .eq('status', 'accepted')

  if (error) throw error
  return count || 0
}

// Get pending follow requests
export async function getPendingFollowRequests(): Promise<Array<Follow & { follower: InnerCircleMember }>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // First get the follow requests
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('*')
    .eq('following_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (followsError) throw followsError
  if (!follows || follows.length === 0) return []

  // Then get the user profiles for the followers
  const followerIds = follows.map(follow => follow.follower_id)
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', followerIds)

  if (profilesError) throw profilesError

  // Combine the data
  return follows.map(follow => {
    const profile = profiles?.find(p => p.user_id === follow.follower_id)
    return {
      ...follow,
      follower: {
        id: follow.id,
        user_id: follow.follower_id,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null
      }
    }
  })
}

// Notification Management
export async function getNotifications(): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

// Check if a user is in your Inner Circle (accepted follow)
export async function isInInnerCircle(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Try the new follows table first
  let { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .eq('status', 'accepted')
    .maybeSingle()

  // If no data in new table, try the old user_follows table
  if (!data && !error) {
    const { data: oldData, error: oldError } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle()

    if (!oldError && oldData) {
      return true
    }
  }

  if (error) throw error
  return !!data
}
