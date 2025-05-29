import { supabase } from './supabase'
import type { Event, RsvpStatus, UserProfile } from '@/types'



export async function getEventDetails(eventId: string) {
  // STRONGEST GUARD: Validate input parameters
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    console.error('🚨 getEventDetails: Invalid eventId provided:', eventId)
    throw new Error('Invalid event ID provided')
  }

  console.log('🔍 getEventDetails: Fetching event details for eventId:', eventId)

  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        rsvps (
          id,
          status,
          user_id,
          users (
            email
          )
        )
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('🚨 getEventDetails: Supabase error:', error)

      if (error.code === 'PGRST116') {
        console.log('📭 getEventDetails: No event found for eventId:', eventId)
        throw new Error('Event not found')
      }

      throw error
    }

    console.log('✅ getEventDetails: Event loaded for eventId:', eventId)
    return event
  } catch (error) {
    console.error('🚨 getEventDetails: Unexpected error:', error)
    throw error
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
  const { data, error } = await supabase
    .from('events')
    .insert(event)
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
}) {
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
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

  // Create the event with the event_code
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: eventData.title,
      location: eventData.location,
      date_time: eventData.date_time,
      drink_type: eventData.drink_type,
      vibe: eventData.vibe,
      notes: eventData.notes,
      is_public: eventData.is_public,
      created_by: user.id,
      event_code: eventCode,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
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
  console.log('🔍 getPublicEvents: Fetching public events')

  try {
    // First, get all public events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_public', true)
      .gte('date_time', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('🚨 getPublicEvents: Supabase error:', error)
      throw new Error('Failed to fetch public events')
    }

    if (!events || events.length === 0) {
      console.log('📭 getPublicEvents: No public events found')
      return []
    }

    console.log('✅ getPublicEvents: Loaded public events:', events.length)

    // Get event IDs for batch queries
    const eventIds = events.map(event => event.id)

    // Batch fetch RSVPs for all events
    const { data: allRsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (rsvpError) {
      console.warn('⚠️ getPublicEvents: Could not fetch RSVPs:', rsvpError)
    }

    // Batch fetch event members for all events
    const { data: allEventMembers, error: memberError } = await supabase
      .from('event_members')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (memberError) {
      console.warn('⚠️ getPublicEvents: Could not fetch event members:', memberError)
    }

    // Get current user (this is optional for public events)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.warn('⚠️ getPublicEvents: Could not get user (proceeding without user data):', userError)
    }

    // If user is logged in and has valid ID, check which events they've joined
    let userRsvps: any[] = []
    if (user && user.id) {
      console.log('🔍 getPublicEvents: Checking user RSVPs for user:', user.id)

      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvps')
        .select('event_id, status')
        .eq('user_id', user.id)
        .eq('status', 'going')

      if (rsvpError) {
        console.warn('⚠️ getPublicEvents: Could not fetch user RSVPs (proceeding without RSVP data):', rsvpError)
      } else {
        userRsvps = rsvpData || []
        console.log('✅ getPublicEvents: User RSVPs loaded:', userRsvps.length)
      }
    } else {
      console.log('📭 getPublicEvents: No authenticated user, proceeding without RSVP data')
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

      const totalAttendees = allAttendees.length



      return {
        ...event,
        rsvp_count: totalAttendees,
        user_has_joined: userRsvps.some(rsvp => rsvp.event_id === event.id)
      }
    })

    console.log('✅ getPublicEvents: Events transformed successfully')
    return transformedEvents
  } catch (error) {
    console.error('🚨 getPublicEvents: Unexpected error:', error)
    throw error
  }
}

export async function joinEvent(eventId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

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
    console.error('Error joining event:', error)
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
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to fetch user profile')
  }

  return data
}

export async function getUserAccessibleEvents() {
  console.log('🔍 getUserAccessibleEvents: Fetching user accessible events')

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // STRONGEST GUARD: Validate user authentication
    if (!user || !user.id) {
      console.error('🚨 getUserAccessibleEvents: User not authenticated or missing ID:', { user: !!user, userId: user?.id })
      throw new Error('User authentication required')
    }

    console.log('🔍 getUserAccessibleEvents: Authenticated user:', user.id)

    // Simplified - just get public events for now to avoid RLS issues
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        location,
        date_time,
        drink_type,
        vibe,
        notes,
        is_public,
        created_by,
        created_at,
        updated_at,
        event_code
      `)
      .eq('is_public', true)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(20)

    if (error) {
      console.error('🚨 getUserAccessibleEvents: Supabase error:', error)
      throw error
    }

    console.log('✅ getUserAccessibleEvents: Loaded events:', events?.length || 0)
    return events || []
  } catch (error) {
    console.error('🚨 getUserAccessibleEvents: Unexpected error:', error)
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
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}