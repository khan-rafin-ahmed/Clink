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
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #08090A; color: #FFFFFF; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 20px; background-color: #08090A; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo { font-size: 28px; font-weight: bold; color: #FFFFFF; margin-bottom: 8px; }
        .tagline { font-size: 14px; color: #B3B3B3; }
        .content { background-color: #08090A; padding: 40px 20px; }
        .glass-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0; backdrop-filter: blur(10px); }
        .card-title { font-size: 20px; font-weight: 600; color: #FFFFFF; margin-bottom: 16px; }
        .card-detail { margin: 12px 0; color: #B3B3B3; font-size: 15px; line-height: 1.6; }
        .card-detail strong { color: #FFFFFF; }
        .btn-primary { display: inline-block; background-color: #FFFFFF; color: #08090A; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; margin: 8px; border: none; }
        .btn-secondary { display: inline-block; background-color: #07080A; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 15px; margin: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .footer { text-align: center; color: #B3B3B3; font-size: 12px; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; }
        .footer a { color: #00FFA3; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🤘 Thirstee</div>
          <div class="tagline">Tap. Plan. Thirstee.</div>
        </div>

        <div class="content">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">🥂 You're Invited to Raise Hell!</h1>
          <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;"><strong style="color: #FFFFFF;">${inviter_name}</strong> invited you to a Session</p>

          <div class="glass-card">
            <div class="card-title">${event_title}</div>
            <div class="card-detail">
              <strong>📅 Date:</strong> ${eventDate}
            </div>
            ${event_location ? `<div class="card-detail"><strong>📍 Location:</strong> ${event_location}</div>` : '<div class="card-detail"><strong>📍 Location:</strong> To be announced</div>'}
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${acceptUrl}" class="btn-primary">🍺 Accept Invitation</a>
            <a href="${acceptUrl}" class="btn-secondary">😔 Can't Make It</a>
          </div>

          <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
            <a href="${acceptUrl}" style="color: #00FFA3; text-decoration: underline;">View full event details</a>
          </p>
        </div>

        <div class="footer">
          <p>© 2025 Thirstee. Built with 🍻 & 🤘 by Roughin</p>
          <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🥂 You're Invited to Raise Hell!

${inviter_name} invited you to a Session: "${event_title}"

📅 Date: ${eventDate}
📍 Location: ${event_location || 'To be announced'}

Accept: ${acceptUrl}
View Details: ${acceptUrl}

© 2025 Thirstee. Built with 🍻 & 🤘 by Roughin
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

  const memberCountText = memberCount === 0
    ? '👤 Be the first to join!'
    : `👥 ${memberCount} member${memberCount !== 1 ? 's' : ''}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Join ${crewName} Crew</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #08090A; color: #FFFFFF; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 20px; background-color: #08090A; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo { font-size: 28px; font-weight: bold; color: #FFFFFF; margin-bottom: 8px; }
        .tagline { font-size: 14px; color: #B3B3B3; }
        .content { background-color: #08090A; padding: 40px 20px; }
        .glass-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0; backdrop-filter: blur(10px); }
        .card-title { font-size: 20px; font-weight: 600; color: #FFFFFF; margin-bottom: 16px; }
        .card-detail { margin: 12px 0; color: #B3B3B3; font-size: 15px; line-height: 1.6; }
        .card-detail strong { color: #FFFFFF; }
        .btn-primary { display: inline-block; background-color: #FFFFFF; color: #08090A; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; margin: 8px; border: none; }
        .footer { text-align: center; color: #B3B3B3; font-size: 12px; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; }
        .footer a { color: #00FFA3; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🤘 Thirstee</div>
          <div class="tagline">Join the Crew!</div>
        </div>

        <div class="content">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">🍻 Crew Invitation</h1>
          <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;"><strong style="color: #FFFFFF;">${inviterName}</strong> has invited you to join their crew</p>

          <div class="glass-card">
            <div class="card-title" style="color: #FFFFFF;">${crewName}</div>
            <div class="card-detail">
              ${memberCountText}
            </div>
            ${crewDescription ? `
              <div class="card-detail" style="margin-top: 16px;">
                <strong>📝 Description:</strong><br>
                ${crewDescription}
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${acceptUrl}" class="btn-primary">🤘 View Invitation</a>
          </div>

          <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
            If button doesn't work: <a href="${acceptUrl}" style="color: #00FFA3; text-decoration: underline;">View in browser</a>
          </p>
        </div>

        <div class="footer">
          <p>© 2025 Thirstee. Built with 🍻 & 🤘 by Roughin</p>
          <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🍻 Crew Invitation

${inviterName} has invited you to join "${crewName}"

${memberCountText}
${crewDescription ? `📝 Description: ${crewDescription}` : ''}

Join: ${acceptUrl}
View Details: ${acceptUrl}

© 2025 Thirstee. Built with 🍻 & 🤘 by Roughin
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
