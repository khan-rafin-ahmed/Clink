import { supabase } from './supabase'
import { getCurrentUser } from './authUtils'
import type { Crew, CrewMember, CreateCrewData } from '@/types'
import { generateTokenizedUrls } from './invitationTokenService'

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

// Get user's crews (where they are a member)
export async function getUserCrews(userId?: string, viewerId?: string): Promise<Crew[]> {
  try {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id // The user whose crews we're fetching
    const currentUserId = viewerId || user?.id // The user who is viewing (for permissions)
    if (!targetUserId) {
      return []
    }

    // Use a more robust approach that avoids potential RLS issues
    // First, get the crew IDs where the target user is a member
    const { data: membershipData, error: membershipError } = await supabase
      .from('crew_members')
      .select('crew_id')
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')

    if (membershipError) {
      throw membershipError
    }

    if (!membershipData || membershipData.length === 0) {
      return []
    }

    const crewIds = membershipData.map(m => m.crew_id)

    // Then fetch the crew details directly
    const { data: crewsData, error: crewsError } = await supabase
      .from('crews')
      .select('*')
      .in('id', crewIds)

    if (crewsError) {
      debugError('❌ Error fetching crew details:', crewsError)
      throw crewsError
    }

    if (!crewsData) {
      debugLog('✅ getUserCrews: No crew data found')
      return []
    }

    debugLog('🔍 getUserCrews: Found crews:', crewsData.length)

    // Map crewId -> creator to easily check membership inclusion
    const creatorMap: Record<string, string> = {}
    crewsData.forEach((crew: any) => {
      creatorMap[crew.id] = crew.created_by
    })

    // Fetch all accepted crew_members for these crews in one request, including role information
    const { data: memberRows, error: membersError } = await supabase
      .from('crew_members')
      .select('crew_id, user_id, role')
      .in('crew_id', crewIds)
      .eq('status', 'accepted')

    if (membersError) {
      debugError('❌ Error fetching crew member rows:', membersError)
      throw membersError
    }

    // Build lookup of counts, creator inclusion, and user roles
    const membershipMap: Record<string, { count: number; creatorIncluded: boolean; userRole: string | null }> = {}
    memberRows?.forEach(row => {
      if (!membershipMap[row.crew_id]) {
        membershipMap[row.crew_id] = { count: 0, creatorIncluded: false, userRole: null }
      }
      membershipMap[row.crew_id].count += 1
      if (row.user_id === creatorMap[row.crew_id]) {
        membershipMap[row.crew_id].creatorIncluded = true
      }
      // Track the viewer's role in this crew (for permission calculation)
      if (row.user_id === currentUserId) {
        membershipMap[row.crew_id].userRole = row.role
      }
    })

    const crewsWithCounts = crewsData.map((crew: any) => {
      const info = membershipMap[crew.id] || { count: 0, creatorIncluded: false, userRole: null }
      const totalMembers = info.count + (info.creatorIncluded ? 0 : 1)

      // Calculate permissions from the viewer's perspective (currentUserId)
      const isCreator = crew.created_by === currentUserId
      const viewerRole = info.userRole || (isCreator ? 'host' : null)
      const canManage = isCreator || info.userRole === 'co_host'

      // The target user is always a member of their own crews
      const isTargetUserCreator = crew.created_by === targetUserId

      return {
        ...crew,
        member_count: totalMembers,
        is_member: true, // Target user is always a member of their crews
        is_creator: isTargetUserCreator, // Whether the target user created this crew
        user_role: viewerRole, // Viewer's role in this crew
        can_manage: canManage // Whether the viewer can manage this crew
      } as Crew
    })

    debugLog('✅ getUserCrews: Successfully loaded crews with counts')
    return crewsWithCounts
  } catch (error) {
    debugError('❌ getUserCrews: Unexpected error:', error)
    throw error
  }
}

// Create a new crew
export async function createCrew(data: CreateCrewData): Promise<Crew> {
  const user = await getCurrentUser()
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
  const user = await getCurrentUser()

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

  // Check if current user is a member and get their role
  let isMember = false
  let userRole: string | null = null
  let canManage = false

  if (user) {
    const { data: memberData } = await supabase
      .from('crew_members')
      .select('id, role')
      .eq('crew_id', crewId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle()

    isMember = !!memberData || data.created_by === user.id // Creator is always a member
    userRole = memberData?.role || (data.created_by === user.id ? 'host' : null)
    canManage = data.created_by === user.id || memberData?.role === 'co_host'
  }

  return {
    ...data,
    member_count: totalMembers,
    is_member: isMember,
    is_creator: data.created_by === user?.id,
    user_role: userRole,
    can_manage: canManage
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

    // Get all accepted crew members (excluding creator to avoid duplicates)
    const { data: members, error } = await supabase
      .from('crew_members')
      .select('*, role')
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
      .select('user_id, display_name, nickname, avatar_url')
      .in('user_id', allUserIds)

    if (profileError) {
      // Continue without profiles if there's an error
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
          nickname: profile.nickname,
          avatar_url: profile.avatar_url
        } : {
          id: creatorInMembers.user_id,
          display_name: 'Unknown User',
          nickname: null,
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
          role: 'host' as const,
          joined_at: crewData.created_at, // Use crew creation date
          created_at: crewData.created_at, // Use crew creation date
          updated_at: crewData.created_at, // Use crew creation date
          user: {
            id: creatorProfile.user_id,
            display_name: creatorProfile.display_name,
            nickname: creatorProfile.nickname,
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
            nickname: profile.nickname,
            avatar_url: profile.avatar_url
          } : {
            id: member.user_id,
            display_name: 'Unknown User',
            nickname: null,
            avatar_url: null
          }
        })
      }
    }

    console.log('🔍 getCrewMembers result:', {
      crewId,
      memberCount: result.length,
      roles: result.map(m => ({ userId: m.user_id, role: m.role, displayName: m.user?.display_name }))
    })

    return result
  } catch (error) {
    console.error('Error getting crew members:', error)
    throw error
  }
}

// Get pending invitation requests (to display but not count)
export async function getCrewPendingRequests(crewId: string): Promise<CrewMember[]> {
  // Step 1: Query crew_members for pending rows
  const { data: rows, error: rowsError } = await supabase
    .from('crew_members')
    .select('id, crew_id, user_id, status, role, joined_at, created_at, updated_at')
    .eq('crew_id', crewId)
    .eq('status', 'pending')
    .order('joined_at', { ascending: true });
  if (rowsError) {
    console.error('❌ Error getting pending crew requests:', rowsError)
    throw rowsError;
  }

  // Step 2: Extract unique user_ids and fetch profiles
  const userIds = Array.from(new Set((rows || []).map(r => r.user_id)));
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, nickname, avatar_url')
    .in('user_id', userIds);
  if (profileError) throw profileError;

  // Step 3: Map rows into CrewMember[] merging profile lookup
  return (rows || []).map(row => {
    const prof = profiles?.find(p => p.user_id === row.user_id);
    return {
      ...row,
      user: prof
        ? { id: prof.user_id, display_name: prof.display_name, nickname: prof.nickname, avatar_url: prof.avatar_url }
        : undefined
    };
  });
}

// Helper function to send crew invitation email
async function sendCrewInvitationEmailToUser(crewId: string, userId: string, inviterId: string, invitationId: string): Promise<void> {
  try {
    console.log('📧 Sending crew invitation email:', { crewId, userId, inviterId })

    // Get crew details
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .select('id, name, description')
      .eq('id', crewId)
      .single()

    if (crewError || !crew) {
      console.error('Crew not found:', crewError)
      return
    }

    // Get invited user's email with fallback strategy
    let invitedUser: { display_name: string; email: string } | null = null

    // First, try to get email from user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('display_name, email')
      .eq('user_id', userId)
      .single()

    if (profileData && profileData.email) {
      invitedUser = profileData
      console.log('✅ Found email in user_profiles:', profileData.email)
    } else {
      console.log('⚠️ No email in user_profiles, trying secure function fallback...')

      // Fallback: Use secure function to get email from auth.users
      const { data: secureData, error: secureError } = await supabase
        .rpc('get_user_email_for_invitation', { p_user_id: userId })
        .single()

      if (secureData && (secureData as any).email) {
        invitedUser = {
          display_name: (secureData as any).display_name,
          email: (secureData as any).email
        }
        console.log('✅ Found email via secure function:', (secureData as any).email)
      } else {
        console.error('❌ No email found for user:', { userId, profileError, secureError })
        return
      }
    }

    if (!invitedUser) {
      console.error('Invited user not found or no email available')
      return
    }

    if (!invitedUser.email) {
      console.warn(`No email found for user ${userId} (${invitedUser.display_name}), skipping email notification`)
      return
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', inviterId)
      .single()

    if (inviterError || !inviter) {
      console.error('Inviter not found:', inviterError)
      return
    }

    // Get crew member count
    const { count: memberCount } = await supabase
      .from('crew_members')
      .select('*', { count: 'exact' })
      .eq('crew_id', crewId)
      .eq('status', 'accepted')

    // Generate secure tokenized URLs for invitation actions
    let acceptUrl, declineUrl
    try {
      const urls = await generateTokenizedUrls('crew', invitationId, userId)
      acceptUrl = urls.acceptUrl
      declineUrl = urls.declineUrl
    } catch (error) {
      // Fallback to basic URLs if token generation fails
      acceptUrl = `https://thirstee.app/crew/${crew.id}`
      declineUrl = `https://thirstee.app/crew/${crew.id}`
    }

    // Prepare email data
    const emailData = {
      crewName: crew.name,
      inviterName: inviter.display_name,
      crewDescription: crew.description || '',
      memberCount: memberCount || 0,
      acceptUrl,
      declineUrl,
      crewUrl: `https://thirstee.app/crew/${crew.id}`
    }


    // Call Edge Function directly
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: invitedUser.email,
        subject: `🤘 You're invited to join ${crew.name}`,
        type: 'crew_invitation',
        data: emailData
      }
    })

    if (error) {
      throw new Error('Failed to send crew invitation email')
    }

  } catch (error) {
    // Silently fail email sending to not break the invitation process
  }
}

// Invite user to crew by user ID
export async function inviteUserToCrew(crewId: string, userId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  console.log('🔍 Attempting to invite user to crew:', { crewId, userId, inviterId: user.id })

  // Check if user is already a member or has a pending invitation
  const { data: existingMember, error: checkError } = await supabase
    .from('crew_members')
    .select('id, status, role')
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .maybeSingle()

  if (checkError) {
    console.error('🔍 Error checking existing membership:', checkError)
    throw checkError
  }

  if (existingMember) {
    console.log('🔍 User already has membership record:', existingMember)

    if (existingMember.status === 'accepted') {
      throw new Error('User is already a member of this crew')
    } else if (existingMember.status === 'pending') {
      throw new Error('User already has a pending invitation to this crew')
    } else if (existingMember.status === 'declined') {
      // User previously declined, update the existing record to pending
      console.log('🔍 User previously declined, updating to pending')
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('crew_members')
        .update({
          status: 'pending',
          invited_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)
        .select()
        .single()

      if (updateError) {
        console.error('🔍 Error updating declined invitation:', updateError)
        throw updateError
      }

      console.log('🔍 Successfully updated declined invitation to pending')

      // Send email invitation
      try {
        await sendCrewInvitationEmailToUser(crewId, userId, user.id, updatedInvitation.id)
      } catch (emailError) {
        console.error('⚠️ Failed to send crew invitation email:', emailError)
        // Don't fail the whole operation if email fails
      }
      return
    }
  }

  // No existing record, create new invitation
  console.log('🔍 Creating new invitation record')
  const { data: invitation, error } = await supabase
    .from('crew_members')
    .insert({
      crew_id: crewId,
      user_id: userId,
      status: 'pending',
      invited_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('🔍 Error creating invitation:', error)
    throw error
  }

  console.log('🔍 Successfully created invitation:', invitation.id)

  // Send email invitation with the invitation ID
  try {
    await sendCrewInvitationEmailToUser(crewId, userId, user.id, invitation.id)
  } catch (emailError) {
    console.error('⚠️ Failed to send crew invitation email:', emailError)
    // Don't fail the whole operation if email fails
  }
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
export async function bulkInviteUsersToCrew(crewId: string, userIds: string[]): Promise<{
  successful: string[],
  failed: Array<{ userId: string, error: string }>
}> {
  console.log('🔍 Bulk inviting users to crew:', { crewId, userCount: userIds.length })

  const successful: string[] = []
  const failed: Array<{ userId: string, error: string }> = []

  // Process invitations sequentially to avoid overwhelming the database
  for (const userId of userIds) {
    try {
      await inviteUserToCrew(crewId, userId)
      successful.push(userId)
      console.log('🔍 Successfully invited user:', userId)
    } catch (error: any) {
      console.error('🔍 Failed to invite user:', { userId, error: error.message })
      failed.push({ userId, error: error.message })
    }
  }

  console.log('🔍 Bulk invitation results:', {
    successful: successful.length,
    failed: failed.length,
    failedDetails: failed
  })

  return { successful, failed }
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
  const user = await getCurrentUser()
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
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    const { data: existing, error: checkError } = await supabase
      .from('crew_invitations')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (checkError) {
      if (checkError.message?.includes('relation "crew_invitations" does not exist')) {
        throw new Error('Crew invitation system is not set up. Please contact support.')
      }
      throw checkError
    }

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
      max_uses: maxUses,
      current_uses: 0
    })

  if (error) {
    if (error.message?.includes('relation "crew_invitations" does not exist')) {
      throw new Error('Crew invitation system is not set up. Please contact support.')
    }
    throw error
  }

  return `${window.location.origin}/crew/join/${inviteCode}`
}

// Join crew via invite code
export async function joinCrewByInviteCode(inviteCode: string): Promise<Crew> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  console.log('Looking up invite code:', inviteCode)

  // Get invitation details
  const { data: invitation, error: inviteError } = await supabase
    .from('crew_invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  console.log('Invitation lookup result:', { invitation, inviteError })

  if (inviteError) {
    console.error('Database error looking up invite:', inviteError)
    if (inviteError.code === 'PGRST116') {
      throw new Error('Invalid invite code - invitation not found')
    } else if (inviteError.message?.includes('relation "crew_invitations" does not exist')) {
      throw new Error('Crew invitation system is not set up. Please contact support.')
    }
    throw new Error(`Database error: ${inviteError.message}`)
  }

  if (!invitation) {
    throw new Error('Invalid invite code - invitation not found')
  }

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
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', user.id)

  if (error) throw error
}

// Simplified co-host management functions
export async function promoteToCoHost(crewId: string, memberId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  console.log('🔍 Promoting member to co-host:', { crewId, memberId, promoterId: user.id })

  // Try RPC function first, fallback to direct update if it doesn't exist
  const { error: rpcError } = await supabase.rpc('promote_crew_member_to_cohost', {
    p_crew_id: crewId, p_member_id: memberId, p_promoter_id: user.id
  })

  if (rpcError) {
    console.log('🔍 RPC function failed, trying direct update:', rpcError)

    // Fallback: Direct database update
    const { error: updateError } = await supabase
      .from('crew_members')
      .update({ role: 'co_host' })
      .eq('crew_id', crewId)
      .eq('user_id', memberId)
      .eq('status', 'accepted')

    if (updateError) {
      console.error('🔍 Direct update also failed:', updateError)
      throw updateError
    }

    console.log('🔍 Successfully promoted using direct update')
  } else {
    console.log('🔍 Successfully promoted using RPC function')
  }
}

export async function demoteCoHost(crewId: string, memberId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  console.log('🔍 Demoting co-host to member:', { crewId, memberId, demoterId: user.id })

  // Try RPC function first, fallback to direct update if it doesn't exist
  const { error: rpcError } = await supabase.rpc('demote_crew_cohost_to_member', {
    p_crew_id: crewId, p_member_id: memberId, p_demoter_id: user.id
  })

  if (rpcError) {
    console.log('🔍 RPC function failed, trying direct update:', rpcError)

    // Fallback: Direct database update
    const { error: updateError } = await supabase
      .from('crew_members')
      .update({ role: 'member' })
      .eq('crew_id', crewId)
      .eq('user_id', memberId)
      .eq('status', 'accepted')

    if (updateError) {
      console.error('🔍 Direct update also failed:', updateError)
      throw updateError
    }

    console.log('🔍 Successfully demoted using direct update')
  } else {
    console.log('🔍 Successfully demoted using RPC function')
  }
}

export async function removeCrewMember(crewId: string, memberId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the user has permission to remove members (crew creator or co-host)
  const hasPermission = await hasCrewManagementPermissions(crewId, user.id)
  if (!hasPermission) {
    throw new Error('You do not have permission to remove crew members')
  }

  // Remove the crew member directly
  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('id', memberId)
    .eq('crew_id', crewId)

  if (error) throw error
}

export async function hasCrewManagementPermissions(crewId: string, userId?: string): Promise<boolean> {
  const user = await getCurrentUser()
  const checkUserId = userId || user?.id
  if (!checkUserId) {
    console.log('🔍 hasCrewManagementPermissions: No user ID provided')
    return false
  }

  // First check if user is the crew creator
  const { data: crewData, error: crewError } = await supabase
    .from('crews')
    .select('created_by')
    .eq('id', crewId)
    .maybeSingle()

  if (crewError) {
    console.error('🔍 hasCrewManagementPermissions: Error fetching crew:', crewError)
    return false
  }

  if (crewData?.created_by === checkUserId) {
    console.log('🔍 hasCrewManagementPermissions: User is crew creator', { crewId, userId: checkUserId })
    return true
  }

  // Then check if user is a co-host
  const { data: memberData, error: memberError } = await supabase
    .from('crew_members')
    .select('role')
    .eq('crew_id', crewId)
    .eq('user_id', checkUserId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (memberError) {
    console.error('🔍 hasCrewManagementPermissions: Error fetching member data:', memberError)
    return false
  }

  const isCoHost = memberData?.role === 'co_host'
  console.log('🔍 hasCrewManagementPermissions: Member check result', {
    crewId,
    userId: checkUserId,
    memberRole: memberData?.role,
    isCoHost
  })

  return isCoHost
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

// Remove pending crew invitation (crew creator only)
export async function removePendingCrewInvitation(crewId: string, userId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the user is the crew creator
  const { data: crew, error: crewError } = await supabase
    .from('crews')
    .select('created_by')
    .eq('id', crewId)
    .single()

  if (crewError || !crew) {
    throw new Error('Crew not found')
  }

  if (crew.created_by !== user.id) {
    throw new Error('Only crew creator can remove pending invitations')
  }

  // Delete the pending invitation directly
  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) throw error
}

// Enhanced search users for crew invitation with multiple search criteria
export async function searchUsersForInvite(query: string, crewId?: string): Promise<Array<{ user_id: string; display_name: string; avatar_url: string | null; email?: string }>> {
  if (!query.trim()) return []

  const user = await getCurrentUser()
  if (!user) return []

  console.log('🔍 Searching for users with query:', query)

  // Search by display name, nickname, and tagline in user_profiles
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, nickname, tagline, avatar_url')
    .or(`display_name.ilike.%${query}%,nickname.ilike.%${query}%,tagline.ilike.%${query}%`)
    .neq('user_id', user.id) // Exclude current user
    .limit(20) // Get more results to filter out existing members

  if (profileError) {
    console.error('❌ Error searching user profiles:', profileError)
    throw profileError
  }

  console.log('📊 Profile search results:', profileData?.length || 0, 'users found')

  // Also search by email using RPC function for security
  let emailResults: any[] = []
  try {
    const { data: emailData, error: emailError } = await supabase
      .rpc('search_users_by_email', {
        search_query: query.toLowerCase(),
        current_user_id: user.id
      })

    if (!emailError && emailData) {
      emailResults = emailData
      console.log('📧 Email search results:', emailResults.length, 'users found')
    }
  } catch (error) {
    console.log('⚠️ Email search not available (RPC function may not exist)')
  }

  // Combine and deduplicate results
  const allResults = [...(profileData || []), ...emailResults]
  const uniqueResults = allResults.reduce((acc: Array<{ user_id: string; display_name: string; avatar_url: string | null; email?: string }>, current: any) => {
    const existing = acc.find((item: { user_id: string }) => item.user_id === current.user_id)
    if (!existing) {
      acc.push({
        user_id: current.user_id,
        display_name: current.display_name || 'Unknown User',
        avatar_url: current.avatar_url,
        email: current.email // Include email if available from RPC
      })
    }
    return acc
  }, [])

  console.log('🔄 Combined unique results:', uniqueResults.length, 'users')

  let filteredResults = uniqueResults

  // If crewId is provided, filter out existing crew members
  if (crewId && filteredResults.length > 0) {
    const userIds = filteredResults.map((u: { user_id: string }) => u.user_id)

    const { data: existingMembers, error: membersError } = await supabase
      .from('crew_members')
      .select('user_id')
      .eq('crew_id', crewId)
      .in('user_id', userIds)

    if (membersError) {
      console.error('❌ Error checking existing members:', membersError)
      throw membersError
    }

    const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || [])
    filteredResults = filteredResults.filter((user: { user_id: string }) => !existingMemberIds.has(user.user_id))

    console.log('🚫 Filtered out existing members, remaining:', filteredResults.length, 'users')
  }

  const finalResults = filteredResults.slice(0, 10) // Return max 10 results
  console.log('✅ Final search results:', finalResults.length, 'users')

  return finalResults
}

// Update crew
export async function updateCrew(crewId: string, updates: Partial<Crew>): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  console.log('🔍 Attempting to update crew:', { crewId, userId: user.id, updates })

  // Check if user has management permissions (creator or co-host)
  const hasPermission = await hasCrewManagementPermissions(crewId, user.id)
  if (!hasPermission) {
    console.error('🔍 User does not have permission to update crew:', { crewId, userId: user.id })
    throw new Error('You do not have permission to edit this crew')
  }

  console.log('🔍 User has permission to update crew, proceeding with update')

  const { error } = await supabase
    .from('crews')
    .update(updates)
    .eq('id', crewId)

  if (error) {
    console.error('🔍 Error updating crew:', error)
    throw error
  }

  console.log('🔍 Successfully updated crew')
}

/**
 * Delete a crew (only by creator, even with existing members)
 */
export async function deleteCrew(crewId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    console.log('🗑️ Deleting crew:', crewId)

    // Verify user is the crew creator
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .select('created_by, name')
      .eq('id', crewId)
      .single()

    if (crewError || !crew) {
      throw new Error('Crew not found')
    }

    if (crew.created_by !== user.id) {
      throw new Error('Only crew creator can delete this crew')
    }

    // Get member count for logging
    const { data: members } = await supabase
      .from('crew_members')
      .select('user_id')
      .eq('crew_id', crewId)

    const memberCount = members?.length || 0
    console.log(`🗑️ Deleting crew "${crew.name}" with ${memberCount} members`)

    // Delete the crew (CASCADE will handle related records like crew_members, crew_invitations, etc.)
    const { error: deleteError } = await supabase
      .from('crews')
      .delete()
      .eq('id', crewId)
      .eq('created_by', user.id) // Extra safety check

    if (deleteError) {
      console.error('❌ Error deleting crew:', deleteError)
      throw deleteError
    }

    console.log('✅ Crew deleted successfully:', crew.name)
    return true

  } catch (error: any) {
    console.error('❌ Failed to delete crew:', error)
    throw error
  }
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
