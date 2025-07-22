import { supabase } from './supabase'
import { toast } from 'sonner'
import { sendEventInvitationEmail, type EventInvitationData } from './emailService'

/**
 * Enhanced Event Invitation Service
 * Handles the new crew invitation system where crew members receive invitations
 * instead of being automatically added to events
 */

/**
 * Send email invitations to all pending event invitations
 * Uses the frontend email service as per architecture
 */
async function sendEventInvitationEmails(eventId: string, inviterId: string): Promise<void> {
  try {
    console.log('📧 Starting sendEventInvitationEmails for:', { eventId, inviterId })

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('❌ Failed to get event details:', eventError)
      throw new Error('Event not found')
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('user_id', inviterId)
      .single()

    if (inviterError) {
      console.error('❌ Failed to get inviter details:', inviterError)
    }

    // Get pending invitations with user IDs
    const { data: invitations, error: invitationsError } = await supabase
      .from('event_members')
      .select('id, user_id')
      .eq('event_id', eventId)
      .eq('invited_by', inviterId)
      .eq('status', 'pending')

    if (invitationsError) {
      console.error('❌ Failed to get invitations:', invitationsError)
      throw invitationsError
    }

    if (!invitations || invitations.length === 0) {
      console.log('📧 No pending invitations found')
      return
    }

    let emailsSent = 0
    let emailsFailed = 0

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Get user email using RPC function (avoids direct auth.users access)
        const { data: userEmailData, error: emailError } = await supabase
          .rpc('get_user_email', { user_id: invitation.user_id })

        if (emailError || !userEmailData) {
          console.warn('⚠️ No email found for user:', invitation.user_id)
          emailsFailed++
          continue
        }

        const userEmail = userEmailData

        // Create invitation tokens (frontend responsibility per architecture)
        const acceptToken = `event_accept_${crypto.randomUUID().replace(/-/g, '')}`
        const declineToken = `event_decline_${crypto.randomUUID().replace(/-/g, '')}`

        // Store tokens in database
        const { error: tokenError } = await supabase
          .from('invitation_tokens')
          .insert([
            {
              token: acceptToken,
              invitation_type: 'event',
              invitation_id: invitation.id.toString(),
              action: 'accept',
              user_id: invitation.user_id,
              expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
              response_status: 'pending'
            },
            {
              token: declineToken,
              invitation_type: 'event',
              invitation_id: invitation.id.toString(),
              action: 'decline',
              user_id: invitation.user_id,
              expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
              response_status: 'pending'
            }
          ])

        if (tokenError) {
          console.warn('⚠️ Failed to create tokens for invitation:', invitation.id, tokenError)
          // Continue without tokens (fallback to generic URLs)
        }

        // Prepare email data according to EventInvitationData interface
        const emailData: EventInvitationData = {
          inviterName: inviter?.display_name || inviter?.username || 'Someone',
          eventTitle: event.title,
          eventDate: new Date(event.date_time).toLocaleDateString(),
          eventTime: new Date(event.date_time).toLocaleTimeString(),
          eventLocation: event.location,
          eventDescription: event.description,
          acceptUrl: `https://thirstee.app/invitation/event/accept/${acceptToken}`,
          declineUrl: `https://thirstee.app/invitation/event/decline/${declineToken}`,
          eventUrl: `https://thirstee.app/event/${eventId}`
        }

        // Send email using the proper frontend service
        const result = await sendEventInvitationEmail(userEmail, emailData)

        if (result.success) {
          emailsSent++
          console.log('✅ Email sent to:', userEmail)
        } else {
          emailsFailed++
          console.error('❌ Failed to send email to:', userEmail, result.error)
        }

      } catch (error: any) {
        emailsFailed++
        console.error('❌ Error sending email to invitation:', invitation.id, error)
      }
    }

    console.log(`📧 Email results: ${emailsSent} sent, ${emailsFailed} failed`)

  } catch (error: any) {
    console.error('❌ Failed to send event invitation emails:', error)
    throw error
  }
}

export interface EventInvitation {
  invitation_id: string
  event_id: string
  event_title: string
  event_date_time: string
  event_location: string
  inviter_id: string
  inviter_name: string
  invitation_sent_at: string
  status: 'pending' | 'accepted' | 'declined'
  invitation_comment?: string
}

export interface InvitationResponse {
  response: 'accepted' | 'declined'
  comment?: string
}

/**
 * Send event invitations to individual users
 * Uses the new send_event_invitations_to_users RPC function for consistency
 */
export async function sendEventInvitationsToUsers(
  eventId: string,
  userIds: string[],
  currentUserId: string
): Promise<{ success: boolean; invitedCount: number; message: string }> {
  try {
    console.log('🔔 [EventInvitationService] Sending event invitations to users:', {
      eventId,
      userIds,
      currentUserId,
      userCount: userIds.length
    })

    // Validate inputs
    if (!eventId || !userIds || userIds.length === 0 || !currentUserId) {
      console.error('❌ [EventInvitationService] Invalid parameters:', { eventId, userIds, currentUserId })
      throw new Error('Invalid parameters for user invitations')
    }

    // Use RPC function to send invitations (consistent with crew invitations)
    console.log('📤 [EventInvitationService] Calling send_event_invitations_to_users RPC with parameters:', {
      p_event_id: eventId,
      p_user_ids: userIds,
      p_invited_by: currentUserId
    })

    const { data, error } = await supabase
      .rpc('send_event_invitations_to_users', {
        p_event_id: eventId,
        p_user_ids: userIds,
        p_invited_by: currentUserId
      })

    console.log('📥 [EventInvitationService] RPC response:', { data, error })

    if (error) {
      console.error('❌ [EventInvitationService] Error sending user invitations:', error)
      console.error('❌ [EventInvitationService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      // Show user-friendly error
      toast.error(`Failed to send invitations: ${error.message}`)
      throw error
    }

    // RPC functions return INTEGER directly, not an object with invited_count
    const invitedCount = data || 0
    console.log('✅ [EventInvitationService] Successfully invited users:', { invitedCount })

    // Additional debugging: Check if notifications were actually created
    if (invitedCount > 0) {
      console.log('🔍 [EventInvitationService] Verifying notifications were created...')

      try {
        const { data: notifications, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('type', 'event_invitation')
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(userIds.length)

        console.log('📋 [EventInvitationService] Recent notifications:', { notifications, notifError })

        if (notifError) {
          console.error('❌ [EventInvitationService] Error checking notifications:', notifError)
        } else {
          console.log(`✅ [EventInvitationService] Found ${notifications?.length || 0} notifications for ${userIds.length} invited users`)
        }
      } catch (notifCheckError) {
        console.error('❌ [EventInvitationService] Exception checking notifications:', notifCheckError)
      }
    }

    // Send email invitations if any users were invited
    if (invitedCount > 0) {
      try {
        console.log('📧 Attempting to send email invitations...')
        console.log('📧 Calling sendEventInvitationEmails with:', { eventId, inviterId: currentUserId })

        // Send emails immediately without delay
        await sendEventInvitationEmails(eventId, currentUserId)
        console.log('✅ Email invitations sent successfully')

        // Force a small delay to ensure notifications are processed
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (emailError: any) {
        console.error('❌ Email invitation error:', emailError)
        // Don't fail the whole operation but log the error clearly
        console.error('❌ Email error details:', {
          eventId,
          userId: currentUserId,
          invitedCount,
          error: emailError,
          errorStack: emailError?.stack
        })
      }
    }

    return {
      success: true,
      invitedCount,
      message: invitedCount > 0
        ? `Successfully invited ${invitedCount} user${invitedCount > 1 ? 's' : ''} to the event`
        : 'No new users were invited (they may already be invited or joined)'
    }

  } catch (error: any) {
    console.error('❌ [EventInvitationService] Failed to send user invitations:', error)
    return {
      success: false,
      invitedCount: 0,
      message: error.message || 'Failed to send invitations'
    }
  }
}

/**
 * Send event invitations to crew members
 * This replaces the old auto-add functionality
 */
export async function sendEventInvitationsToCrew(
  eventId: string,
  crewId: string,
  currentUserId: string
): Promise<{ success: boolean; invitedCount: number; message: string }> {
  try {

    console.log('🔔 [EventInvitationService] Sending event invitations to crew:', {
      eventId,
      crewId,
      currentUserId,
      crewIdType: typeof crewId,
      crewIdLength: crewId.length,
      isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(crewId)
    })

    // Use RPC function to send invitations (using p_invited_by parameter)
    console.log('📤 [EventInvitationService] Calling send_event_invitations_to_crew RPC with parameters:', {
      p_event_id: eventId,
      p_crew_id: crewId,
      p_invited_by: currentUserId
    })

    const { data, error } = await supabase
      .rpc('send_event_invitations_to_crew', {
        p_event_id: eventId,
        p_crew_id: crewId,
        p_invited_by: currentUserId
      })

    console.log('📥 [EventInvitationService] RPC response:', { data, error })

    if (error) {
      console.error('❌ [EventInvitationService] Error sending crew invitations:', error)
      console.error('❌ [EventInvitationService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    // RPC functions return INTEGER directly, not an object with invited_count
    const invitedCount = data || 0

    console.log('✅ Crew invitations sent:', { invitedCount })

    // Send email invitations if any were sent
    console.log('🔍 Debug - About to check if we should send emails:', { invitedCount, eventId, userId: currentUserId })

    if (invitedCount > 0) {
      try {
        console.log('📧 Attempting to send email invitations...')
        console.log('📧 Calling sendEventInvitationEmails with:', { eventId, inviterId: currentUserId })

        // Send emails immediately without delay
        await sendEventInvitationEmails(eventId, currentUserId)
        console.log('✅ Email invitations sent successfully')

        // Force a small delay to ensure notifications are processed
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (emailError: any) {
        console.error('❌ Email invitation error:', emailError)
        // Don't fail the whole operation but log the error clearly
        console.error('❌ Email error details:', {
          eventId,
          userId: currentUserId,
          invitedCount,
          error: emailError,
          errorStack: emailError?.stack
        })
      }
    } else {
      console.log('⚠️ No invitations sent, skipping email notifications')
      console.log('⚠️ This means the RPC function returned invitedCount = 0')
    }

    return {
      success: true,
      invitedCount,
      message: invitedCount > 0
        ? `🍺 Invitations sent to ${invitedCount} crew member${invitedCount > 1 ? 's' : ''}!`
        : 'No crew members to invite'
    }

  } catch (error: any) {
    console.error('❌ Failed to send crew invitations:', error)
    return {
      success: false,
      invitedCount: 0,
      message: error.message || 'Failed to send invitations'
    }
  }
}

/**
 * SINGLE SOURCE OF TRUTH: Process invitation response from any source
 * Handles both email and in-app responses with unified logic
 */
export async function processInvitationResponse(
  invitationId: string,
  response: 'accepted' | 'declined',
  source: 'email' | 'app',
  currentUserId: string,
  comment?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  console.log('📝 [EventInvitationService] Processing invitation response:', {
    invitationId,
    response,
    source,
    currentUserId,
    comment
  })

  try {
    // Use RPC function to respond to invitation
    console.log('📤 [EventInvitationService] Calling respond_to_event_invitation RPC')
    const { data, error } = await supabase
      .rpc('respond_to_event_invitation', {
        p_invitation_id: invitationId,
        p_user_id: currentUserId,
        p_response: response,
        p_comment: comment || null
      })

    console.log('📥 [EventInvitationService] RPC response:', { data, error })

    if (error) {
      console.error('❌ [EventInvitationService] Error responding to invitation:', error)
      throw error
    }

    console.log('✅ [EventInvitationService] Invitation response processed successfully')

    // Update notification state in real-time for both email and app responses
    console.log('🔄 [EventInvitationService] Updating notification state')
    await updateNotificationState(invitationId, response, currentUserId)
    console.log('✅ [EventInvitationService] Notification state updated')

    const message = response === 'accepted'
      ? '🎉 You\'re in! See you at the session!'
      : '👍 Response sent. Maybe next time!'

    // Show success toast (only for app responses, email responses show their own UI)
    if (source === 'app') {
      console.log('🍞 [EventInvitationService] Showing success toast for app response')
      toast.success(message)
    }

    return {
      success: true,
      message,
      data
    }

  } catch (error: any) {
    console.error('❌ [EventInvitationService] Failed to process invitation response:', error)
    return {
      success: false,
      message: error.message || 'Failed to respond to invitation'
    }
  }
}

/**
 * Update notification state to reflect response
 * This ensures email responses update your notification UI
 */
async function updateNotificationState(
  invitationId: string,
  response: 'accepted' | 'declined',
  userId: string
): Promise<void> {
  console.log('🔄 [EventInvitationService] Updating notification state:', {
    invitationId,
    response,
    userId
  })

  try {
    // Try multiple approaches to find the notification
    // Approach 1: Look for exact invitation_id match
    console.log('🔍 [EventInvitationService] Approach 1: Looking for exact invitation_id match')
    let { data: currentNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, data')
      .eq('user_id', userId)
      .eq('type', 'event_invitation')
      .contains('data', { invitation_id: invitationId })
      .maybeSingle()

    console.log('📥 [EventInvitationService] Approach 1 result:', { currentNotification, fetchError })

    // Approach 2: If not found, look for string version of invitation_id
    if (!currentNotification && !fetchError) {
      console.log('🔍 [EventInvitationService] Approach 2: Looking for string version of invitation_id')
      const { data: altNotification } = await supabase
        .from('notifications')
        .select('id, data')
        .eq('user_id', userId)
        .eq('type', 'event_invitation')
        .contains('data', { invitation_id: invitationId.toString() })
        .maybeSingle()

      console.log('📥 [EventInvitationService] Approach 2 result:', { altNotification })
      currentNotification = altNotification
    }

    // Approach 3: If still not found, search by event_id from the invitation
    if (!currentNotification) {
      console.log('🔍 [EventInvitationService] Approach 3: Looking up event_id from invitation')
      // Get event_id from the invitation
      const { data: invitation } = await supabase
        .from('event_members')
        .select('event_id')
        .eq('id', invitationId)
        .single()

      console.log('📥 [EventInvitationService] Invitation lookup result:', { invitation })

      if (invitation) {
        console.log('🔍 [EventInvitationService] Searching notifications by event_id:', invitation.event_id)
        const { data: eventNotification } = await supabase
          .from('notifications')
          .select('id, data')
          .eq('user_id', userId)
          .eq('type', 'event_invitation')
          .contains('data', { event_id: invitation.event_id })
          .maybeSingle()

        console.log('📥 [EventInvitationService] Event notification result:', { eventNotification })
        currentNotification = eventNotification
      }
    }

    if (!currentNotification) {
      console.log('⚠️ [EventInvitationService] No notification found to update - this might be expected for some flows')
      return
    }

    console.log('✅ [EventInvitationService] Found notification to update:', currentNotification)

    // Merge the response data with existing data
    const updatedData = {
      ...currentNotification.data,
      user_response: response,
      responded_at: new Date().toISOString(),
      response_method: 'in_app'
    }

    console.log('📝 [EventInvitationService] Updating notification with data:', {
      notificationId: currentNotification.id,
      originalData: currentNotification.data,
      updatedData
    })

    // Update the notification with merged data
    const { error } = await supabase
      .from('notifications')
      .update({ data: updatedData })
      .eq('id', currentNotification.id)

    if (error) {
      console.error('❌ [EventInvitationService] Failed to update notification state:', error)
    } else {
      console.log('✅ [EventInvitationService] Notification state updated successfully')
    }
  } catch (error) {
    console.error('❌ [EventInvitationService] Error updating notification state:', error)
  }
}

/**
 * Process email invitation token - unified approach
 * Handles token validation and calls the unified response processor
 */
export async function processEmailInvitationToken(
  token: string,
  type: 'event' | 'crew',
  action: 'accept' | 'decline',
  userId?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log('📧 Processing email invitation token:', { token, type, action })

    // First validate the token and get invitation details
    const { data: tokenData, error: tokenError } = await supabase
      .from('invitation_tokens')
      .select(`
        *,
        invitation_id
      `)
      .eq('token', token)
      .eq('invitation_type', type)
      .eq('action', action)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      return {
        success: false,
        message: 'Invalid or expired invitation token'
      }
    }

    // Check if user is authenticated (wait for auth to load)
    if (!userId) {
      // Try to get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          message: 'Please log in to respond to this invitation',
          data: { requires_auth: true }
        }
      }
      userId = user.id
    }

    // Verify the token belongs to this user
    if (tokenData.user_id !== userId) {
      return {
        success: false,
        message: 'This invitation is not for your account'
      }
    }

    // For email responses, use the database function directly for better integration
    if (type === 'event') {
      // Use the database function that handles everything including redirect URLs
      const { data: dbResult, error: dbError } = await supabase
        .rpc('process_event_invitation_token', {
          p_token: token,
          p_user_id: userId
        })

      if (dbError) {
        console.error('❌ Database function error:', dbError)
        return {
          success: false,
          message: dbError.message || 'Failed to process invitation'
        }
      }

      // The database function returns all the data we need
      return {
        success: dbResult.success,
        message: dbResult.message,
        data: {
          action: dbResult.action,
          event_title: dbResult.event_title,
          event_id: dbResult.event_id,
          redirect_url: dbResult.redirect_url,
          requires_auth: false
        }
      }
    } else {
      // For crew invitations, use the frontend flow
      const response = action === 'accept' ? 'accepted' : 'declined'
      const result = await processInvitationResponse(
        tokenData.invitation_id,
        response,
        'email',
        userId
      )

      if (!result.success) {
        return result
      }

      // Mark token as used
      await supabase
        .from('invitation_tokens')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('token', token)

      return {
        success: true,
        message: result.message,
        data: { action }
      }
    }

  } catch (error: any) {
    console.error('❌ Failed to process email invitation token:', error)
    return {
      success: false,
      message: error.message || 'Failed to process invitation'
    }
  }
}

/**
 * Legacy function - now uses the unified processor
 * Kept for backward compatibility
 */
export async function respondToEventInvitation(
  invitationId: string,
  response: InvitationResponse,
  currentUserId: string
): Promise<{ success: boolean; message: string }> {
  return processInvitationResponse(
    invitationId,
    response.response,
    'app',
    currentUserId,
    response.comment
  )
}

/**
 * Get pending event invitations for current user
 */
export async function getPendingEventInvitations(currentUserId: string): Promise<EventInvitation[]> {
  try {
    if (!currentUserId) return []

    console.log('📥 Fetching pending event invitations')

    // Use RPC function to get pending invitations
    const { data, error } = await supabase
      .rpc('get_user_pending_event_invitations', {
        p_user_id: currentUserId
      })

    if (error) {
      console.error('❌ Error fetching pending invitations:', error)
      throw error
    }

    const invitations = (data || []).map((invitation: any) => ({
      invitation_id: invitation.invitation_id,
      event_id: invitation.event_id,
      event_title: invitation.event_title,
      event_date_time: invitation.event_date_time,
      event_location: invitation.event_location,
      inviter_id: invitation.inviter_id,
      inviter_name: invitation.inviter_name,
      invitation_sent_at: invitation.invitation_sent_at,
      status: 'pending' as const
    }))

    console.log('📊 Found pending invitations:', invitations.length)

    return invitations

  } catch (error: any) {
    console.error('❌ Failed to fetch pending invitations:', error)
    return []
  }
}

/**
 * Get invitation responses for an event (for event hosts)
 */
export async function getEventInvitationResponses(eventId: string, currentUserId: string): Promise<{
  pending: number
  accepted: number
  declined: number
  responses: Array<{
    user_id: string
    user_name: string
    status: string
    comment?: string
    responded_at?: string
  }>
}> {
  try {
    if (!currentUserId) throw new Error('Not authenticated')

    console.log('📊 Fetching invitation responses for event:', eventId)

    // Get all event members (invitations) for this event
    const { data: invitations, error } = await supabase
      .from('event_members')
      .select(`
        user_id,
        status,
        invitation_comment,
        invitation_responded_at,
        user_profiles!inner(display_name)
      `)
      .eq('event_id', eventId)
      .eq('invited_by', currentUserId) // Only invitations sent by current user

    if (error) {
      console.error('❌ Error fetching invitation responses:', error)
      throw error
    }

    const responses = (invitations || []).map((inv: any) => ({
      user_id: inv.user_id,
      user_name: inv.user_profiles?.display_name || 'Unknown User',
      status: inv.status,
      comment: inv.invitation_comment,
      responded_at: inv.invitation_responded_at
    }))

    const pending = responses.filter(r => r.status === 'pending').length
    const accepted = responses.filter(r => r.status === 'accepted').length
    const declined = responses.filter(r => r.status === 'declined').length

    console.log('📈 Invitation stats:', { pending, accepted, declined })

    return {
      pending,
      accepted,
      declined,
      responses
    }

  } catch (error: any) {
    console.error('❌ Failed to fetch invitation responses:', error)
    return {
      pending: 0,
      accepted: 0,
      declined: 0,
      responses: []
    }
  }
}

/**
 * Cancel pending invitations for an event
 */
export async function cancelEventInvitations(eventId: string, currentUserId: string): Promise<boolean> {
  try {
    if (!currentUserId) throw new Error('Not authenticated')

    console.log('❌ Cancelling pending invitations for event:', eventId)

    // Delete pending invitations
    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('invited_by', currentUserId)
      .eq('status', 'pending')

    if (error) {
      console.error('❌ Error cancelling invitations:', error)
      throw error
    }

    console.log('✅ Pending invitations cancelled')
    return true

  } catch (error: any) {
    console.error('❌ Failed to cancel invitations:', error)
    return false
  }
}

/**
 * Show toast notification for invitation response
 */
export function showInvitationResponseToast(response: 'accepted' | 'declined', comment?: string) {
  if (response === 'accepted') {
    toast.success('🎉 Invitation accepted! See you there!', {
      description: comment ? `Your message: "${comment}"` : undefined
    })
  } else {
    toast.success('👍 Response sent', {
      description: comment ? `Your message: "${comment}"` : 'Maybe next time!'
    })
  }
}
