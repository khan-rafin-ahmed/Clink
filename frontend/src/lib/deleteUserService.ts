import { supabase } from './supabase'
import { toast } from 'sonner'

/**
 * Comprehensive user account deletion service
 * Handles cascading deletions while maintaining data integrity
 */

export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // Step 1: Notify attendees of events that will be cancelled
    await notifyEventAttendeesOfDeletion(userId)

    // Step 2: Call the database function to handle cascading deletions
    const { error: deleteError } = await supabase.rpc('delete_user_account', {
      target_user_id: userId
    })

    if (deleteError) {
      console.error('Database deletion error:', deleteError)
      throw new Error(`Failed to delete account data: ${deleteError.message}`)
    }

    // Step 3: Clear local session and storage
    await supabase.auth.signOut()

    // Clear any cached data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('thirstee-auth-token')
      sessionStorage.clear()
    }

    // Note: We cannot delete the auth user from the client side using admin functions
    // The auth user will remain but will have no associated data
    // In a production app, you would typically:
    // 1. Call a server-side function/API that has admin privileges
    // 2. Or implement a cleanup job that removes orphaned auth users
    // For now, the user data is deleted and they are signed out

  } catch (error: any) {
    console.error('Account deletion failed:', error)
    throw new Error(error.message || 'Failed to delete account. Please try again or contact support.')
  }
}

/**
 * Check if user can be safely deleted
 * Returns information about what will be deleted
 */
export async function getUserDeletionInfo(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_deletion_info', {
      target_user_id: userId
    })

    if (error) {
      console.error('Error getting deletion info:', error)
      throw error
    }

    return data
  } catch (error: any) {
    console.error('Failed to get user deletion info:', error)
    throw new Error('Failed to check account deletion requirements')
  }
}

/**
 * Notify attendees of events that will be deleted
 * This should be called before actual deletion
 */
export async function notifyEventAttendeesOfDeletion(userId: string): Promise<void> {
  try {
    // Get all events created by this user that have attendees
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date_time,
        rsvps!inner(user_id, status)
      `)
      .eq('created_by', userId)
      .eq('rsvps.status', 'accepted')

    if (error) {
      console.error('Error fetching user events:', error)
      return
    }

    if (!events || events.length === 0) {
      return
    }

    // Create notifications for each attendee
    const notifications = events.flatMap(event => 
      event.rsvps
        .filter((rsvp: any) => rsvp.user_id !== userId) // Don't notify the user being deleted
        .map((rsvp: any) => ({
          user_id: rsvp.user_id,
          type: 'event_cancelled',
          title: 'Event Cancelled',
          message: `The event "${event.title}" has been cancelled because the host deleted their account.`,
          data: {
            event_id: event.id,
            event_title: event.title,
            event_date: event.date_time,
            reason: 'host_account_deleted'
          }
        }))
    )

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating deletion notifications:', notificationError)
        // Don't throw here - notifications are nice to have but not critical
      }
    }

  } catch (error) {
    console.error('Error notifying event attendees:', error)
    // Don't throw - this is a best-effort notification
  }
}
