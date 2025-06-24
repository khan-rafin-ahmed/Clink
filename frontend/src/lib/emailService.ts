import { supabase } from './supabase'
import {
  generateEventInvitationEmail,
  generateEventReminderEmail,
  generateCrewInvitationEmail,
  type EventInvitationData,
  type EventReminderData,
  type CrewInvitationData
} from './emailTemplates'

// Re-export types for external use
export type { EventInvitationData, EventReminderData, CrewInvitationData }

/**
 * Email Service for Thirstee App
 * Handles sending emails via Supabase Edge Functions
 */

export interface EmailResponse {
  success: boolean
  message: string
  messageId?: string
  error?: string
}

/**
 * Send email via Supabase Edge Function
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  type: 'event_invitation' | 'event_reminder' | 'crew_invitation',
  data?: any
): Promise<EmailResponse> {
  try {
    console.log('📧 Sending email:', { to, subject, type })

    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        text,
        type,
        data
      }
    })

    if (error) {
      console.error('❌ Email function error:', error)
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      }
    }

    console.log('✅ Email sent successfully:', response)

    return {
      success: true,
      message: response.message || 'Email sent successfully',
      messageId: response.messageId
    }

  } catch (error: any) {
    console.error('❌ Email service error:', error)
    return {
      success: false,
      message: 'Email service error',
      error: error.message
    }
  }
}

/**
 * Send event invitation email
 */
export async function sendEventInvitationEmail(
  recipientEmail: string,
  invitationData: EventInvitationData
): Promise<EmailResponse> {
  try {
    const { html, text, subject } = generateEventInvitationEmail(invitationData)
    
    return await sendEmail(
      recipientEmail,
      subject,
      html,
      text,
      'event_invitation',
      {
        eventTitle: invitationData.eventTitle,
        inviterName: invitationData.inviterName,
        eventDate: invitationData.eventDate,
        eventTime: invitationData.eventTime
      }
    )
  } catch (error: any) {
    console.error('❌ Failed to send event invitation email:', error)
    return {
      success: false,
      message: 'Failed to generate invitation email',
      error: error.message
    }
  }
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(
  recipientEmail: string,
  reminderData: EventReminderData
): Promise<EmailResponse> {
  try {
    const { html, text, subject } = generateEventReminderEmail(reminderData)

    return await sendEmail(
      recipientEmail,
      subject,
      html,
      text,
      'event_reminder',
      {
        eventTitle: reminderData.eventTitle,
        hostName: reminderData.hostName,
        eventDate: reminderData.eventDate,
        eventTime: reminderData.eventTime,
        attendeeCount: reminderData.attendeeCount
      }
    )
  } catch (error: any) {
    console.error('❌ Failed to send event reminder email:', error)
    return {
      success: false,
      message: 'Failed to generate reminder email',
      error: error.message
    }
  }
}

/**
 * Send crew invitation email
 */
export async function sendCrewInvitationEmail(
  recipientEmail: string,
  invitationData: CrewInvitationData
): Promise<EmailResponse> {
  try {
    const { html, text, subject } = generateCrewInvitationEmail(invitationData)

    return await sendEmail(
      recipientEmail,
      subject,
      html,
      text,
      'crew_invitation',
      {
        crewName: invitationData.crewName,
        inviterName: invitationData.inviterName,
        memberCount: invitationData.memberCount
      }
    )
  } catch (error: any) {
    console.error('❌ Failed to send crew invitation email:', error)
    return {
      success: false,
      message: 'Failed to generate crew invitation email',
      error: error.message
    }
  }
}

/**
 * Send bulk event invitations
 */
export async function sendBulkEventInvitations(
  invitations: Array<{
    email: string
    data: EventInvitationData
  }>
): Promise<{
  successful: number
  failed: number
  results: Array<{ email: string; success: boolean; message: string }>
}> {
  console.log('📧 Sending bulk event invitations:', invitations.length)

  const results = []
  let successful = 0
  let failed = 0

  for (const invitation of invitations) {
    try {
      const result = await sendEventInvitationEmail(invitation.email, invitation.data)
      
      results.push({
        email: invitation.email,
        success: result.success,
        message: result.message
      })

      if (result.success) {
        successful++
      } else {
        failed++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error: any) {
      console.error(`❌ Failed to send invitation to ${invitation.email}:`, error)
      results.push({
        email: invitation.email,
        success: false,
        message: error.message || 'Unknown error'
      })
      failed++
    }
  }

  console.log('📊 Bulk invitation results:', { successful, failed })

  return {
    successful,
    failed,
    results
  }
}

/**
 * Send bulk event reminders
 */
export async function sendBulkEventReminders(
  reminders: Array<{
    email: string
    data: EventReminderData
  }>
): Promise<{
  successful: number
  failed: number
  results: Array<{ email: string; success: boolean; message: string }>
}> {
  console.log('⏰ Sending bulk event reminders:', reminders.length)

  const results = []
  let successful = 0
  let failed = 0

  for (const reminder of reminders) {
    try {
      const result = await sendEventReminderEmail(reminder.email, reminder.data)
      
      results.push({
        email: reminder.email,
        success: result.success,
        message: result.message
      })

      if (result.success) {
        successful++
      } else {
        failed++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error: any) {
      console.error(`❌ Failed to send reminder to ${reminder.email}:`, error)
      results.push({
        email: reminder.email,
        success: false,
        message: error.message || 'Unknown error'
      })
      failed++
    }
  }

  console.log('📊 Bulk reminder results:', { successful, failed })

  return {
    successful,
    failed,
    results
  }
}

/**
 * Generate calendar file (ICS) for event
 */
export function generateEventICS(event: {
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  url?: string
}): string {
  const formatDate = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const startDate = formatDate(event.startTime)
  const endDate = event.endTime ? formatDate(event.endTime) : formatDate(new Date(new Date(event.startTime).getTime() + 3 * 60 * 60 * 1000).toISOString())

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Thirstee//Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@thirstee.app`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    event.url ? `URL:${event.url}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  return icsContent
}

/**
 * Create downloadable ICS file
 */
export function downloadEventICS(event: {
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  url?: string
}): void {
  const icsContent = generateEventICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
