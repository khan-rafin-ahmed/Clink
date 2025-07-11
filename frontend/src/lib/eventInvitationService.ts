import { supabase } from './supabase'
import { sendEventInvitationEmail, type EventInvitationData } from './emailService'
import { generateInvitationToken } from './invitationTokenService'
import { toast } from 'sonner'

/**
 * Enhanced Event Invitation Service
 * Handles the new crew invitation system where crew members receive invitations
 * instead of being automatically added to events
 */

/**
 * Send email invitations to all pending event invitations
 * Uses the user_emails view to access user emails securely
 */
async function sendEventInvitationEmails(eventId: string, inviterId: string): Promise<void> {
  try {
    console.log('📧 Starting sendEventInvitationEmails for:', { eventId, inviterId })

    // Get event details
    console.log('🔍 Looking for event with ID:', eventId)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    console.log('🔍 Event query result:', { event, eventError })

    if (eventError || !event) {
      console.error('❌ Event not found:', { eventId, eventError })
      throw new Error(`Event not found: ${eventError?.message || 'Unknown error'}`)
    }

    console.log('✅ Found event:', event.title)

    // Get inviter details
    console.log('🔍 Looking for inviter with ID:', inviterId)
    const { data: inviter, error: inviterError } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', inviterId)
      .single()

    console.log('🔍 Inviter query result:', { inviter, inviterError })

    if (inviterError || !inviter) {
      console.error('❌ Inviter not found:', { inviterId, inviterError })
      throw new Error(`Inviter not found: ${inviterError?.message || 'Unknown error'}`)
    }

    console.log('✅ Found inviter:', inviter.display_name)

    // Get pending invitations with user emails from user_profiles
    // Using a manual approach since the foreign key relationship seems broken
    const { data: eventMembers, error: eventMembersError } = await supabase
      .from('event_members')
      .select('id, user_id')
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .eq('invited_by', inviterId)

    if (eventMembersError) {
      console.error('Failed to fetch event members:', eventMembersError)
      throw new Error('Failed to fetch event members')
    }

    if (!eventMembers || eventMembers.length === 0) {
      console.log('❌ No pending event members found for this event')
      return
    }

    console.log(`📧 Found ${eventMembers.length} pending event members`)

    // Get user profiles for these members
    const userIds = eventMembers.map(em => em.user_id)
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .in('user_id', userIds)

    if (profilesError) {
      console.error('Failed to fetch user profiles:', profilesError)
      throw new Error('Failed to fetch user profiles')
    }

    // Combine the data
    const invitations = eventMembers.map(em => {
      const profile = userProfiles?.find(p => p.user_id === em.user_id)
      return {
        id: em.id,
        user_id: em.user_id,
        user_profiles: profile
      }
    }).filter(inv => inv.user_profiles?.email) // Only include users with emails

    console.log('🔍 Debug - Combined invitations result:', {
      invitations,
      invitationCount: invitations.length,
      eventMembersFound: eventMembers?.length || 0,
      userProfilesFound: userProfiles?.length || 0
    })

    if (!invitations || invitations.length === 0) {
      console.log('❌ No pending invitations found for this event')

      // Let's check if there are ANY event_members for this event
      const { data: allMembers, error: allMembersError } = await supabase
        .from('event_members')
        .select('*')
        .eq('event_id', eventId)

      console.log('🔍 Debug - All event members for this event:', { allMembers, allMembersError })
      return
    }

    console.log(`📧 Found ${invitations.length} invitations to send emails for`)

    // Debug: Check what emails we actually have
    invitations.forEach((inv, index) => {
      console.log(`🔍 Invitation ${index + 1}:`, {
        id: inv.id,
        user_id: inv.user_id,
        display_name: inv.user_profiles?.display_name,
        email: inv.user_profiles?.email,
        has_email: !!inv.user_profiles?.email
      })
    })

    // Send emails for each invitation with fallback email retrieval
    const emailPromises = invitations.map(async (invitation: any) => {
      let userEmail = invitation.user_profiles?.email
      let userName = invitation.user_profiles?.display_name

      // If no email in user_profiles, try fallback
      if (!userEmail) {
        console.log(`⚠️ No email in user_profiles for invitation ${invitation.id}, trying fallback...`)

        try {
          const { data: secureData, error: secureError } = await supabase
            .rpc('get_user_email_for_invitation', { p_user_id: invitation.user_id })
            .single()

          if (secureData && (secureData as any).email) {
            userEmail = (secureData as any).email
            userName = (secureData as any).display_name
            console.log(`✅ Found email via secure function for invitation ${invitation.id}:`, userEmail)
          } else {
            console.warn(`❌ No email found for invitation ${invitation.id} even with fallback, skipping`)
            return { success: false, error: 'No email address found' }
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback email lookup failed for invitation ${invitation.id}:`, fallbackError)
          return { success: false, error: 'Email lookup failed' }
        }
      }

      // Format date and time properly
      const eventDateTime = new Date(event.date_time)
      const eventDate = eventDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      const eventTime = eventDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      // Generate secure tokenized URLs for invitation actions
      let acceptToken, declineToken
      try {
        const [acceptTokenResult, declineTokenResult] = await Promise.all([
          generateInvitationToken('event', invitation.id, 'accept', invitation.user_id),
          generateInvitationToken('event', invitation.id, 'decline', invitation.user_id)
        ])
        acceptToken = acceptTokenResult
        declineToken = declineTokenResult
      } catch (error) {
        console.error('Failed to generate invitation tokens:', error)
        // Tokens will be undefined, email template will use fallback URLs
      }

      const emailData: EventInvitationData = {
        eventTitle: event.title,
        eventDate: eventDate,
        eventTime: eventTime,
        eventLocation: event.location,
        inviterName: inviter.display_name,
        eventDescription: event.notes || undefined,
        acceptUrl: acceptToken ? `https://thirstee.app/invitation/event/accept/${acceptToken}` : `https://thirstee.app/notifications`,
        declineUrl: declineToken ? `https://thirstee.app/invitation/event/decline/${declineToken}` : `https://thirstee.app/notifications`,
        eventUrl: `https://thirstee.app/event/${event.slug || event.id}`,
        vibe: event.vibe || 'casual'
      }

      try {
        console.log(`📧 Sending email to ${userEmail} (${userName})`)
        const result = await sendEventInvitationEmail(userEmail, emailData)

        if (result.success) {
          console.log(`✅ Email sent successfully to ${userEmail}`)
        } else {
          console.error(`❌ Failed to send email to ${userEmail}:`, result.error)
        }

        return result
      } catch (error) {
        console.error(`❌ Error sending email to ${userEmail}:`, error)
        return { success: false, error: (error as any).message }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`📧 Email sending complete: ${successCount} sent, ${failCount} failed`)

    if (failCount > 0) {
      const failedResults = results.filter(r => !r.success)
      console.error('❌ Failed email details:', failedResults)
    }

  } catch (error) {
    console.error('Failed to send event invitation emails:', error)
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

    const result = data?.[0]
    const invitedCount = result?.invited_count || 0

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
      responded_at: new Date().toISOString()
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
