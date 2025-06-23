import { supabase } from './supabase'
import { sendEventInvitationEmail, type EventInvitationData } from './emailService'
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

      const emailData: EventInvitationData = {
        eventTitle: event.title,
        eventDate: eventDate,
        eventTime: eventTime,
        eventLocation: event.location,
        inviterName: inviter.display_name,
        eventDescription: event.notes || undefined,
        acceptUrl: `${window.location.origin}/event/${event.id}/accept/${invitation.id}`,
        declineUrl: `${window.location.origin}/event/${event.id}/decline/${invitation.id}`,
        eventUrl: `${window.location.origin}/event/${event.id}`,
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
  crewId: string
): Promise<{ success: boolean; invitedCount: number; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    console.log('🔔 Sending event invitations to crew:', {
      eventId,
      crewId,
      crewIdType: typeof crewId,
      crewIdLength: crewId.length,
      isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(crewId)
    })

    // Use RPC function to send invitations
    const { data, error } = await supabase
      .rpc('send_event_invitations_to_crew', {
        p_event_id: eventId,
        p_crew_id: crewId,
        p_inviter_id: user.id
      })

    if (error) {
      console.error('❌ Error sending crew invitations:', error)
      throw error
    }

    const result = data?.[0]
    const invitedCount = result?.invited_count || 0

    console.log('✅ Crew invitations sent:', { invitedCount })

    // Send email invitations if any were sent
    console.log('🔍 Debug - About to check if we should send emails:', { invitedCount, eventId, userId: user.id })

    if (invitedCount > 0) {
      try {
        console.log('📧 Attempting to send email invitations...')
        console.log('📧 Calling sendEventInvitationEmails with:', { eventId, inviterId: user.id })
        await sendEventInvitationEmails(eventId, user.id)
        console.log('✅ Email invitations sent successfully')
      } catch (emailError) {
        console.error('❌ Email invitation error:', emailError)
        // Don't fail the whole operation but log the error clearly
        console.error('❌ Email error details:', {
          eventId,
          userId: user.id,
          invitedCount,
          error: emailError,
          errorStack: emailError.stack
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
 * Respond to an event invitation
 */
export async function respondToEventInvitation(
  invitationId: string,
  response: InvitationResponse
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    console.log('📝 Responding to event invitation:', { invitationId, response })

    // Use RPC function to respond to invitation
    const { data, error } = await supabase
      .rpc('respond_to_event_invitation', {
        p_invitation_id: invitationId,
        p_user_id: user.id,
        p_response: response.response,
        p_comment: response.comment || null
      })

    if (error) {
      console.error('❌ Error responding to invitation:', error)
      throw error
    }

    console.log('✅ Invitation response sent')

    const message = response.response === 'accepted' 
      ? '🎉 You\'re in! See you at the session!'
      : '👍 Response sent. Maybe next time!'

    return {
      success: true,
      message
    }

  } catch (error: any) {
    console.error('❌ Failed to respond to invitation:', error)
    return {
      success: false,
      message: error.message || 'Failed to respond to invitation'
    }
  }
}

/**
 * Get pending event invitations for current user
 */
export async function getPendingEventInvitations(): Promise<EventInvitation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    console.log('📥 Fetching pending event invitations')

    // Use RPC function to get pending invitations
    const { data, error } = await supabase
      .rpc('get_user_pending_event_invitations', {
        p_user_id: user.id
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
export async function getEventInvitationResponses(eventId: string): Promise<{
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

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
      .eq('invited_by', user.id) // Only invitations sent by current user

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
export async function cancelEventInvitations(eventId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    console.log('❌ Cancelling pending invitations for event:', eventId)

    // Delete pending invitations
    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('invited_by', user.id)
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
