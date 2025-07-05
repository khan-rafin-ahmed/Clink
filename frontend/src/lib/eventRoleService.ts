import { supabase } from './supabase'
import { toast } from 'sonner'

export interface EventRole {
  ATTENDEE: 'attendee'
  CO_HOST: 'co_host'
  HOST: 'host'
}

export const EventRole: EventRole = {
  ATTENDEE: 'attendee',
  CO_HOST: 'co_host',
  HOST: 'host'
}

export interface EventPermissions {
  canEditDetails: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canPromoteMembers: boolean
  canDemoteCoHosts: boolean
  canDeleteEvent: boolean
  canTransferOwnership: boolean
}

/**
 * Get event permissions based on user role
 */
export const getEventPermissions = (userRole: string): EventPermissions => {
  const isHost = userRole === EventRole.HOST
  const isCoHost = userRole === EventRole.CO_HOST
  const canManage = isHost || isCoHost

  return {
    canEditDetails: canManage,
    canInviteMembers: canManage,
    canRemoveMembers: canManage,
    canPromoteMembers: isHost,
    canDemoteCoHosts: isHost,
    canDeleteEvent: isHost,
    canTransferOwnership: isHost
  }
}

/**
 * Get user's role in an event
 */
export async function getUserEventRole(eventId: string, userId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_user_event_role', {
      p_event_id: eventId,
      p_user_id: userId
    })

    if (error) {
      console.error('Error getting user event role:', error)

      // Fallback: check directly from events table if user is creator
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', eventId)
        .single()

      if (!eventError && eventData?.created_by === userId) {
        return 'host'
      }

      return 'none'
    }

    return data || 'none'
  } catch (error) {
    console.error('Error getting user event role:', error)

    // Fallback: check directly from events table if user is creator
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', eventId)
        .single()

      if (!eventError && eventData?.created_by === userId) {
        return 'host'
      }
    } catch (fallbackError) {
      console.error('Fallback check failed:', fallbackError)
    }

    return 'none'
  }
}

/**
 * Check if user can edit an event
 */
export async function canUserEditEvent(eventId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('can_user_edit_event', {
      p_event_id: eventId,
      p_user_id: userId
    })

    if (error) {
      console.error('Error checking edit permissions:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking edit permissions:', error)
    return false
  }
}

/**
 * Promote an event member to co-host
 */
export async function promoteEventMemberToCohost(
  eventId: string,
  userId: string,
  promotedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('promote_event_member_to_cohost', {
      p_event_id: eventId,
      p_user_id: userId,
      p_promoted_by: promotedBy
    })

    if (error) {
      console.error('Error promoting member to co-host:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error promoting member to co-host:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Demote an event co-host to attendee
 */
export async function demoteEventCohost(
  eventId: string,
  userId: string,
  demotedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('demote_event_cohost', {
      p_event_id: eventId,
      p_user_id: userId,
      p_demoted_by: demotedBy
    })

    if (error) {
      console.error('Error demoting co-host:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error demoting co-host:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get event members with their roles (similar to getCrewMembers)
 */
export async function getEventMembersWithRoles(eventId: string) {
  try {
    // First get the event info to get the creator
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by, created_at')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('Error fetching event data:', eventError)
      throw eventError
    }

    // Get all accepted event members
    const { data: memberRows, error: membersError } = await supabase
      .from('event_members')
      .select('id, event_id, user_id, status, role, invited_by, created_at, updated_at')
      .eq('event_id', eventId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching event member rows:', membersError)
      throw membersError
    }

    // Ensure event creator is included in the members list
    const memberUserIds = (memberRows || []).map(r => r.user_id)
    const allUserIds = new Set(memberUserIds)

    // Add event creator if not already in members
    if (eventData.created_by && !allUserIds.has(eventData.created_by)) {
      allUserIds.add(eventData.created_by)
    }

    const userIds = Array.from(allUserIds)

    if (userIds.length === 0) {
      return []
    }

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url, nickname')
      .in('user_id', userIds)

    if (profileError) {
      console.error('Error fetching user profiles:', profileError)
      throw profileError
    }

    // Map rows into EventMember[] merging profile lookup
    const membersWithProfiles = (memberRows || []).map(row => {
      const profile = profiles?.find(p => p.user_id === row.user_id)
      return {
        ...row,
        role: row.role || 'attendee', // Default to attendee if role is missing
        user: profile ? {
          user_id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          nickname: profile.nickname
        } : undefined
      }
    })

    // Add event creator if not already in members list
    if (eventData.created_by && !memberUserIds.includes(eventData.created_by)) {
      const creatorProfile = profiles?.find(p => p.user_id === eventData.created_by)
      if (creatorProfile) {
        membersWithProfiles.push({
          id: `creator-${eventId}`, // Temporary ID for creator
          event_id: eventId,
          user_id: eventData.created_by,
          status: 'accepted' as const,
          role: 'host' as const,
          invited_by: eventData.created_by,
          created_at: eventData.created_at,
          updated_at: eventData.created_at,
          user: {
            user_id: creatorProfile.user_id,
            username: creatorProfile.username,
            display_name: creatorProfile.display_name,
            avatar_url: creatorProfile.avatar_url,
            nickname: creatorProfile.nickname
          }
        })
      }
    }

    // Sort by role (hosts first, then co_hosts, then attendees) and creation date
    const sortedMembers = membersWithProfiles.sort((a, b) => {
      const roleOrder = { 'host': 0, 'co_host': 1, 'attendee': 2 }
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 2
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 2

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return sortedMembers
  } catch (error) {
    console.error('Error fetching event members with roles:', error)
    throw error
  }
}

/**
 * Handle role change with toast notification
 */
export async function handleRoleChange(
  action: 'promote' | 'demote',
  eventId: string,
  userId: string,
  currentUserId: string,
  userName: string
): Promise<boolean> {
  try {
    let result

    if (action === 'promote') {
      result = await promoteEventMemberToCohost(eventId, userId, currentUserId)
      if (result.success) {
        toast.success(`👑 ${userName} promoted to co-host!`)
      }
    } else {
      result = await demoteEventCohost(eventId, userId, currentUserId)
      if (result.success) {
        toast.success(`${userName} role updated`)
      }
    }

    if (!result.success) {
      toast.error(result.error || `Failed to ${action} member`)
      return false
    }

    // Note: Notifications are created automatically by the database functions
    // promote_event_member_to_cohost() and demote_event_cohost()
    // No need to call notification triggers here since the database handles it

    return true
  } catch (error: any) {
    console.error(`Error ${action}ing member:`, error)
    toast.error(`Failed to ${action} member`)
    return false
  }
}

/**
 * Get role display information
 */
export function getRoleDisplayInfo(role: string) {
  switch (role) {
    case EventRole.HOST:
      return {
        label: 'Host',
        icon: '👑',
        className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      }
    case EventRole.CO_HOST:
      return {
        label: 'Co-Host',
        icon: '🛡️',
        className: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      }
    case EventRole.ATTENDEE:
    default:
      return {
        label: 'Attendee',
        icon: '',
        className: 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      }
  }
}

/**
 * Check if user has specific permission for an event
 */
export async function hasEventPermission(
  eventId: string,
  userId: string,
  permission: keyof EventPermissions
): Promise<boolean> {
  try {
    const role = await getUserEventRole(eventId, userId)
    const permissions = getEventPermissions(role)
    return permissions[permission]
  } catch (error) {
    console.error('Error checking event permission:', error)
    return false
  }
}

/**
 * Get all hosts and co-hosts for an event
 */
export async function getEventManagers(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('event_members')
      .select(`
        *,
        user:user_profiles!event_members_user_id_fkey (
          user_id,
          username,
          display_name,
          avatar_url,
          nickname
        )
      `)
      .eq('event_id', eventId)
      .in('role', ['host', 'co_host'])
      .eq('status', 'accepted')
      .order('role', { ascending: false }) // hosts first, then co_hosts

    if (error) {
      console.error('Error fetching event managers:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error fetching event managers:', error)
    throw error
  }
}
