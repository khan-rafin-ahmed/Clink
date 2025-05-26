import { supabase } from './supabase'
import type { EventMember, MemberStatus } from '@/types'

// Event Member Functions
export async function inviteUserToEvent(eventId: string, userId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_members')
    .insert({
      event_id: eventId,
      user_id: userId,
      invited_by: user.id,
      status: 'pending'
    })
    .select(`
      *,
      user:user_profiles!event_members_user_id_fkey(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateMemberStatus(eventId: string, status: MemberStatus) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_members')
    .update({ status })
    .eq('event_id', eventId)
    .eq('user_id', user.id)
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
    .select(`
      *,
      user:user_profiles!event_members_user_id_fkey(*)
    `)
    .eq('event_id', eventId)

  if (error) throw error
  return data || []
}

export async function getUserEventInvitations(): Promise<EventMember[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('event_members')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) throw error
  return data || []
}

export async function bulkInviteUsers(eventId: string, userIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const invitations = userIds.map(userId => ({
    event_id: eventId,
    user_id: userId,
    invited_by: user.id,
    status: 'pending' as MemberStatus
  }))

  const { data, error } = await supabase
    .from('event_members')
    .insert(invitations)
    .select(`
      *,
      user:user_profiles!event_members_user_id_fkey(*)
    `)

  if (error) throw error
  return data || []
}
