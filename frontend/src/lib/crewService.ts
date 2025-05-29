import { supabase } from './supabase'

export interface Crew {
  id: string
  name: string
  vibe: 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
  visibility: 'public' | 'private'
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  is_member?: boolean
  is_creator?: boolean
}

export interface CrewMember {
  id: string
  crew_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  invited_by?: string
  joined_at: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email?: string
  }
}

export interface CrewInvitation {
  id: string
  crew_id: string
  invite_code: string
  created_by: string
  expires_at?: string
  max_uses?: number
  current_uses: number
  created_at: string
  updated_at: string
}

export interface CreateCrewData {
  name: string
  vibe: 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
  visibility: 'public' | 'private'
  description?: string
}

// Create a new crew
export async function createCrew(crewData: CreateCrewData): Promise<Crew> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('crews')
    .insert({
      name: crewData.name,
      vibe: crewData.vibe,
      visibility: crewData.visibility,
      description: crewData.description,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get user's crews (where they are a member)
export async function getUserCrews(userId?: string): Promise<Crew[]> {
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = userId || user?.id
  if (!currentUserId) {
    console.log('❌ getUserCrews: No user ID provided')
    return []
  }

  console.log('🔍 getUserCrews: Fetching crews for user:', currentUserId)

  const { data, error } = await supabase
    .from('crew_members')
    .select(`
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
    .eq('user_id', currentUserId)
    .eq('status', 'accepted')

  console.log('🔍 getUserCrews: Raw crew_members data:', data)
  console.log('🔍 getUserCrews: Raw crew_members data details:', JSON.stringify(data, null, 2))
  console.log('🔍 getUserCrews: Query error:', error)

  if (error) throw error

  // Transform the data and add member count
  const crews = data?.map(item => item.crew).filter(Boolean) || []
  console.log('🔍 getUserCrews: Transformed crews:', crews)

  // Get member counts for each crew
  const crewsWithCounts = await Promise.all(
    crews.map(async (crew: any) => {
      const { count } = await supabase
        .from('crew_members')
        .select('*', { count: 'exact', head: true })
        .eq('crew_id', crew.id)
        .eq('status', 'accepted')

      return {
        ...crew,
        member_count: count || 0,
        is_member: true,
        is_creator: crew.created_by === currentUserId
      } as Crew
    })
  )

  console.log('✅ getUserCrews: Final crews with counts:', crewsWithCounts)
  return crewsWithCounts
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

  // Get member count
  const { count } = await supabase
    .from('crew_members')
    .select('*', { count: 'exact', head: true })
    .eq('crew_id', crewId)
    .eq('status', 'accepted')

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

    isMember = !!memberData
  }

  return {
    ...data,
    member_count: count || 0,
    is_member: isMember,
    is_creator: data.created_by === user?.id
  }
}

// Get crew members
export async function getCrewMembers(crewId: string): Promise<CrewMember[]> {
  // First get the crew members
  const { data: members, error } = await supabase
    .from('crew_members')
    .select('*')
    .eq('crew_id', crewId)
    .eq('status', 'accepted')
    .order('joined_at', { ascending: true })

  if (error) throw error
  if (!members || members.length === 0) return []

  // Then get user profiles for each member
  const userIds = members.map(member => member.user_id)
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)

  if (profileError) {
    console.warn('Error fetching user profiles:', profileError)
    // Return members without profile data if profiles fail
    return members.map(member => ({
      ...member,
      user: undefined
    }))
  }

  // Combine members with their profiles
  return members.map(member => {
    const profile = profiles?.find(p => p.user_id === member.user_id)
    return {
      ...member,
      user: profile ? {
        id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url
      } : undefined
    }
  })
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

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
