import { supabase } from './supabase'
import { getCurrentUser } from './authUtils'
import { uploadFile } from './fileUpload'
import { cache, CACHE_KEYS } from './cache'
import type { EventPhoto, EventComment, EventCommentReaction } from '@/types'

/**
 * Check if user can access event media (photos/comments)
 * Allows access for hosts, attendees, and during live events
 */
export async function checkEventAttendance(eventId: string, userId: string): Promise<boolean> {
  const cacheKey = CACHE_KEYS.EVENT_ATTENDANCE(eventId, userId)

  // Check cache first (5 minute TTL)
  const cached = cache.get<boolean>(cacheKey)
  if (cached !== null) {
    return cached
  }

  try {
    // First get the event to check if user is the host and event status
    const { data: event } = await supabase
      .from('events')
      .select('id, created_by, date_time, end_time, duration_type')
      .eq('id', eventId)
      .single()

    if (!event) {
      cache.set(cacheKey, false, 60 * 1000) // Cache negative result for 1 minute
      return false
    }

    // User is the host
    if (event.created_by === userId) {
      cache.set(cacheKey, true, 5 * 60 * 1000) // Cache for 5 minutes
      return true
    }

    // Check if user RSVP'd as going
    const { data: userRsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'going')
      .maybeSingle()

    if (userRsvp) {
      cache.set(cacheKey, true, 5 * 60 * 1000) // Cache for 5 minutes
      return true
    }

    // Check if user was invited and accepted (private events)
    const { data: userMember } = await supabase
      .from('event_members')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle()

    if (userMember) {
      cache.set(cacheKey, true, 5 * 60 * 1000) // Cache for 5 minutes
      return true
    }

    cache.set(cacheKey, false, 5 * 60 * 1000) // Cache negative result for 5 minutes
    return false
  } catch (error) {
    console.error('Error checking event attendance:', error)
    cache.set(cacheKey, false, 60 * 1000) // Cache error as false for 1 minute
    return false
  }
}

/**
 * Upload a photo to an event gallery
 */
export async function uploadEventPhoto(
  eventId: string,
  file: File,
  caption?: string
): Promise<EventPhoto> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user can upload to this event
  const canUpload = await checkEventAttendance(eventId, user.id)
  if (!canUpload) {
    throw new Error('You can only upload photos to events you are attending or have attended')
  }

  try {
    // Upload file to event-photos bucket
    const uploadResult = await uploadFile(file, user.id, {
      bucket: 'event-photos',
      folder: eventId,
      maxSizeBytes: 10 * 1024 * 1024, // 10MB for event photos
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    })

    // Save photo record to database
    const { data: photo, error } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        uploaded_by: user.id,
        photo_url: uploadResult.url,
        storage_path: uploadResult.path,
        caption: caption || null
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to save photo: ${error.message}`)
    }

    // Get uploader profile separately
    const { data: uploaderProfile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single()

    return {
      ...photo,
      uploader: uploaderProfile
    }
  } catch (error) {
    console.error('Error uploading event photo:', error)
    throw error
  }
}

/**
 * Get all photos for an event
 */
export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user can view photos from this event
  const canView = await checkEventAttendance(eventId, user.id)
  if (!canView) {
    throw new Error('You can only view photos from events you are attending or have attended')
  }

  try {
    // Get photos first
    const { data: photos, error } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`)
    }

    if (!photos || photos.length === 0) {
      return []
    }

    // Get uploader profiles for all photos
    const uploaderIds = [...new Set(photos.map(p => p.uploaded_by))]
    const { data: uploaderProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', uploaderIds)

    // Combine data
    return photos.map(photo => ({
      ...photo,
      uploader: uploaderProfiles?.find(u => u.user_id === photo.uploaded_by)
    }))
  } catch (error) {
    console.error('Error fetching event photos:', error)
    throw error
  }
}

/**
 * Delete an event photo
 */
export async function deleteEventPhoto(photoId: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Get photo details first
    const { data: photo } = await supabase
      .from('event_photos')
      .select('*, events!inner(created_by)')
      .eq('id', photoId)
      .single()

    if (!photo) {
      throw new Error('Photo not found')
    }

    // Check if user can delete (owner or event host)
    const canDelete = photo.uploaded_by === user.id || photo.events.created_by === user.id
    if (!canDelete) {
      throw new Error('You can only delete your own photos or photos from events you host')
    }

    // Delete from storage
    await supabase.storage
      .from('event-photos')
      .remove([photo.storage_path])

    // Delete from database
    const { error } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      throw new Error(`Failed to delete photo: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting event photo:', error)
    throw error
  }
}

/**
 * Add a comment to an event
 */
export async function addEventComment(eventId: string, content: string): Promise<EventComment> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user can comment on this event
  const canComment = await checkEventAttendance(eventId, user.id)
  if (!canComment) {
    throw new Error('You can only comment on events you are attending or have attended')
  }

  try {
    const { data: comment, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: user.id,
        content: content.trim()
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`)
    }

    // Get user profile separately to avoid relationship issues
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single()

    return {
      ...comment,
      user: userProfile
    }
  } catch (error) {
    console.error('Error adding event comment:', error)
    throw error
  }
}

/**
 * Get all comments for an event
 */
export async function getEventComments(eventId: string): Promise<EventComment[]> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user can view comments from this event
  const canView = await checkEventAttendance(eventId, user.id)
  if (!canView) {
    throw new Error('You can only view comments from events you are attending or have attended')
  }

  try {
    // Get comments first
    const { data: comments, error } = await supabase
      .from('event_comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    if (!comments || comments.length === 0) {
      return []
    }

    // Get user profiles for all comment authors
    const userIds = [...new Set(comments.map(c => c.user_id))]
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds)

    // Get reactions for all comments
    const commentIds = comments.map(c => c.id)
    const { data: reactions } = await supabase
      .from('event_comment_reactions')
      .select('*')
      .in('comment_id', commentIds)

    // Combine data
    return comments.map(comment => ({
      ...comment,
      user: userProfiles?.find(u => u.user_id === comment.user_id),
      reactions: reactions?.filter(r => r.comment_id === comment.id) || []
    }))
  } catch (error) {
    console.error('Error fetching event comments:', error)
    throw error
  }
}

/**
 * Add a reaction to a comment
 */
export async function addCommentReaction(
  commentId: string,
  reaction: EventCommentReaction['reaction']
): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    const { error } = await supabase
      .from('event_comment_reactions')
      .upsert({
        comment_id: commentId,
        user_id: user.id,
        reaction
      })

    if (error) {
      throw new Error(`Failed to add reaction: ${error.message}`)
    }
  } catch (error) {
    console.error('Error adding comment reaction:', error)
    throw error
  }
}

/**
 * Remove a reaction from a comment
 */
export async function removeCommentReaction(
  commentId: string,
  reaction: EventCommentReaction['reaction']
): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    const { error } = await supabase
      .from('event_comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('reaction', reaction)

    if (error) {
      throw new Error(`Failed to remove reaction: ${error.message}`)
    }
  } catch (error) {
    console.error('Error removing comment reaction:', error)
    throw error
  }
}
