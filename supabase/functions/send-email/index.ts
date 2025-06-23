import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
  type: 'event_invitation' | 'event_reminder' | 'crew_invitation'
  data?: any
}

// Email templates
function generateEventInvitationEmail(data: any): { html: string; text: string } {
  const {
    event_title,
    inviter_name,
    event_date_time,
    event_location,
    event_id,
    invitation_id
  } = data

  const eventDate = new Date(event_date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  const acceptUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/notifications`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to ${event_title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0A0A0A; color: #FFFFFF; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #FF7747, #FFD37E); border-radius: 12px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .tagline { font-size: 16px; color: #333; }
        .content { background: #1A1A1A; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #333; }
        .event-title { font-size: 24px; font-weight: bold; color: #FF7747; margin-bottom: 20px; }
        .event-details { margin: 20px 0; }
        .detail-row { margin: 10px 0; padding: 10px; background: #2A2A2A; border-radius: 8px; }
        .detail-label { font-weight: bold; color: #FFD37E; }
        .cta-button { display: inline-block; background: #00FFA3; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
        .cta-button:hover { background: #00E693; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍺 Thirstee</div>
          <div class="tagline">Time to raise hell!</div>
        </div>

        <div class="content">
          <h1>🎉 You're Invited!</h1>
          <p><strong>${inviter_name}</strong> has invited you to join their drinking session:</p>

          <div class="event-title">${event_title}</div>

          <div class="event-details">
            <div class="detail-row">
              <span class="detail-label">📅 When:</span> ${eventDate}
            </div>
            ${event_location ? `<div class="detail-row"><span class="detail-label">📍 Where:</span> ${event_location}</div>` : ''}
          </div>

          <p>Ready to raise hell? Let ${inviter_name} know if you're in!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" class="cta-button">🍻 View Invitation</a>
          </div>
        </div>

        <div class="footer">
          <p>© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘</p>
          <p>This email was sent because you're part of a crew that was invited to this event.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🍺 You're Invited to ${event_title}!

${inviter_name} has invited you to join their drinking session.

Event Details:
📅 When: ${eventDate}
${event_location ? `📍 Where: ${event_location}` : ''}

Ready to raise hell? Check your notifications in the Thirstee app to respond!

Visit: ${acceptUrl}

© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘
  `

  return { html, text }
}

function generateCrewInvitationEmail(data: any): { html: string; text: string } {
  const {
    crewName,
    inviterName,
    crewDescription,
    memberCount,
    acceptUrl
  } = data

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Join ${crewName} Crew</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0A0A0A; color: #FFFFFF; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #FF7747, #FFD37E); border-radius: 12px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .tagline { font-size: 16px; color: #333; }
        .content { background: #1A1A1A; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #333; }
        .crew-name { font-size: 24px; font-weight: bold; color: #FF7747; margin-bottom: 20px; }
        .crew-stats { margin: 20px 0; padding: 15px; background: #2A2A2A; border-radius: 8px; }
        .cta-button { display: inline-block; background: #00FFA3; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
        .cta-button:hover { background: #00E693; }
        .footer { text-align: center; color: #999; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🤘 Thirstee</div>
          <div class="tagline">Join the crew!</div>
        </div>

        <div class="content">
          <h1>🍺 Crew Invitation</h1>
          <p><strong>${inviterName}</strong> has invited you to join their crew:</p>

          <div class="crew-name">${crewName}</div>

          ${crewDescription ? `<p>${crewDescription}</p>` : ''}

          <div class="crew-stats">
            <strong>👥 ${memberCount} member${memberCount !== 1 ? 's' : ''}</strong>
          </div>

          <p>Ready to join the crew and start raising hell together?</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" class="cta-button">🤘 View Invitation</a>
          </div>
        </div>

        <div class="footer">
          <p>© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘</p>
          <p>This email was sent because ${inviterName} invited you to join their crew.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🤘 You're Invited to Join ${crewName}!

${inviterName} has invited you to join their crew.

Crew: ${crewName}
${crewDescription ? `Description: ${crewDescription}` : ''}
Members: ${memberCount}

Ready to join the crew? Check your notifications in the Thirstee app to respond!

Visit: ${acceptUrl}

© 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘
  `

  return { html, text }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { to, subject, html, text, type, data }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate email content based on type if not provided
    let emailHtml = html
    let emailText = text

    if (!emailHtml && data) {
      if (type === 'event_invitation') {
        const generated = generateEventInvitationEmail(data)
        emailHtml = generated.html
        emailText = generated.text
      } else if (type === 'crew_invitation') {
        const generated = generateCrewInvitationEmail(data)
        emailHtml = generated.html
        emailText = generated.text
      }
    }

    if (!emailHtml) {
      return new Response(
        JSON.stringify({ error: 'No email content provided and unable to generate template' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // SendGrid configuration
    const emailServiceUrl = Deno.env.get('EMAIL_SERVICE_URL') || 'https://api.sendgrid.com/v3/mail/send'
    const emailApiKey = Deno.env.get('SENDGRID_API_KEY')
    const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@thirstee.app'
    const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'Thirstee'
    
    if (!emailApiKey) {
      // Log to email_logs table with failed status
      await supabaseClient
        .from('email_logs')
        .insert({
          recipient: to,
          subject: subject,
          type: type,
          status: 'failed',
          data: data,
          error_message: 'SendGrid API key not configured'
        })

      throw new Error('Email service not configured')
    }

    // Send email using SendGrid
    const emailResponse = await fetch(emailServiceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: {
          email: fromAddress,
          name: fromName
        },
        content: [
          // SendGrid requires text/plain first, then text/html
          ...(emailText ? [{
            type: 'text/plain',
            value: emailText
          }] : []),
          {
            type: 'text/html',
            value: emailHtml
          }
        ]
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()

      // Log failed email
      await supabaseClient
        .from('email_logs')
        .insert({
          recipient: to,
          subject: subject,
          type: type,
          status: 'failed',
          data: data,
          error_message: `SendGrid error: ${emailResponse.status} - ${errorText}`
        })

      throw new Error(`SendGrid API error: ${emailResponse.status} - ${errorText}`)
    }

    // Get message ID from SendGrid response
    const messageId = emailResponse.headers.get('x-message-id') || `sent-${Date.now()}`

    // Log successful email
    await supabaseClient
      .from('email_logs')
      .insert({
        recipient: to,
        subject: subject,
        type: type,
        status: 'sent',
        message_id: messageId,
        data: data,
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: messageId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
