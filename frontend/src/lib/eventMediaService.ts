import { supabase } from './supabase'
import { uploadFile } from './fileUpload'
import type { EventPhoto, EventComment, EventCommentReaction } from '@/types'

/**
 * Check if user attended an event (has permission to view/add media)
 */
export async function checkEventAttendance(eventId: string, userId: string): Promise<boolean> {
  try {
    const { data: event } = await supabase
      .from('events')
      .select(`
        id,
        created_by,
        rsvps!inner(user_id, status),
        event_members!inner(user_id, status)
      `)
      .eq('id', eventId)
      .single()

    if (!event) return false

    // User is the host
    if (event.created_by === userId) return true

    // User RSVP'd as going
    const userRsvp = event.rsvps?.find(r => r.user_id === userId && r.status === 'going')
    if (userRsvp) return true

    // User was invited and accepted (private events)
    const userMember = event.event_members?.find(m => m.user_id === userId && m.status === 'accepted')
    if (userMember) return true

    return false
  } catch (error) {
    console.error('Error checking event attendance:', error)
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
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user attended the event
  const canUpload = await checkEventAttendance(eventId, user.id)
  if (!canUpload) {
    throw new Error('You can only upload photos to events you attended')
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
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to save photo: ${error.message}`)
    }

    return photo
  } catch (error) {
    console.error('Error uploading event photo:', error)
    throw error
  }
}

/**
 * Get all photos for an event
 */
export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user attended the event
  const canView = await checkEventAttendance(eventId, user.id)
  if (!canView) {
    throw new Error('You can only view photos from events you attended')
  }

  try {
    const { data: photos, error } = await supabase
      .from('event_photos')
      .select(`
        *,
        uploader:uploaded_by(display_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`)
    }

    return photos || []
  } catch (error) {
    console.error('Error fetching event photos:', error)
    throw error
  }
}

/**
 * Delete an event photo
 */
export async function deleteEventPhoto(photoId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
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
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user attended the event
  const canComment = await checkEventAttendance(eventId, user.id)
  if (!canComment) {
    throw new Error('You can only comment on events you attended')
  }

  try {
    const { data: comment, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        user:user_id(display_name, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`)
    }

    return comment
  } catch (error) {
    console.error('Error adding event comment:', error)
    throw error
  }
}

/**
 * Get all comments for an event
 */
export async function getEventComments(eventId: string): Promise<EventComment[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user attended the event
  const canView = await checkEventAttendance(eventId, user.id)
  if (!canView) {
    throw new Error('You can only view comments from events you attended')
  }

  try {
    const { data: comments, error } = await supabase
      .from('event_comments')
      .select(`
        *,
        user:user_id(display_name, avatar_url),
        reactions:event_comment_reactions(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return comments || []
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
  const { data: { user } } = await supabase.auth.getUser()
  
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
  const { data: { user } } = await supabase.auth.getUser()
  
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
