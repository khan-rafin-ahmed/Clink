import { supabase } from './supabase'
import type { Event, RsvpStatus } from '../types'

/**
 * Platform-agnostic event service
 * Handles event data fetching and management across web and mobile
 */

export interface EventWithCreator extends Event {
  creator?: {
    id: string
    display_name: string
    avatar_url?: string
  }
}

/**
 * Get public events for discover page
 */
export async function getPublicEvents(): Promise<EventWithCreator[]> {
  try {
    const { data: events, error } = await supabase
      .rpc('get_public_events_for_discover', {
        limit_count: 50
      })

    if (error) {
      console.error('❌ Error loading public events:', error)
      throw error
    }

    return events || []
  } catch (error) {
    console.error('❌ Error in getPublicEvents:', error)
    throw error
  }
}

/**
 * Get user's accessible events (events they created or are invited to)
 */
export async function getUserAccessibleEvents(): Promise<Event[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .or(`created_by.eq.${session.user.id},id.in.(${await getUserEventIds(session.user.id)})`)
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch user events')
    }

    return events || []
  } catch (error) {
    console.error('❌ Error in getUserAccessibleEvents:', error)
    throw error
  }
}

/**
 * Get event IDs that user has RSVP'd to
 */
async function getUserEventIds(userId: string): Promise<string> {
  try {
    const { data: rsvps, error } = await supabase
      .from('rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'going')

    if (error) {
      console.warn('Error fetching user RSVPs:', error)
      return ''
    }

    return rsvps?.map((r: any) => r.event_id).join(',') || ''
  } catch (error) {
    console.warn('Error in getUserEventIds:', error)
    return ''
  }
}

/**
 * Get event details by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    // Get event data first without problematic joins
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .eq('id', eventId)
      .single()

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return null // Event not found
      }
      throw eventError
    }

    // Get creator information separately to avoid foreign key issues
    let creator = null
    if (eventData.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', eventData.created_by)
        .single()

      // If no profile found, create a fallback creator object
      if (creatorError && creatorError.code === 'PGRST116') {
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      } else if (!creatorError && creatorData) {
        creator = creatorData
      } else {
        // Fallback for any other error
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      }
    }

    // Combine the data
    const event = {
      ...eventData,
      creator
    }

    return event
  } catch (error) {
    console.error('❌ Error in getEventById:', error)
    throw error
  }
}

/**
 * Update user's RSVP status for an event
 */
export async function updateRsvp(eventId: string, status: RsvpStatus): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('rsvps')
      .upsert({
        event_id: eventId,
        user_id: session.user.id,
        status: status,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('❌ Error updating RSVP:', error)
    throw error
  }
}

/**
 * Get user's RSVP status for an event
 */
export async function getUserRsvpStatus(eventId: string): Promise<RsvpStatus | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return null
    }

    const { data: rsvp, error } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No RSVP found
      }
      throw error
    }

    return rsvp?.status || null
  } catch (error) {
    console.error('❌ Error getting RSVP status:', error)
    return null
  }
}

/**
 * Get recent activity for user (events they've interacted with)
 */
export async function getUserRecentActivity(): Promise<Event[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return []
    }

    // Get events user has recently RSVP'd to or created
    const { data: recentEvents, error } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .or(`created_by.eq.${session.user.id},id.in.(${await getRecentRsvpEventIds(session.user.id)})`)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error fetching recent activity:', error)
      return []
    }

    return recentEvents || []
  } catch (error) {
    console.error('❌ Error in getUserRecentActivity:', error)
    return []
  }
}

/**
 * Get recent RSVP event IDs for user
 */
async function getRecentRsvpEventIds(userId: string): Promise<string> {
  try {
    const { data: rsvps, error } = await supabase
      .from('rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) {
      console.warn('Error fetching recent RSVPs:', error)
      return ''
    }

    return rsvps?.map((r: any) => r.event_id).join(',') || ''
  } catch (error) {
    console.warn('Error in getRecentRsvpEventIds:', error)
    return ''
  }
}

/**
 * Get event members (hosts, co-hosts, and attendees)
 */
export async function getEventMembers(eventId: string): Promise<any[]> {
  try {
    // Get event creator info
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by, created_at')
      .eq('id', eventId)
      .single()

    if (eventError) throw eventError

    // Get all event members WITHOUT problematic foreign key joins
    const { data: members, error: membersError } = await supabase
      .from('event_members')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })

    if (membersError) {
      console.warn('Error fetching event members:', membersError)
    }

    // Get RSVPs for additional attendees
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'going')

    if (rsvpsError) {
      console.warn('Error fetching RSVPs:', rsvpsError)
    }

    // Collect all user IDs
    const memberUserIds = members?.map((m: any) => m.user_id) || []
    const rsvpUserIds = rsvps?.map((r: any) => r.user_id) || []
    const allUserIds = [...new Set([...memberUserIds, ...rsvpUserIds, eventData.created_by])]

    // Get user profiles separately to avoid foreign key issues
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, nickname, avatar_url, username')
      .in('user_id', allUserIds)

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError)
    }

    // Combine all attendees using the same logic as web app
    // Create a Set to track unique user IDs to avoid duplicates (same as web app EventDetail)
    const uniqueAttendeeIds = new Set<string>()
    const allAttendees: Array<{
      id: string
      user_id: string
      status: string
      source: 'rsvp' | 'crew' | 'host'
      role?: string
      user_profiles?: any
      is_creator?: boolean
      event_id: string
      created_at: string
    }> = []

    // Always include the host as an attendee (same as web app)
    if (eventData.created_by) {
      const creatorProfile = userProfiles?.find((p: any) => p.user_id === eventData.created_by)
      uniqueAttendeeIds.add(eventData.created_by)
      allAttendees.push({
        id: `host-${eventData.created_by}`,
        user_id: eventData.created_by,
        status: 'going',
        source: 'host',
        role: 'host',
        user_profiles: creatorProfile,
        is_creator: true,
        event_id: eventId,
        created_at: eventData.created_at
      })
    }

    // Add RSVP attendees (same as web app - RSVPs first)
    if (rsvps) {
      rsvps.forEach((rsvp: any) => {
        if (!uniqueAttendeeIds.has(rsvp.user_id)) {
          uniqueAttendeeIds.add(rsvp.user_id)
          const userProfile = userProfiles?.find((p: any) => p.user_id === rsvp.user_id)
          allAttendees.push({
            id: `rsvp-${rsvp.id}`,
            user_id: rsvp.user_id,
            status: rsvp.status,
            source: 'rsvp',
            role: 'attendee',
            user_profiles: userProfile,
            is_creator: false,
            event_id: eventId,
            created_at: rsvp.created_at
          })
        }
      })
    }

    // Add event members (crew members) if they're not already in RSVPs (same as web app)
    if (members) {
      members.forEach((member: any) => {
        if (!uniqueAttendeeIds.has(member.user_id)) {
          uniqueAttendeeIds.add(member.user_id)
          const userProfile = userProfiles?.find((p: any) => p.user_id === member.user_id)
          allAttendees.push({
            id: member.id,
            user_id: member.user_id,
            status: 'going', // Event members are always 'going'
            source: 'crew',
            role: member.role || 'attendee',
            user_profiles: userProfile,
            is_creator: false,
            event_id: eventId,
            created_at: member.created_at
          })
        }
      })
    }

    return allAttendees
  } catch (error) {
    console.error('❌ Error in getEventMembers:', error)
    throw error
  }
}

/**
 * Calculate total attendee count for an event
 * Host is ALWAYS counted as attending (minimum 1)
 * Combines RSVPs and event members, avoiding duplicates
 * Same logic as web app's calculateAttendeeCount
 */
export async function getEventAttendeeCount(eventId: string): Promise<number> {
  try {
    const attendees = await getEventMembers(eventId)
    return attendees.length
  } catch (error) {
    console.error('❌ Error in getEventAttendeeCount:', error)
    return 0
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: {
  title: string
  location: string
  place_nickname?: string | null
  date_time: string
  end_time?: string | null
  drink_type: string
  vibe: string
  notes?: string | null
  is_private: boolean
  created_by: string
  cover_image_url?: string | null
  invited_users?: string[]
  invited_crews?: string[]
}): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Determine duration_type based on timing
    const duration_type = eventData.end_time ? 'custom' : 'now'

    // Create the event (note: description column doesn't exist in events table)
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        location: eventData.location,
        place_nickname: eventData.place_nickname,
        date_time: eventData.date_time,
        end_time: eventData.end_time,
        drink_type: eventData.drink_type,
        vibe: eventData.vibe,
        notes: eventData.notes,
        is_public: !eventData.is_private, // Convert is_private to is_public for database
        created_by: eventData.created_by,
        cover_image_url: eventData.cover_image_url || null,
        duration_type: duration_type, // Add proper duration_type
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating event:', error)
      return { success: false, error: error.message }
    }

    // Automatically RSVP the creator as "going"
    await supabase
      .from('rsvps')
      .insert({
        event_id: event.id,
        user_id: eventData.created_by,
        status: 'going',
      })

    // Process user invitations if provided
    if (eventData.invited_users && eventData.invited_users.length > 0) {
      try {
        await processEventInvitations(event.id, eventData.invited_users, eventData.created_by)
      } catch (inviteError) {
        console.warn('⚠️ Event created but user invitation processing failed:', inviteError)
        // Don't fail the entire operation if invitations fail
      }
    }

    // Process crew invitations if provided
    if (eventData.invited_crews && eventData.invited_crews.length > 0) {
      try {
        await processCrewInvitations(event.id, eventData.invited_crews, eventData.created_by)
      } catch (inviteError) {
        console.warn('⚠️ Event created but crew invitation processing failed:', inviteError)
        // Don't fail the entire operation if invitations fail
      }
    }

    return { success: true, data: event }
  } catch (error: any) {
    console.error('❌ Error in createEvent:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Process event invitations by username
 */
async function processEventInvitations(eventId: string, usernames: string[], invitedBy: string): Promise<void> {
  try {
    // Find users by username
    const { data: userProfiles, error: searchError } = await supabase
      .from('user_profiles')
      .select('user_id, username')
      .in('username', usernames.map(u => u.toLowerCase()))

    if (searchError) {
      throw new Error(`Failed to find users: ${searchError.message}`)
    }

    if (!userProfiles || userProfiles.length === 0) {
      throw new Error('No users found with provided usernames')
    }

    // Create event member invitations
    const invitations = userProfiles.map((profile: any) => ({
      event_id: eventId,
      user_id: profile.user_id,
      invited_by: invitedBy,
      status: 'pending',
      role: 'attendee'
    }))

    const { error: inviteError } = await supabase
      .from('event_members')
      .insert(invitations)

    if (inviteError) {
      throw new Error(`Failed to create invitations: ${inviteError.message}`)
    }

    console.log(`✅ Successfully invited ${userProfiles.length} users to event ${eventId}`)
  } catch (error: any) {
    console.error('❌ Error processing event invitations:', error)
    throw error
  }
}

/**
 * Process crew invitations for an event
 */
async function processCrewInvitations(eventId: string, crewIds: string[], invitedBy: string): Promise<void> {
  try {
    console.log(`📤 Processing crew invitations for event ${eventId}:`, crewIds)

    // Process each crew invitation
    for (const crewId of crewIds) {
      try {
        // Use RPC function to send invitations to all crew members
        const { data, error } = await supabase
          .rpc('send_event_invitations_to_crew', {
            p_event_id: eventId,
            p_crew_id: crewId,
            p_invited_by: invitedBy
          })

        if (error) {
          console.error(`❌ Error inviting crew ${crewId}:`, error)
          throw error
        }

        console.log(`✅ Successfully invited crew ${crewId} to event ${eventId}:`, data)
      } catch (crewError) {
        console.error(`❌ Failed to invite crew ${crewId}:`, crewError)
        // Continue with other crews even if one fails
      }
    }

    console.log(`✅ Completed crew invitation processing for event ${eventId}`)
  } catch (error: any) {
    console.error('❌ Error processing crew invitations:', error)
    throw error
  }
}
