import { supabase } from './supabase'
import type { Event, RsvpStatus, UserProfile } from '@/types'



export async function getEventDetails(eventId: string) {
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

  if (error) throw error
  return event
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
  // Get events with RSVP counts
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      rsvps(count)
    `)
    .eq('is_public', true)
    .gte('date_time', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching public events:', error)
    throw new Error('Failed to fetch public events')
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, check which events they've joined
  let userRsvps: any[] = []
  if (user) {
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('event_id, status')
      .eq('user_id', user.id)
      .eq('status', 'going')

    userRsvps = rsvpData || []
  }

  // Transform the data
  return (events || []).map(event => ({
    ...event,
    rsvp_count: event.rsvps?.[0]?.count || 0,
    user_has_joined: userRsvps.some(rsvp => rsvp.event_id === event.id)
  }))
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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

  if (error) throw error
  return events || []
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