import { supabase } from '@/lib/supabase'
import type { EventRating } from '@/types'

/**
 * Submit or update a rating for an event
 */
export async function submitEventRating(
  eventId: string,
  rating: number,
  feedbackText?: string | null
): Promise<EventRating> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to rate events')
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5 stars')
  }

  // Check if user can rate this event
  const canRate = await canUserRateEvent(eventId, user.id)
  if (!canRate) {
    throw new Error('You can only rate events you attended')
  }

  // Use upsert to handle both new ratings and updates
  const { data, error } = await supabase
    .from('event_ratings')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      rating,
      feedback_text: feedbackText,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'event_id,user_id'
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error submitting rating:', error)
    throw new Error('Failed to submit rating')
  }

  return data
}

/**
 * Get user's rating for a specific event
 */
export async function getUserEventRating(eventId: string): Promise<EventRating | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('event_ratings')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No rating found
    }
    console.error('Error fetching user rating:', error)
    return null
  }

  return data
}

/**
 * Get all ratings for an event
 */
export async function getEventRatings(eventId: string): Promise<EventRating[]> {
  const { data, error } = await supabase
    .from('event_ratings')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event ratings:', error)
    return []
  }

  return data || []
}

/**
 * Get average rating and count for an event
 */
export async function getEventRatingStats(eventId: string): Promise<{
  averageRating: number
  totalRatings: number
}> {
  const { data, error } = await supabase
    .from('event_ratings')
    .select('rating')
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching rating stats:', error)
    return { averageRating: 0, totalRatings: 0 }
  }

  if (!data || data.length === 0) {
    return { averageRating: 0, totalRatings: 0 }
  }

  const totalRatings = data.length
  const sumRatings = data.reduce((sum, rating) => sum + rating.rating, 0)
  const averageRating = Math.round((sumRatings / totalRatings) * 10) / 10

  return {
    averageRating,
    totalRatings
  }
}

/**
 * Check if user can rate an event (must have attended)
 */
export async function canUserRateEvent(eventId: string, userId?: string): Promise<boolean> {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    userId = user.id
  }

  try {
    // Check if user attended the event or is the host
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'going')
      .single()

    if (rsvpData) return true

    // Check if user was invited as crew member
    const { data: memberData } = await supabase
      .from('event_members')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single()

    if (memberData) return true

    // Check if user is the host
    const { data: eventData } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .eq('created_by', userId)
      .single()

    return !!eventData
  } catch (error) {
    console.error('Error checking rating permission:', error)
    return false
  }
}

/**
 * Delete a user's rating for an event
 */
export async function deleteEventRating(eventId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to delete ratings')
  }

  const { error } = await supabase
    .from('event_ratings')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting rating:', error)
    throw new Error('Failed to delete rating')
  }
}

/**
 * Check if an event has concluded (for rating eligibility)
 */
export async function hasEventConcluded(eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('events')
    .select('date_time')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error checking event date:', error)
    return false
  }

  const eventDate = new Date(data.date_time)
  const now = new Date()
  
  // Consider event concluded if it's more than 2 hours past the start time
  const twoHoursAfterEvent = new Date(eventDate.getTime() + (2 * 60 * 60 * 1000))
  
  return now > twoHoursAfterEvent
}

/**
 * Get events that user attended but hasn't rated yet (for rating reminders)
 */
export async function getUnratedAttendedEvents(userId?: string): Promise<any[]> {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    userId = user.id
  }

  // Get events user attended that concluded more than 2 hours ago
  const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString()

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      date_time,
      location,
      place_nickname
    `)
    .lt('date_time', twoHoursAgo)
    .or(`
      rsvps.user_id.eq.${userId}.and.rsvps.status.eq.going,
      event_members.user_id.eq.${userId}.and.event_members.status.eq.accepted,
      created_by.eq.${userId}
    `)
    .not('event_ratings.user_id', 'eq', userId)

  if (error) {
    console.error('Error fetching unrated events:', error)
    return []
  }

  return data || []
}
