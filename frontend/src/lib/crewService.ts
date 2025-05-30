import { supabase } from './supabase'
import type { Crew, CrewMember, CreateCrewData } from '@/types'

// Get user's crews (where they are a member)
export async function getUserCrews(userId?: string): Promise<Crew[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = userId || user?.id
    if (!currentUserId) {
      return []
    }

    console.log('🔍 getUserCrews: Fetching crews for user:', currentUserId)

    // Use a more robust approach that avoids potential RLS issues
    // First, get the crew IDs where the user is a member
    const { data: membershipData, error: membershipError } = await supabase
      .from('crew_members')
      .select('crew_id')
      .eq('user_id', currentUserId)
      .eq('status', 'accepted')

    if (membershipError) {
      console.error('❌ Error fetching user crews:', membershipError)
      throw membershipError
    }

    if (!membershipData || membershipData.length === 0) {
      console.log('✅ getUserCrews: No crew memberships found')
      return []
    }

    const crewIds = membershipData.map(m => m.crew_id)
    console.log('🔍 getUserCrews: Found crew IDs:', crewIds)

    // Then fetch the crew details directly
    const { data: crewsData, error: crewsError } = await supabase
      .from('crews')
      .select('*')
      .in('id', crewIds)

    if (crewsError) {
      console.error('❌ Error fetching crew details:', crewsError)
      throw crewsError
    }

    if (!crewsData) {
      console.log('✅ getUserCrews: No crew data found')
      return []
    }

    console.log('🔍 getUserCrews: Found crews:', crewsData.length)

    // Get member counts for each crew (including creator, but avoid double counting)
    const crewsWithCounts = await Promise.all(
      crewsData.map(async (crew: any) => {
        try {
          const { count } = await supabase
            .from('crew_members')
            .select('*', { count: 'exact', head: true })
            .eq('crew_id', crew.id)
            .eq('status', 'accepted')

          // Check if creator is already in crew_members table
          const { data: creatorMembership } = await supabase
            .from('crew_members')
            .select('id')
            .eq('crew_id', crew.id)
            .eq('user_id', crew.created_by)
            .eq('status', 'accepted')
            .maybeSingle()

          // Add 1 for creator only if they're not already counted in crew_members
          const totalMembers = (count || 0) + (creatorMembership ? 0 : 1)

          return {
            ...crew,
            member_count: totalMembers,
            is_member: true,
            is_creator: crew.created_by === currentUserId
          } as Crew
        } catch (error) {
          console.error('❌ Error getting member count for crew:', crew.id, error)
          // Return crew with just creator count if there's an error
          return {
            ...crew,
            member_count: 1, // At least the creator
            is_member: true,
            is_creator: crew.created_by === currentUserId
          } as Crew
        }
      })
    )

    console.log('✅ getUserCrews: Successfully loaded crews with counts')
    return crewsWithCounts
  } catch (error) {
    console.error('❌ getUserCrews: Unexpected error:', error)
    throw error
  }
}

// Create a new crew
export async function createCrew(data: CreateCrewData): Promise<Crew> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: crew, error } = await supabase
    .from('crews')
    .insert({
      ...data,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return crew
}

// Get crew details by ID
export async function getCrewById(crewId: string): Promise<Crew | null> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('crews')
    .select('*')
    .eq('id', crewId)
    .single()

  if (error) return null

  // Get member count (including creator, but avoid double counting)
  const { count } = await supabase
    .from('crew_members')
    .select('*', { count: 'exact', head: true })
    .eq('crew_id', crewId)
    .eq('status', 'accepted')

  // Check if creator is already in crew_members table
  const { data: creatorMembership } = await supabase
    .from('crew_members')
    .select('id')
    .eq('crew_id', crewId)
    .eq('user_id', data.created_by)
    .eq('status', 'accepted')
    .maybeSingle()

  // Add 1 for creator only if they're not already counted in crew_members
  const totalMembers = (count || 0) + (creatorMembership ? 0 : 1)

  // Check if current user is a member
  let isMember = false
  if (user) {
    const { data: memberData } = await supabase
      .from('crew_members')
      .select('id')
      .eq('crew_id', crewId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle()

    isMember = !!memberData || data.created_by === user.id // Creator is always a member
  }

  return {
    ...data,
    member_count: totalMembers,
    is_member: isMember,
    is_creator: data.created_by === user?.id
  }
}

// Get crew members
export async function getCrewMembers(crewId: string): Promise<CrewMember[]> {
  try {
    // First get the crew info to get the creator and creation date
    const { data: crewData, error: crewError } = await supabase
      .from('crews')
      .select('created_by, created_at')
      .eq('id', crewId)
      .single()

    if (crewError) throw crewError

    // Get all crew members (excluding creator to avoid duplicates)
    const { data: members, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('crew_id', crewId)
      .eq('status', 'accepted')
      .order('joined_at', { ascending: true })

    if (error) throw error

    // Collect all user IDs (members + creator)
    const memberUserIds = members?.map(member => member.user_id) || []
    const allUserIds = [...new Set([crewData.created_by, ...memberUserIds])]

    // Get user profiles for all users
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', allUserIds)

    if (profileError) {
      console.warn('Error fetching user profiles:', profileError)
    }

    // Create result array
    const result: CrewMember[] = []

    // Check if creator is in crew_members table
    const creatorInMembers = members?.find(member => member.user_id === crewData.created_by)

    if (creatorInMembers) {
      // Creator is in crew_members, use their actual data
      const profile = profiles?.find(p => p.user_id === crewData.created_by)
      result.push({
        ...creatorInMembers,
        user: profile ? {
          id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        } : {
          id: creatorInMembers.user_id,
          display_name: 'Unknown User',
          avatar_url: null
        }
      })
    } else {
      // Creator is not in crew_members, add them manually
      const creatorProfile = profiles?.find(p => p.user_id === crewData.created_by)
      if (creatorProfile) {
        result.push({
          id: `creator-${crewData.created_by}`,
          crew_id: crewId,
          user_id: crewData.created_by,
          status: 'accepted' as const,
          joined_at: crewData.created_at, // Use crew creation date
          created_at: crewData.created_at, // Use crew creation date
          updated_at: crewData.created_at, // Use crew creation date
          user: {
            id: creatorProfile.user_id,
            display_name: creatorProfile.display_name,
            avatar_url: creatorProfile.avatar_url
          }
        })
      }
    }

    // Add all other members (excluding creator if already added)
    if (members) {
      for (const member of members) {
        // Skip creator if already added above
        if (member.user_id === crewData.created_by) continue

        const profile = profiles?.find(p => p.user_id === member.user_id)
        result.push({
          ...member,
          user: profile ? {
            id: profile.user_id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          } : {
            id: member.user_id,
            display_name: 'Unknown User',
            avatar_url: null
          }
        })
      }
    }

    return result
  } catch (error) {
    console.error('Error getting crew members:', error)
    throw error
  }
}

// Invite user to crew by user ID
export async function inviteUserToCrew(crewId: string, userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('crew_members')
    .insert({
      crew_id: crewId,
      user_id: userId,
      status: 'pending',
      invited_by: user.id
    })

  if (error) throw error
}

// Invite user to crew by username/email
export async function inviteUserByIdentifier(crewId: string, identifier: string): Promise<void> {
  // Search for user by display name in user_profiles
  // Note: We can't directly query auth.users from client for security reasons
  // So we only search by display name for now
  const { data: userProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name')
    .ilike('display_name', `%${identifier}%`)
    .limit(10)

  if (profileError) throw profileError
  if (!userProfiles || userProfiles.length === 0) throw new Error('User not found')

  // If multiple users found, try to find exact match first
  let selectedUser = userProfiles.find(user =>
    user.display_name?.toLowerCase() === identifier.toLowerCase()
  )

  // If no exact match, use the first result
  if (!selectedUser) {
    selectedUser = userProfiles[0]
  }

  await inviteUserToCrew(crewId, selectedUser.user_id)
}

// Enhanced invite function with fallback to share link
export async function inviteUserWithFallback(crewId: string, identifier: string): Promise<{ success: boolean; shareLink?: string; message: string }> {
  try {
    await inviteUserByIdentifier(crewId, identifier)
    return { success: true, message: 'Invite sent successfully!' }
  } catch (error: any) {
    if (error.message === 'User not found') {
      // User doesn't exist, create a shareable invite link
      const shareLink = await createCrewInviteLink(crewId, 7) // 7 days expiry
      return {
        success: false,
        shareLink,
        message: `We didn't find anyone with that username.\nWanna bring them to the party?\nShare this invite link to Thirstee 👉`
      }
    }
    throw error
  }
}

// Bulk invite multiple users to crew
export async function bulkInviteUsersToCrew(crewId: string, userIds: string[]): Promise<void> {
  // Use the existing inviteUserToCrew function for each user to ensure proper RLS handling
  const invitePromises = userIds.map(userId => inviteUserToCrew(crewId, userId))
  await Promise.all(invitePromises)
}

// Respond to crew invitation
export async function respondToCrewInvitation(crewMemberId: string, status: 'accepted' | 'declined'): Promise<void> {
  const { error } = await supabase
    .from('crew_members')
    .update({ status })
    .eq('id', crewMemberId)

  if (error) throw error
}

// Get pending crew invitations for current user
export async function getPendingCrewInvitations(): Promise<Array<CrewMember & { crew: Crew }>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('crew_members')
    .select(`
      *,
      crew:crews(
        id,
        name,
        vibe,
        visibility,
        description,
        created_by,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(invitation => ({
    ...invitation,
    crew: invitation.crew
  })) || []
}

// Create shareable invite link
export async function createCrewInviteLink(crewId: string, expiresInDays?: number, maxUses?: number): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    const { data: existing } = await supabase
      .from('crew_invitations')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (!existing) {
      isUnique = true
    } else {
      inviteCode = generateInviteCode()
      attempts++
    }
  }

  if (!isUnique) throw new Error('Failed to generate unique invite code')

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('crew_invitations')
    .insert({
      crew_id: crewId,
      invite_code: inviteCode,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: maxUses
    })

  if (error) throw error

  return `${window.location.origin}/crew/join/${inviteCode}`
}

// Join crew via invite code
export async function joinCrewByInviteCode(inviteCode: string): Promise<Crew> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get invitation details
  const { data: invitation, error: inviteError } = await supabase
    .from('crew_invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (inviteError || !invitation) throw new Error('Invalid invite code')

  // Check if invitation is expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new Error('Invite link has expired')
  }

  // Check if max uses reached
  if (invitation.max_uses && invitation.current_uses >= invitation.max_uses) {
    throw new Error('Invite link has reached maximum uses')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('crew_members')
    .select('id')
    .eq('crew_id', invitation.crew_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) throw new Error('You are already a member of this crew')

  // Add user to crew
  const { error: memberError } = await supabase
    .from('crew_members')
    .insert({
      crew_id: invitation.crew_id,
      user_id: user.id,
      status: 'accepted',
      invited_by: invitation.created_by
    })

  if (memberError) throw memberError

  // Update invitation usage count
  await supabase
    .from('crew_invitations')
    .update({ current_uses: invitation.current_uses + 1 })
    .eq('id', invitation.id)

  // Get crew details
  const crew = await getCrewById(invitation.crew_id)
  if (!crew) throw new Error('Crew not found')

  return crew
}

// Leave crew
export async function leaveCrew(crewId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', user.id)

  if (error) throw error
}

// Remove member from crew (crew creator only)
export async function removeMemberFromCrew(crewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId)

  if (error) throw error
}

// Search users for crew invitation
export async function searchUsersForInvite(query: string, crewId?: string): Promise<Array<{ user_id: string; display_name: string; avatar_url: string | null }>> {
  if (!query.trim()) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Search by display name in user_profiles
  // Note: We can't directly query auth.users from client for security reasons
  // So we only search by display name for now
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .ilike('display_name', `%${query}%`)
    .neq('user_id', user.id) // Exclude current user
    .limit(20) // Get more results to filter out existing members

  if (profileError) throw profileError

  let filteredResults = profileData || []

  // If crewId is provided, filter out existing crew members
  if (crewId && filteredResults.length > 0) {
    const userIds = filteredResults.map(u => u.user_id)

    const { data: existingMembers, error: membersError } = await supabase
      .from('crew_members')
      .select('user_id')
      .eq('crew_id', crewId)
      .in('user_id', userIds)

    if (membersError) throw membersError

    const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || [])
    filteredResults = filteredResults.filter(user => !existingMemberIds.has(user.user_id))
  }

  return filteredResults.slice(0, 10) // Return max 10 results
}

// Update crew
export async function updateCrew(crewId: string, updates: Partial<Crew>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('crews')
    .update(updates)
    .eq('id', crewId)
    .eq('created_by', user.id) // Only creator can edit

  if (error) throw error
}

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
