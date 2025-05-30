import { supabase } from './supabaseClient'

export interface Crew {
  id: string
  name: string
  vibe: string
  visibility: 'public' | 'private'
  description: string
  created_by: string
  created_at: string
  updated_at: string
  member_count: number
  is_member: boolean
  is_creator: boolean
}

export interface CrewMember {
  user_id: string
  crew_id: string
  role: 'member' | 'admin' | 'owner'
  joined_at: string
  user_name: string
  user_email: string
}

export interface CreateCrewData {
  name: string
  vibe: string
  visibility: 'public' | 'private'
  description?: string
}

export async function getUserCrews(): Promise<Crew[]> {
  const { data, error } = await supabase.rpc('get_user_crews')

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.crew_id,
    name: row.name,
    vibe: row.vibe,
    visibility: row.visibility,
    description: row.description || '',
    created_by: row.created_by,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    member_count: 0,
    is_member: true,
    is_creator: false
  }))
}

export async function createCrew(data: CreateCrewData): Promise<Crew> {
  const { data: crew, error } = await supabase
    .from('crews')
    .insert([data])
    .single()

  if (error) throw error
  return crew
}

export async function getCrewById(crewId: string): Promise<Crew | null> {
  const { data, error } = await supabase
    .from('crews')
    .select('*')
    .eq('id', crewId)
    .single()

  if (error) throw error
  return data
}

export async function leaveCrew(crewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getCrewMembers(crewId: string): Promise<CrewMember[]> {
  const { data, error } = await supabase
    .from('crew_members')
    .select('user_id, crew_id, role, joined_at, users(name, email)')
    .eq('crew_id', crewId)

  if (error) throw error

  return (data || []).map((row: any) => ({
    user_id: row.user_id,
    crew_id: row.crew_id,
    role: row.role,
    joined_at: row.joined_at,
    user_name: row.users?.name || '',
    user_email: row.users?.email || ''
  }))
}

export async function inviteUserToCrew(crewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('crew_invitations')
    .insert([{ crew_id: crewId, user_id: userId }])

  if (error) throw error
}

export async function inviteUserByIdentifier(crewId: string, identifier: string): Promise<void> {
  // identifier can be email or username
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${identifier},name.eq.${identifier}`)
    .limit(1)

  if (error) throw error
  if (!users || users.length === 0) throw new Error('User not found')

  await inviteUserToCrew(crewId, users[0].id)
}

export async function inviteUserWithFallback(crewId: string, identifier: string): Promise<void> {
  try {
    await inviteUserByIdentifier(crewId, identifier)
  } catch {
    // fallback logic, e.g., send email invite
    // For now, just throw error
    throw new Error('Failed to invite user')
  }
}

export async function bulkInviteUsersToCrew(crewId: string, userIds: string[]): Promise<void> {
  const invitations = userIds.map(userId => ({ crew_id: crewId, user_id: userId }))
  const { error } = await supabase.from('crew_invitations').insert(invitations)

  if (error) throw error
}

export async function respondToCrewInvitation(invitationId: string, accept: boolean): Promise<void> {
  if (accept) {
    const { data, error } = await supabase
      .from('crew_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Invitation not found')

    await supabase.from('crew_members').insert([{ crew_id: data.crew_id, user_id: data.user_id }])
  }

  const { error } = await supabase.from('crew_invitations').delete().eq('id', invitationId)
  if (error) throw error
}

export async function getPendingCrewInvitations(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('crew_invitations')
    .select('id, crew_id, crews(name)')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export async function createCrewInviteLink(crewId: string): Promise<string> {
  const inviteCode = generateInviteCode()
  const { error } = await supabase
    .from('crew_invite_links')
    .insert([{ crew_id: crewId, code: inviteCode }])

  if (error) throw error
  return inviteCode
}

export async function joinCrewByInviteCode(code: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('crew_invite_links')
    .select('crew_id')
    .eq('code', code)
    .single()

  if (error) throw error
  if (!data) throw new Error('Invalid invite code')

  await supabase.from('crew_members').insert([{ crew_id: data.crew_id, user_id: userId }])
}

export async function removeMemberFromCrew(crewId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function searchUsersForInvite(query: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data || []
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
