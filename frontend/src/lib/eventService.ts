import { supabase } from './supabase'
import { getCurrentUser } from './authUtils'
import type { Event, RsvpStatus, UserProfile } from '@/types'
import { getDefaultCoverImage } from './coverImageUtils'
import { getEventRatingStats } from '@/lib/eventRatingService'
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cacheService'



/**
 * Get event by slug (modern approach with proper public/private handling)
 * Uses session-based auth to avoid race conditions
 */
export async function getEventBySlug(slug: string, isPrivate: boolean = false, currentUser?: any) {
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    throw new Error('Invalid event slug provided')
  }

  try {
    // Try cache first using slug as key
    const cacheKey = CacheKeys.eventDetails(slug)
    const cached = cacheService.get<Event>(cacheKey)
    if (cached) {
      return cached
    }

    // Use provided user or get from session (not getUser which makes API call)
    let user = currentUser
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user || null
    }

    // Get event without problematic joins first
    const { data: eventData, error: eventError } = isPrivate
      ? await supabase.from('events').select('*').eq('private_slug', slug).single()
      : await supabase.from('events').select('*').eq('public_slug', slug).single()

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        throw new Error('Event not found')
      }
      throw eventError
    }

    // Get RSVPs separately to avoid foreign key issues
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('id, status, user_id')
      .eq('event_id', eventData.id)

    // Get event members separately
    const { data: eventMembers } = await supabase
      .from('event_members')
      .select('id, status, user_id, invited_by')
      .eq('event_id', eventData.id)

    // Get creator information separately
    let creator = null
    if (eventData.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, nickname, avatar_url')
        .eq('user_id', eventData.created_by)
        .single()

      // If no profile found, create a fallback creator object
      if (creatorError && creatorError.code === 'PGRST116') {
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          nickname: null,
          avatar_url: null
        }
      } else if (!creatorError && creatorData) {
        creator = creatorData
      } else {
        // Fallback for any other error
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          nickname: null,
          avatar_url: null
        }
      }
    }

    // Get rating stats for the event
    const ratingStats = await getEventRatingStats(eventData.id)

    // Combine the data
    const event = {
      ...eventData,
      creator,
      rsvps: rsvps || [],
      event_members: eventMembers || [],
      average_rating: ratingStats.averageRating,
      total_ratings: ratingStats.totalRatings
    }

    // For private events, verify user has access
    if (isPrivate && user) {
      const hasAccess = await checkEventAccess(event.id, user.id)
      if (!hasAccess) {
        throw new Error('You do not have permission to view this private event')
      }
    } else if (isPrivate && !user) {
      throw new Error('Please sign in to view this private event')
    }

    // Cache the result for faster subsequent loads
    cacheService.set(cacheKey, event, CacheTTL.MEDIUM)

    return event
  } catch (error) {
    throw error
  }
}

/**
 * Legacy function for backward compatibility - now handles both IDs and slugs
 */
export async function getEventDetails(eventIdOrSlug: string) {
  // Validate input parameters
  if (!eventIdOrSlug || typeof eventIdOrSlug !== 'string' || eventIdOrSlug.trim() === '') {
    throw new Error('Invalid event ID or slug provided')
  }

  try {
    const cacheKey = CacheKeys.eventDetails(eventIdOrSlug)
    const cached = cacheService.get<Event>(cacheKey)
    if (cached) {
      return cached
    }

    let eventData = null
    let eventError = null

    // First try to query by ID if it looks like a UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug)) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventIdOrSlug)
        .maybeSingle()

      eventData = data
      eventError = error
    }

    // If not found by ID or not a UUID, try by public_slug
    if (!eventData && !eventError) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('public_slug', eventIdOrSlug)
        .maybeSingle()

      eventData = data
      eventError = error
    }

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        throw new Error('Event not found')
      }
      throw eventError
    }

    if (!eventData) {
      throw new Error('Event not found')
    }

    // Get creator information separately
    let creator = null
    if (eventData.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, nickname, avatar_url')
        .eq('user_id', eventData.created_by)
        .single()

      // If no profile found, create a fallback creator object
      if (creatorError && creatorError.code === 'PGRST116') {
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          nickname: null,
          avatar_url: null
        }
      } else if (!creatorError && creatorData) {
        creator = creatorData
      } else {
        // Fallback for any other error
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          nickname: null,
          avatar_url: null
        }
      }
    }

    // Get RSVPs separately to avoid foreign key issues
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('id, status, user_id')
      .eq('event_id', eventData.id)

    // Get event members separately
    const { data: eventMembers } = await supabase
      .from('event_members')
      .select('id, status, user_id, invited_by')
      .eq('event_id', eventData.id)

    // Get rating stats for the event
    const ratingStats = await getEventRatingStats(eventData.id)

    // Combine the data
    const event = {
      ...eventData,
      creator,
      rsvps: rsvps || [],
      event_members: eventMembers || [],
      average_rating: ratingStats.averageRating,
      total_ratings: ratingStats.totalRatings
    }

    // Cache using both the original key and the event ID for better cache hits
    cacheService.set(cacheKey, event, CacheTTL.MEDIUM)
    if (eventIdOrSlug !== eventData.id) {
      cacheService.set(CacheKeys.eventDetails(eventData.id), event, CacheTTL.MEDIUM)
    }

    return event
  } catch (error) {
    throw error
  }
}

/**
 * Check if user has access to an event
 */
export async function checkEventAccess(eventId: string, userId: string): Promise<boolean> {
  try {
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('created_by, is_public')
      .eq('id', eventId)
      .single()

    if (!event) return false

    // Public events are accessible to everyone
    if (event.is_public) return true

    // User is the host
    if (event.created_by === userId) return true

    // Check if user RSVP'd
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'going')
      .maybeSingle()

    if (rsvp) return true

    // Check if user was invited (private events)
    const { data: member } = await supabase
      .from('event_members')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle()

    return !!member
  } catch (error) {
    console.error('Error checking event access:', error)
    return false
  }
}

export async function updateRsvp(eventId: string, userId: string, status: RsvpStatus) {
  // Use upsert for better performance - single query instead of select + insert/update
  const { error } = await supabase
    .from('rsvps')
    .upsert({
      event_id: eventId,
      user_id: userId,
      status,
    }, {
      onConflict: 'event_id,user_id'
    })

  if (error) throw error

  // Don't refetch event details - let the UI handle optimistic updates
  return { success: true }
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) {
  // Assign default cover image if not provided
  const eventWithCover = {
    ...event,
    cover_image_url: event.cover_image_url || getDefaultCoverImage(event.vibe),
    // Provide a default duration_type in case the DB lacks a default value
    duration_type: 'specific_time'
  }

  const { data, error } = await supabase
    .from('events')
    .insert(eventWithCover)
    .select()
    .single()

  if (error) throw error
  return data
}

// Generate a shorter, more user-friendly event code
function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Enhanced event creation with shareable link
export async function createEventWithShareableLink(eventData: {
  title: string
  location: string
  date_time: string
  drink_type?: string
  vibe?: string
  notes?: string
  is_public: boolean
  locationData?: {
    latitude: number
    longitude: number
    place_id: string
    place_name: string
    address?: string
  }
}) {
  // Get the current user
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Generate a unique event code
  let eventCode = generateEventCode()
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  // Ensure the event code is unique (check against existing events)
  while (!isUnique && attempts < maxAttempts) {
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('event_code', eventCode)
      .maybeSingle()

    if (!existingEvent) {
      isUnique = true
    } else {
      eventCode = generateEventCode()
      attempts++
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique event code')
  }

  // Generate appropriate slug based on event visibility
  const { data: slugData, error: slugError } = await supabase.rpc('generate_event_slug', {
    event_title: eventData.title,
    is_public_event: eventData.is_public
  })

  if (slugError) {
    console.error('Error generating slug:', slugError)
    throw new Error('Failed to generate event slug')
  }

  const slug = slugData

  // Assign default cover image based on vibe
  const defaultCoverImage = getDefaultCoverImage(eventData.vibe)

  // Create the event with the event_code and slug
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: eventData.title,
      location: eventData.location,
      latitude: eventData.locationData?.latitude,
      longitude: eventData.locationData?.longitude,
      place_id: eventData.locationData?.place_id,
      place_name: eventData.locationData?.place_name,
      date_time: eventData.date_time,
      // Ensure duration_type always has a valid value
      duration_type: 'specific_time',
      drink_type: eventData.drink_type,
      vibe: eventData.vibe,
      notes: eventData.notes,
      is_public: eventData.is_public,
      public_slug: eventData.is_public ? slug : null,
      private_slug: eventData.is_public ? null : slug,
      created_by: user.id,
      event_code: eventCode,
      cover_image_url: defaultCoverImage,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // Automatically RSVP the creator as "going"
  await supabase
    .from('rsvps')
    .insert({
      event_id: event.id,
      user_id: user.id,
      status: 'going',
    })

  // Generate shareable link using the event code
  const baseUrl = window.location.origin
  const shareUrl = `${baseUrl}/event/${eventCode}`

  return {
    success: true,
    event: {
      ...event,
      share_url: shareUrl,
    },
    share_url: shareUrl,
    event_code: eventCode,
  }
}

export async function getPublicEvents(): Promise<Event[]> {
  try {
    // First, get all public events
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .eq('is_public', true)
      .gte('date_time', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch public events')
    }

    if (!events || events.length === 0) {
      return []
    }

    // Get event IDs for batch queries
    const eventIds = events.map(event => event.id)

    // Batch fetch RSVPs for all events
    const { data: allRsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (rsvpError) {
      // Continue without RSVPs if there's an error
    }

    // Batch fetch event members for all events
    const { data: allEventMembers, error: memberError } = await supabase
      .from('event_members')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (memberError) {
      // Continue without event members if there's an error
    }

    // Get current user (this is optional for public events)
    const user = await getCurrentUser()

    // Continue without user data if there's an error (no error expected with getCurrentUser)

    // If user is logged in and has valid ID, check which events they've joined
    let userRsvps: any[] = []
    if (user && user.id) {
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('event_id, status')
        .eq('user_id', user.id)
        .eq('status', 'going')

      if (rsvpError) {
        // Continue without user RSVP data if there's an error
      } else {
        userRsvps = rsvpData || []
      }
    }

    // Transform the data with correct attendee counting (matching EventDetail logic exactly)
    const transformedEvents = events.map(event => {
      // Get RSVPs with status 'going' for this event
      const rsvpAttendees = (allRsvps || []).filter(
        (rsvp: any) => rsvp.event_id === event.id && rsvp.status === 'going'
      )

      // Get event members with status 'accepted' for this event (crew members)
      const eventMembers = (allEventMembers || []).filter(
        (member: any) => member.event_id === event.id && member.status === 'accepted'
      )

      // Create a Set to track unique user IDs to avoid duplicates (same as EventDetail)
      const uniqueAttendeeIds = new Set<string>()
      const allAttendees: Array<{
        user_id: string
        status: string
        source: 'rsvp' | 'crew'
      }> = []

      // Add RSVP attendees first
      rsvpAttendees.forEach(rsvp => {
        if (!uniqueAttendeeIds.has(rsvp.user_id)) {
          uniqueAttendeeIds.add(rsvp.user_id)
          allAttendees.push({ ...rsvp, source: 'rsvp' })
        }
      })

      // Add event members (crew members) if they're not already in RSVPs
      eventMembers.forEach(member => {
        if (!uniqueAttendeeIds.has(member.user_id)) {
          uniqueAttendeeIds.add(member.user_id)
          allAttendees.push({ ...member, status: 'going', source: 'crew' })
        }
      })

      // Host is always counted as attending (minimum 1)
      const totalAttendees = allAttendees.length + (event.created_by ? 1 : 0)

      return {
        ...event,
        rsvp_count: totalAttendees,
        user_has_joined: userRsvps.some(rsvp => rsvp.event_id === event.id)
      }
    })

    return transformedEvents
  } catch (error) {
    throw error
  }
}

export async function joinEvent(eventId: string): Promise<void> {
  // Use session instead of getUser to avoid race conditions
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status: 'going'
    })

  if (error) {
    throw new Error('Failed to join event')
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error('Failed to fetch user profile')
  }

  return data
}

export async function getUserAccessibleEvents() {
  try {
    // Use session instead of getUser to avoid race conditions
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Validate user authentication
    if (!user || !user.id) {
      throw new Error('User authentication required')
    }

    // Get events with creator information using the database function
    const { data: events, error } = await supabase
      .rpc('get_user_accessible_events', {
        user_id: user.id,
        include_past: false,
        event_limit: 50
      })

    if (error) {
      throw error
    }

    // Transform the data to include creator object for compatibility with EventCard
    const eventsWithCreators = (events || []).map((event: any) => {
      const creator = (event.creator_display_name || event.creator_nickname) ? {
        display_name: event.creator_display_name,
        nickname: event.creator_nickname,
        avatar_url: event.creator_avatar_url,
        user_id: event.created_by
      } : undefined

      return {
        ...event,
        creator,
        // Ensure we have the required fields for EventCard
        rsvps: [], // Will be populated by the RPC function's rsvp_count
        event_members: []
      }
    })

    return eventsWithCreators
  } catch (error) {
    throw error
  }
}

/**
 * Get events where crew has significant actual participation:
 * - 2-member crew: 100% participation (both members)
 * - 3+ member crew: 50% participation (at least half)
 * Counts host + RSVPs + accepted event_members (includes auto-joined crew members)
 */
export async function getEventsByCrewId(crewId: string): Promise<Event[]> {
  if (!crewId) throw new Error('Crew ID is required')

  // Get crew members
  const { data: members } = await supabase
    .from('crew_members')
    .select('user_id')
    .eq('crew_id', crewId)
    .eq('status', 'accepted')

  if (!members?.length) return []

  const memberIds = members.map(m => m.user_id)
  const totalMembers = memberIds.length

  // Get events created by crew, RSVPs by crew, AND accepted event_members (auto-joined crew)
  const [{ data: createdEvents }, { data: rsvps }, { data: eventMembers }] = await Promise.all([
    supabase
      .from('events')
      .select('id, created_by')
      .in('created_by', memberIds),
    supabase
      .from('rsvps')
      .select('event_id, user_id')
      .in('user_id', memberIds)
      .eq('status', 'going'),
    supabase
      .from('event_members')
      .select('event_id, user_id')
      .in('user_id', memberIds)
      .eq('status', 'accepted')
  ])



  // Combine all event IDs (created by crew OR crew RSVP'd OR crew auto-joined)
  const createdEventIds = createdEvents?.map(e => e.id) || []
  const rsvpEventIds = rsvps?.map(r => r.event_id) || []
  const memberEventIds = eventMembers?.map(m => m.event_id) || []
  const allEventIds = [...new Set([...createdEventIds, ...rsvpEventIds, ...memberEventIds])]

  if (!allEventIds.length) return []

  // Get all these events with their creators
  const { data: allEvents } = await supabase
    .from('events')
    .select('id, created_by')
    .in('id', allEventIds)



  // Count crew participation per event (host + RSVPs only - actual participation)
  const eventParticipationCounts: Record<string, Set<string>> = {}

  // Add hosts (if they are crew members)
  if (allEvents) {
    allEvents.forEach(event => {
      // Only count as host participation if the creator is a crew member
      if (memberIds.includes(event.created_by)) {
        if (!eventParticipationCounts[event.id]) {
          eventParticipationCounts[event.id] = new Set()
        }
        eventParticipationCounts[event.id].add(event.created_by)

      }
    })
  }

  // Add RSVPs (crew members who manually joined events)
  if (rsvps) {
    rsvps.forEach(rsvp => {
      if (!eventParticipationCounts[rsvp.event_id]) {
        eventParticipationCounts[rsvp.event_id] = new Set()
      }
      eventParticipationCounts[rsvp.event_id].add(rsvp.user_id)

    })
  }

  // Add event members (crew members who were auto-joined when invited as crew)
  if (eventMembers) {
    eventMembers.forEach(member => {
      if (!eventParticipationCounts[member.event_id]) {
        eventParticipationCounts[member.event_id] = new Set()
      }
      eventParticipationCounts[member.event_id].add(member.user_id)

    })
  }

  // Filter events based on crew participation thresholds:
  // - 2-member crew: 100% participation (both members)
  // - 3+ member crew: 50% participation (at least half)
  const getParticipationThreshold = (totalMembers: number): number => {
    if (totalMembers === 2) {
      return 2 // 100% for 2-member crew
    }
    return Math.ceil(totalMembers * 0.5) // 50% for 3+ member crew
  }

  const threshold = getParticipationThreshold(totalMembers)

  const relevantEventIds = Object.entries(eventParticipationCounts)
    .filter(([_, participantSet]) => participantSet.size >= threshold)
    .map(([eventId]) => eventId)

  if (!relevantEventIds.length) return []

  // Get the actual events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', relevantEventIds)
    .order('date_time', { ascending: false })

  if (!events?.length) return []

  // Batch fetch creator profiles, RSVPs, and event members (same pattern as getPublicEvents)
  const finalEventIds = events.map(event => event.id)
  const creatorIds = [...new Set(events.map(e => e.created_by))]

  const [creatorsResult, rsvpsResult, eventMembersResult] = await Promise.all([
    supabase.from('user_profiles').select('user_id, display_name, nickname, avatar_url').in('user_id', creatorIds),
    supabase.from('rsvps').select('event_id, status, user_id').in('event_id', finalEventIds),
    supabase.from('event_members').select('event_id, status, user_id, invited_by').in('event_id', finalEventIds)
  ])

  const creators = creatorsResult.data || []
  const allRsvps = rsvpsResult.data || []
  const allEventMembers = eventMembersResult.data || []

  // Transform events with proper attendee counting (same logic as getPublicEvents)
  const transformedEvents = events.map(event => {
    const creator = creators.find(c => c.user_id === event.created_by)

    // Get RSVPs with status 'going' for this event
    const rsvpAttendees = allRsvps.filter(
      (rsvp: any) => rsvp.event_id === event.id && rsvp.status === 'going'
    )

    // Get event members with status 'accepted' for this event
    const eventMembers = allEventMembers.filter(
      (member: any) => member.event_id === event.id && member.status === 'accepted'
    )

    // Calculate unique attendee count (same logic as getPublicEvents)
    const uniqueAttendeeIds = new Set<string>()
    const allAttendees: Array<{ user_id: string; status: string; source: 'rsvp' | 'crew' }> = []

    // Add RSVP attendees first
    rsvpAttendees.forEach(rsvp => {
      if (!uniqueAttendeeIds.has(rsvp.user_id)) {
        uniqueAttendeeIds.add(rsvp.user_id)
        allAttendees.push({ ...rsvp, source: 'rsvp' })
      }
    })

    // Add event members if they're not already in RSVPs
    eventMembers.forEach(member => {
      if (!uniqueAttendeeIds.has(member.user_id)) {
        uniqueAttendeeIds.add(member.user_id)
        allAttendees.push({ ...member, status: 'going', source: 'crew' })
      }
    })

    // Host is always counted as attending (minimum 1)
    const totalAttendees = allAttendees.length + (event.created_by ? 1 : 0)

    return {
      ...event,
      creator: creator ? {
        display_name: creator.display_name,
        nickname: creator.nickname,
        avatar_url: creator.avatar_url,
        user_id: creator.user_id
      } : undefined,
      rsvp_count: totalAttendees,
      rsvps: rsvpAttendees || [],
      event_members: eventMembers || []
    }
  })

  return transformedEvents
}

// Respond to event invitation (accept/decline)
export async function respondToEventInvitation(eventMemberId: string, response: 'accepted' | 'declined') {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('User authentication required')
    }

    const { data, error } = await supabase
      .from('event_members')
      .update({
        status: response,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventMemberId)
      .eq('user_id', user.id) // Ensure user can only update their own invitations
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function updateEvent(id: string, event: Partial<Event>) {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  invalidateEventCache(id)
  return data
}

/**
 * Delete an event (only by creator)
 */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    console.log('🗑️ Deleting event:', id)

    // Verify user is the event creator
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('created_by, title')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    if (event.created_by !== user.id) {
      throw new Error('Only event creator can delete this event')
    }

    // Delete the event (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id) // Extra safety check

    if (deleteError) {
      console.error('❌ Error deleting event:', deleteError)
      throw deleteError
    }

    console.log('✅ Event deleted successfully:', event.title)
    invalidateEventCache(id)
    return true

  } catch (error: any) {
    console.error('❌ Failed to delete event:', error)
    throw error
  }
}

export function invalidateEventCache(eventId: string) {
  cacheService.delete(CacheKeys.eventDetails(eventId))
}