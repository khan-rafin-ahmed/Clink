import { supabase } from './supabase'

/**
 * Platform-agnostic user statistics service
 * Handles user stats calculation across web and mobile
 */

export interface UserStats {
  totalEvents: number
  totalRSVPs: number
  totalCrews: number
  upcomingEvents: number
  pastEvents: number
}

/**
 * Get comprehensive user statistics
 */
export async function getUserStats(userId?: string): Promise<UserStats> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const targetUserId = userId || session?.user?.id
    
    if (!targetUserId) {
      return {
        totalEvents: 0,
        totalRSVPs: 0,
        totalCrews: 0,
        upcomingEvents: 0,
        pastEvents: 0,
      }
    }

    const now = new Date().toISOString()

    // Run all queries in parallel for better performance
    const [
      createdEventsResult,
      rsvpEventsResult,
      invitedEventsResult,
      crewMembershipsResult
    ] = await Promise.allSettled([
      // 1. Events user created
      supabase
        .from('events')
        .select('id, date_time')
        .eq('created_by', targetUserId),

      // 2. Events user RSVP'd to with 'going' status
      supabase
        .from('rsvps')
        .select('event_id')
        .eq('user_id', targetUserId)
        .eq('status', 'going'),

      // 3. Events user was directly invited to with 'accepted' status
      supabase
        .from('event_members')
        .select('event_id')
        .eq('user_id', targetUserId)
        .eq('status', 'accepted'),

      // 4. User's crew memberships
      supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', targetUserId)
        .eq('status', 'accepted')
    ])

    // Extract data from settled promises
    const createdEvents = createdEventsResult.status === 'fulfilled' ? createdEventsResult.value.data || [] : []
    const rsvpEvents = rsvpEventsResult.status === 'fulfilled' ? rsvpEventsResult.value.data || [] : []
    const invitedEvents = invitedEventsResult.status === 'fulfilled' ? invitedEventsResult.value.data || [] : []
    const crewMemberships = crewMembershipsResult.status === 'fulfilled' ? crewMembershipsResult.value.data || [] : []

    console.log('📊 getUserStats Debug:', {
      targetUserId,
      createdEventsCount: createdEvents.length,
      rsvpEventsCount: rsvpEvents.length,
      invitedEventsCount: invitedEvents.length,
      crewMembershipsCount: crewMemberships.length
    })

    // Collect all unique event IDs (same logic as web app)
    const allEventIds = new Set<string>()
    const createdEventIds = new Set<string>()
    const rsvpEventIds = new Set<string>()
    const invitedEventIds = new Set<string>()

    // Process created events
    createdEvents.forEach((event: any) => {
      allEventIds.add(event.id)
      createdEventIds.add(event.id)
    })

    // Process RSVP events
    rsvpEvents.forEach((rsvp: any) => {
      allEventIds.add(rsvp.event_id)
      rsvpEventIds.add(rsvp.event_id)
    })

    // Process invited events
    invitedEvents.forEach((invitation: any) => {
      allEventIds.add(invitation.event_id)
      invitedEventIds.add(invitation.event_id)
    })

    // Count total unique events
    const totalEvents = allEventIds.size

    console.log('📊 getUserStats Calculation:', {
      createdEventsCount: createdEventIds.size,
      rsvpEventsCount: rsvpEventIds.size,
      invitedEventsCount: invitedEventIds.size,
      totalUniqueEvents: totalEvents,
      allEventIds: Array.from(allEventIds)
    })

    // Count total RSVPs (only going status)
    const totalRSVPs = rsvpEvents.length

    // Count total crews
    const totalCrews = crewMemberships.length

    // For upcoming/past calculation, we need to fetch all unique events with dates
    let upcomingEvents = 0
    let pastEvents = 0

    if (allEventIds.size > 0) {
      const { data: allEventsData } = await supabase
        .from('events')
        .select('id, date_time')
        .in('id', Array.from(allEventIds))

      if (allEventsData) {
        upcomingEvents = allEventsData.filter((e: any) => e.date_time > now).length
        pastEvents = allEventsData.filter((e: any) => e.date_time <= now).length
      }
    }

    return {
      totalEvents,
      totalRSVPs,
      totalCrews,
      upcomingEvents,
      pastEvents,
    }
  } catch (error) {
    console.error('❌ Error in getUserStats:', error)
    return {
      totalEvents: 0,
      totalRSVPs: 0,
      totalCrews: 0,
      upcomingEvents: 0,
      pastEvents: 0,
    }
  }
}

/**
 * Get user's events with comprehensive data
 */
export async function getUserEvents(userId?: string): Promise<{
  upcoming: any[]
  past: any[]
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const targetUserId = userId || session?.user?.id
    
    if (!targetUserId) {
      return { upcoming: [], past: [] }
    }

    // Get user's crew memberships for crew-associated events
    const { data: userCrewMemberships } = await supabase
      .from('crew_members')
      .select('crew_id')
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')

    const userCrewIds = userCrewMemberships?.map(cm => cm.crew_id) || []

    // Get all events from different sources
    const [
      createdEventsResult,
      rsvpEventsResult,
      invitedEventsResult,
      crewEventsResult
    ] = await Promise.all([
      // 1. Events created by user
      supabase
        .from('events')
        .select(`
          *,
          rsvps(user_id, status),
          event_members(user_id, status, role)
        `)
        .eq('created_by', targetUserId)
        .order('date_time', { ascending: true }),

      // 2. Events user RSVP'd to with status 'going'
      supabase
        .from('events')
        .select(`
          *,
          rsvps!inner(user_id, status),
          event_members(user_id, status, role)
        `)
        .eq('rsvps.user_id', targetUserId)
        .eq('rsvps.status', 'going')
        .neq('created_by', targetUserId)
        .order('date_time', { ascending: true }),

      // 3. Events user was directly invited to
      supabase
        .from('events')
        .select(`
          *,
          event_members!inner(user_id, status, role),
          rsvps(user_id, status)
        `)
        .eq('event_members.user_id', targetUserId)
        .eq('event_members.status', 'accepted')
        .neq('created_by', targetUserId)
        .order('date_time', { ascending: true }),

      // 4. Events associated with crews user is a member of
      userCrewIds.length > 0 ? supabase
        .from('events')
        .select(`
          *,
          rsvps(user_id, status),
          event_members(user_id, status, role)
        `)
        .in('crew_id', userCrewIds)
        .neq('created_by', targetUserId)
        .order('date_time', { ascending: true }) : Promise.resolve({ data: [], error: null })
    ])

    // Combine all events and remove duplicates
    const allEventsRaw = [
      ...(createdEventsResult.data || []),
      ...(rsvpEventsResult.data || []),
      ...(invitedEventsResult.data || []),
      ...(crewEventsResult.data || [])
    ]

    const uniqueEvents = allEventsRaw.reduce((acc: any[], event: any) => {
      if (!acc.find(e => e.id === event.id)) {
        acc.push(event)
      }
      return acc
    }, [])

    // Separate upcoming vs past events
    const now = new Date().toISOString()
    const upcoming = uniqueEvents.filter((e: any) => e.date_time > now)
    const past = uniqueEvents.filter((e: any) => e.date_time <= now)

    return { upcoming, past }
  } catch (error) {
    console.error('❌ Error in getUserEvents:', error)
    return { upcoming: [], past: [] }
  }
}
