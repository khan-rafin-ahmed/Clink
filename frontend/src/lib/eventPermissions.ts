import type { Event, UserProfile } from '@/types'

export interface EventPermissions {
  canView: boolean
  canJoin: boolean
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  isHost: boolean
  isCoHost: boolean
  isJoined: boolean
  joinStatus: 'not_joined' | 'joined_rsvp' | 'joined_crew' | 'host' | 'co_host'
  userRole: 'none' | 'attendee' | 'co_host' | 'host'
  accessReason?: 'public' | 'host' | 'invited' | 'crew_member' | 'rsvp'
}

/**
 * Centralized function to determine user permissions for an event
 */
export function getEventPermissions(
  event: Event | null,
  user: UserProfile | null
): EventPermissions {
  const defaultPermissions: EventPermissions = {
    canView: false,
    canJoin: false,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    isHost: false,
    isCoHost: false,
    isJoined: false,
    joinStatus: 'not_joined',
    userRole: 'none'
  }

  if (!event) {
    return defaultPermissions
  }

  const isHost = user?.id === event.created_by
  const isPublic = event.is_public

  // Check if user has RSVP'd
  const userRsvp = event.rsvps?.find(rsvp => rsvp.user_id === user?.id)
  const hasRsvpJoined = userRsvp?.status === 'going'

  // Check if user is an event member and get their role
  const userEventMember = event.event_members?.find(member => member.user_id === user?.id)
  const hasCrewJoined = userEventMember?.status === 'accepted'
  const memberRole = userEventMember?.role || 'attendee'

  // Determine user role (prioritize event_members role over created_by)
  let userRole: EventPermissions['userRole'] = 'none'
  if (isHost && memberRole === 'host') {
    userRole = 'host'
  } else if (memberRole === 'co_host') {
    userRole = 'co_host'
  } else if (isHost) {
    userRole = 'host' // Fallback for events created before co-host system
  } else if (hasCrewJoined) {
    userRole = 'attendee'
  }

  const isCoHost = userRole === 'co_host'
  const isActualHost = userRole === 'host'

  // Determine join status
  let joinStatus: EventPermissions['joinStatus'] = 'not_joined'
  if (isActualHost) {
    joinStatus = 'host'
  } else if (isCoHost) {
    joinStatus = 'co_host'
  } else if (hasRsvpJoined) {
    joinStatus = 'joined_rsvp'
  } else if (hasCrewJoined) {
    joinStatus = 'joined_crew'
  }

  const isJoined = hasRsvpJoined || hasCrewJoined

  // Determine access reason and view permissions
  let canView = false
  let accessReason: EventPermissions['accessReason'] | undefined

  if (isPublic) {
    canView = true
    accessReason = 'public'
  } else if (isHost) {
    canView = true
    accessReason = 'host'
  } else if (user) {
    // For private events, check if user has access
    
    // Check if user is directly invited (event member)
    if (userEventMember) {
      canView = true
      accessReason = 'invited'
    }
    
    // Check if user has RSVP'd (they must have been invited somehow)
    else if (userRsvp) {
      canView = true
      accessReason = 'rsvp'
    }
    
    // TODO: Check if user is member of a crew that was invited to this event
    // This would require additional data about crew invitations to events
    // For now, we'll implement this when crew-based event invitations are added
  }

  // Determine other permissions
  const canJoin = canView && !isActualHost && !isCoHost && !isJoined && user !== null
  const canEdit = isActualHost || isCoHost // Both hosts and co-hosts can edit
  const canDelete = isActualHost // Only hosts can delete
  const canInvite = isActualHost || isCoHost // Both hosts and co-hosts can invite

  return {
    canView,
    canJoin,
    canEdit,
    canDelete,
    canInvite,
    isHost: isActualHost,
    isCoHost,
    isJoined,
    joinStatus,
    userRole,
    accessReason
  }
}

/**
 * Check if a user can view an event (simplified version)
 */
export function canViewEvent(event: Event | null, user: UserProfile | null): boolean {
  return getEventPermissions(event, user).canView
}

/**
 * Check if a user can join an event (simplified version)
 */
export function canJoinEvent(event: Event | null, user: UserProfile | null): boolean {
  return getEventPermissions(event, user).canJoin
}

/**
 * Get a human-readable reason why a user cannot access a private event
 */
export function getPrivateEventMessage(
  event: Event | null,
  user: UserProfile | null
): string {
  if (!event || event.is_public) {
    return ''
  }

  if (!user) {
    return 'This is a private event. Please sign in to see if you have access.'
  }

  const permissions = getEventPermissions(event, user)
  
  if (permissions.canView) {
    return ''
  }

  return 'This event is private and you haven\'t been invited. Contact the host for access.'
}

/**
 * Get display text for join button based on permissions
 */
export function getJoinButtonText(permissions: EventPermissions): string {
  if (permissions.isHost) {
    return "You're hosting!"
  }
  
  switch (permissions.joinStatus) {
    case 'joined_rsvp':
      return 'Joined'
    case 'joined_crew':
      return 'Joined (Crew)'
    case 'not_joined':
      return permissions.canJoin ? 'Join Event' : 'Cannot Join'
    default:
      return 'Join Event'
  }
}

/**
 * Get appropriate badge variant for join status
 */
export function getJoinButtonVariant(permissions: EventPermissions): 'default' | 'secondary' | 'outline' {
  if (permissions.isHost || permissions.isJoined) {
    return 'secondary'
  }
  
  return permissions.canJoin ? 'default' : 'outline'
}

/**
 * Check if join button should be disabled
 */
export function isJoinButtonDisabled(permissions: EventPermissions): boolean {
  return permissions.isHost || permissions.isJoined || !permissions.canJoin
}
