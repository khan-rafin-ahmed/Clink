import { supabase } from './supabase'
import { sendEventInvitationsToUsers } from './eventInvitationService'
import type { EventMember, MemberStatus } from '@/types'

// Event Member Functions
export async function inviteUserToEvent(eventId: string, userId: string, currentUserId: string) {
  // Use the new unified invitation service for consistency
  const result = await sendEventInvitationsToUsers(eventId, [userId], currentUserId)

  if (!result.success) {
    throw new Error(result.message)
  }

  // Return the invitation data (for backward compatibility)
  const { data, error } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('invited_by', currentUserId)
    .eq('status', 'pending')
    .single()

  if (error) throw error

  // Get user profile separately
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return {
    ...data,
    user: userProfile
  }
}

export async function updateMemberStatus(eventId: string, status: MemberStatus, currentUserId: string) {

  const { data, error } = await supabase
    .from('event_members')
    .update({ status })
    .eq('event_id', eventId)
    .eq('user_id', currentUserId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeEventMember(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_members')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getEventMembers(eventId: string): Promise<EventMember[]> {
  const { data, error } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)

  if (error) throw error

  if (!data || data.length === 0) return []

  // Get user profiles for all members
  const userIds = data.map(member => member.user_id)
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', userIds)

  // Combine the data
  return data.map(member => ({
    ...member,
    user: userProfiles?.find(profile => profile.user_id === member.user_id)
  }))
}

export async function getUserEventInvitations(currentUserId: string): Promise<EventMember[]> {

  const { data, error } = await supabase
    .from('event_members')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', currentUserId)
    .eq('status', 'pending')

  if (error) throw error
  return data || []
}

export async function bulkInviteUsers(eventId: string, userIds: string[], currentUserId: string) {
  console.log('📝 [MemberService] bulkInviteUsers called with:', { eventId, userIds, currentUserId })

  // Use the new unified invitation service for consistency
  const result = await sendEventInvitationsToUsers(eventId, userIds, currentUserId)

  console.log('📝 [MemberService] sendEventInvitationsToUsers result:', result)

  if (!result.success) {
    console.error('❌ [MemberService] Invitation service failed:', result.message)
    throw new Error(result.message)
  }

  // Return the invitation data (for backward compatibility)
  const { data, error } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)
    .eq('invited_by', currentUserId)
    .eq('status', 'pending')
    .in('user_id', userIds)

  if (error) throw error

  if (!data || data.length === 0) return []

  // Get user profiles for all invited users
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', userIds)

  // Combine the data
  return data.map(member => ({
    ...member,
    user: userProfiles?.find(profile => profile.user_id === member.user_id)
  }))
}

// Bulk add crew members to event as automatically accepted
export async function bulkAddCrewMembersToEvent(eventId: string, userIds: string[], currentUserId: string) {

  const memberships = userIds.map(userId => ({
    event_id: eventId,
    user_id: userId,
    invited_by: currentUserId,
    status: 'accepted' as MemberStatus
  }))

  const { data, error } = await supabase
    .from('event_members')
    .insert(memberships)
    .select()

  if (error) throw error

  if (!data || data.length === 0) return []

  // Get user profiles for all added users
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', userIds)

  // Combine the data
  return data.map(member => ({
    ...member,
    user: userProfiles?.find(profile => profile.user_id === member.user_id)
  }))
}

// Bulk invite crew members to event with email notifications (simplified)
export async function bulkInviteCrewMembersToEvent(eventId: string, userIds: string[], currentUserId: string) {
  // Use the new unified invitation service for consistency
  const result = await sendEventInvitationsToUsers(eventId, userIds, currentUserId)

  if (!result.success) {
    throw new Error(result.message)
  }

  // Return the invitation data (for backward compatibility)
  const { data, error } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)
    .eq('invited_by', currentUserId)
    .eq('status', 'pending')
    .in('user_id', userIds)

  if (error) throw error
  return data || []
}
