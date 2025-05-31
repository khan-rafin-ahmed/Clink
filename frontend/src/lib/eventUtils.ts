import type { Event } from '@/types'

/**
 * Utility functions for event-related operations
 * Centralizes common logic to reduce code duplication
 */

export interface AttendeeInfo {
  user_id: string
  status: string
  source: 'rsvp' | 'crew'
}

/**
 * Calculate total attendee count for an event
 * Host is ALWAYS counted as attending (minimum 1)
 * Combines RSVPs and event members, avoiding duplicates
 */
export function calculateAttendeeCount(event: Event): number {
  if (!event) return 0

  // Always count the host as an attendee (host is always attending)
  const uniqueAttendeeIds = new Set<string>()
  if (event.created_by) {
    uniqueAttendeeIds.add(event.created_by)
  }

  // Get RSVPs with status 'going'
  const rsvpAttendees = event.rsvps?.filter(rsvp => rsvp.status === 'going') || []

  // Get event members with status 'accepted' (crew members)
  const eventMembers = event.event_members?.filter(member => member.status === 'accepted') || []

  // Add RSVP attendees
  rsvpAttendees.forEach(rsvp => {
    uniqueAttendeeIds.add(rsvp.user_id)
  })
  // Add event members (crew members)
  eventMembers.forEach(member => {
    uniqueAttendeeIds.add(member.user_id)
  })
  return uniqueAttendeeIds.size
}

/**
 * Get all attendees for an event with their source information
 * Returns array of attendee info with source tracking
 */
export function getAllAttendees(event: Event): AttendeeInfo[] {
  if (!event) return []

  const rsvpAttendees = event.rsvps?.filter(rsvp => rsvp.status === 'going') || []
  const eventMembers = event.event_members?.filter(member => member.status === 'accepted') || []

  const uniqueAttendeeIds = new Set<string>()
  const allAttendees: AttendeeInfo[] = []

  // Add RSVP attendees first
  rsvpAttendees.forEach(rsvp => {
    if (!uniqueAttendeeIds.has(rsvp.user_id)) {
      uniqueAttendeeIds.add(rsvp.user_id)
      allAttendees.push({
        user_id: rsvp.user_id,
        status: rsvp.status,
        source: 'rsvp'
      })
    }
  })

  // Add event members (crew members) if they're not already in RSVPs
  eventMembers.forEach(member => {
    if (!uniqueAttendeeIds.has(member.user_id)) {
      uniqueAttendeeIds.add(member.user_id)
      allAttendees.push({
        user_id: member.user_id,
        status: 'going',
        source: 'crew'
      })
    }
  })

  return allAttendees
}

/**
 * Format attendee count for display
 */
export function formatAttendeeCount(count: number): string {
  if (count === 0) return 'No one going yet'
  if (count === 1) return '1 person going'
  return `${count} people going`
}

/**
 * Get attendee count message for event cards
 */
export function getAttendeeMessage(event: Event, isHost: boolean): string {
  const count = calculateAttendeeCount(event)
  // If only the host is counted (count === 1) and current user is the host, no guests yet
  if (count === 1 && isHost) {
    return 'No guests yet'
  }
  // If somehow count is 1 and user is not host, treat as "1 person going"
  if (count === 1) {
    return '1 person going'
  }
  return formatAttendeeCount(count)
}

/**
 * Check if user has joined an event (either via RSVP or crew membership)
 */
export function hasUserJoined(event: Event, userId: string): boolean {
  if (!event || !userId) return false

  // Check RSVPs
  const hasRsvp = event.rsvps?.some(rsvp =>
    rsvp.user_id === userId && rsvp.status === 'going'
  ) || false

  // Check event members (crew)
  const hasCrewMembership = event.event_members?.some(member =>
    member.user_id === userId && member.status === 'accepted'
  ) || false

  return hasRsvp || hasCrewMembership
}

/**
 * Get user's join status for an event
 */
export function getUserJoinStatus(event: Event, userId: string): 'not_joined' | 'rsvp' | 'crew' | 'host' {
  if (!event || !userId) return 'not_joined'

  // Check if user is the host
  if (event.created_by === userId) return 'host'

  // Check RSVPs
  const hasRsvp = event.rsvps?.some(rsvp =>
    rsvp.user_id === userId && rsvp.status === 'going'
  )

  if (hasRsvp) return 'rsvp'

  // Check event members (crew)
  const hasCrewMembership = event.event_members?.some(member =>
    member.user_id === userId && member.status === 'accepted'
  )

  if (hasCrewMembership) return 'crew'

  return 'not_joined'
}

/**
 * Standardize location display name
 * Prefers place_name over location for consistency
 */
export function getLocationDisplayName(event: Event): string {
  return event.place_name || event.location || 'Location TBD'
}

/**
 * Check if event has valid coordinates for map display
 */
export function hasValidCoordinates(event: Event): boolean {
  return !!(event.latitude && event.longitude &&
    typeof event.latitude === 'number' &&
    typeof event.longitude === 'number' &&
    event.latitude >= -90 && event.latitude <= 90 &&
    event.longitude >= -180 && event.longitude <= 180)
}

/**
 * Get event timing status
 */
export function getEventTimingStatus(dateTime: string): 'past' | 'now' | 'today' | 'tomorrow' | 'future' {
  const eventDate = new Date(dateTime)
  const now = new Date()
  const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 0) return 'past'
  if (diffHours <= 1) return 'now'
  if (diffHours <= 24) return 'today'
  if (diffHours <= 48) return 'tomorrow'
  return 'future'
}

/**
 * Format event timing for display
 */
export function formatEventTiming(dateTime: string): string {
  const status = getEventTimingStatus(dateTime)
  const date = new Date(dateTime)

  switch (status) {
    case 'past':
      return 'Event ended'
    case 'now':
      return 'Happening now!'
    case 'today':
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    case 'tomorrow':
      return `Tomorrow at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    default:
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
  }
}
