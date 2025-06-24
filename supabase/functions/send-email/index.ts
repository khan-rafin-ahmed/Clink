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

  const acceptUrl = `https://thirstee.app/notifications`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to ${event_title}</title>
      <style>
        /* Reset and base styles for email clients */
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          margin: 0;
          padding: 0;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }

        /* Force dark background on all email clients */
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #08090A !important;
          color: #FFFFFF !important;
          width: 100% !important;
          min-height: 100vh !important;
        }

        /* Wrapper table for email client compatibility */
        .email-wrapper {
          width: 100% !important;
          background-color: #08090A !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #08090A !important;
        }

        .header {
          text-align: center;
          padding: 30px 20px;
          background-color: #08090A !important;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #FFFFFF !important;
          margin-bottom: 8px;
        }

        .tagline {
          font-size: 14px;
          color: #B3B3B3 !important;
        }

        .content {
          background-color: #08090A !important;
          padding: 40px 20px;
        }

        .glass-card {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #FFFFFF !important;
          margin-bottom: 16px;
        }

        .card-detail {
          margin: 12px 0;
          color: #B3B3B3 !important;
          font-size: 15px;
          line-height: 1.6;
        }

        .card-detail strong {
          color: #FFFFFF !important;
        }

        .btn-primary {
          display: inline-block;
          background-color: #FFFFFF !important;
          color: #08090A !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 15px;
          margin: 8px;
          border: none;
          text-align: center;
        }

        .btn-secondary {
          display: inline-block;
          background-color: #07080A !important;
          color: #FFFFFF !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 15px;
          margin: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          text-align: center;
        }

        .footer {
          text-align: center;
          color: #B3B3B3 !important;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 30px;
          background-color: #08090A !important;
        }

        .footer a {
          color: #00FFA3 !important;
          text-decoration: none;
        }

        /* Mobile responsive styles */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            padding: 15px !important;
          }

          .header {
            padding: 20px 15px !important;
          }

          .content {
            padding: 20px 15px !important;
          }

          .glass-card {
            padding: 16px !important;
            margin: 16px 0 !important;
          }

          .card-title {
            font-size: 18px !important;
          }

          .btn-primary, .btn-secondary {
            display: block !important;
            width: 90% !important;
            margin: 10px auto !important;
            padding: 14px 20px !important;
            font-size: 16px !important;
          }

          .logo {
            font-size: 24px !important;
          }

          h1 {
            font-size: 20px !important;
          }
        }

        /* Dark mode support for email clients */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #08090A !important;
            color: #FFFFFF !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Wrapper table for email client compatibility -->
      <table class="email-wrapper" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="background-color: #08090A !important; padding: 0;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #08090A !important;">

              <!-- Header -->
              <tr>
                <td class="header" style="text-align: center; padding: 30px 20px; background-color: #08090A !important; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <div class="logo" style="font-size: 28px; font-weight: bold; color: #FFFFFF !important; margin-bottom: 8px;">🤘 Thirstee</div>
                  <div class="tagline" style="font-size: 14px; color: #B3B3B3 !important;">Tap. Plan. Thirstee.</div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td class="content" style="background-color: #08090A !important; padding: 40px 20px;">
                  <h1 style="color: #FFFFFF !important; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center; margin-top: 0;">🥂 You're Invited to Raise Hell!</h1>
                  <p style="font-size: 16px; color: #B3B3B3 !important; line-height: 1.6; text-align: center; margin-bottom: 24px;"><strong style="color: #FFFFFF !important;">${inviter_name}</strong> invited you to a Session</p>

                  <div class="glass-card" style="background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
                    <div class="card-title" style="font-size: 20px; font-weight: 600; color: #FFFFFF !important; margin-bottom: 16px;">${event_title}</div>
                    <div class="card-detail" style="margin: 12px 0; color: #B3B3B3 !important; font-size: 15px; line-height: 1.6;">
                      <strong style="color: #FFFFFF !important;">📅 Date:</strong> ${eventDate}
                    </div>
                    ${event_location ? `<div class="card-detail" style="margin: 12px 0; color: #B3B3B3 !important; font-size: 15px; line-height: 1.6;"><strong style="color: #FFFFFF !important;">📍 Location:</strong> ${event_location}</div>` : '<div class="card-detail" style="margin: 12px 0; color: #B3B3B3 !important; font-size: 15px; line-height: 1.6;"><strong style="color: #FFFFFF !important;">📍 Location:</strong> To be announced</div>'}
                  </div>

                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${acceptUrl}" class="btn-primary" style="display: inline-block; background-color: #FFFFFF !important; color: #08090A !important; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; margin: 8px; border: none; text-align: center;">🍺 Accept Invitation</a>
                    <a href="${acceptUrl}" class="btn-secondary" style="display: inline-block; background-color: #07080A !important; color: #FFFFFF !important; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 15px; margin: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">😔 Can't Make It</a>
                  </div>

                  <p style="font-size: 14px; color: #B3B3B3 !important; text-align: center;">
                    <a href="${acceptUrl}" style="color: #00FFA3 !important; text-decoration: underline;">View full event details</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td class="footer" style="text-align: center; color: #B3B3B3 !important; font-size: 12px; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; background-color: #08090A !important; padding: 30px 20px;">
                  <p style="margin: 0; color: #B3B3B3 !important;">© 2025 Thirstee. Built with 🍻 & 🤘 by Roughin</p>
                  <p style="margin: 10px 0 0 0; color: #B3B3B3 !important;"><a href="#" style="color: #00FFA3 !important; text-decoration: none;">Unsubscribe</a> | <a href="#" style="color: #00FFA3 !important; text-decoration: none;">Update Preferences</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
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
    acceptUrl,
    declineUrl
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
        /* Reset and base styles for email clients */
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          margin: 0;
          padding: 0;
        }
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }

        /* Force dark background on all email clients */
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #08090A !important;
          color: #FFFFFF !important;
          width: 100% !important;
          min-height: 100vh !important;
        }

        /* Wrapper table for email client compatibility */
        .email-wrapper {
          width: 100% !important;
          background-color: #08090A !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #08090A !important;
        }

        .header {
          text-align: center;
          padding: 30px 20px;
          background-color: #08090A !important;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #FFFFFF !important;
          margin-bottom: 8px;
        }

        .tagline {
          font-size: 14px;
          color: #B3B3B3 !important;
        }

        .content {
          background-color: #08090A !important;
          padding: 40px 20px;
        }

        .glass-card {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #FFFFFF !important;
          margin-bottom: 16px;
        }

        .card-detail {
          margin: 12px 0;
          color: #B3B3B3 !important;
          font-size: 15px;
          line-height: 1.6;
        }

        .card-detail strong {
          color: #FFFFFF !important;
        }

        .btn-primary {
          display: inline-block;
          background-color: #FFFFFF !important;
          color: #08090A !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 15px;
          margin: 8px;
          border: none;
          text-align: center;
        }

        .btn-secondary {
          display: inline-block;
          background-color: transparent !important;
          color: #B3B3B3 !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 15px;
          margin: 8px;
          border: 1px solid rgba(179, 179, 179, 0.3) !important;
          text-align: center;
        }

        .footer {
          text-align: center;
          color: #B3B3B3 !important;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 30px;
          background-color: #08090A !important;
        }

        .footer a {
          color: #00FFA3 !important;
          text-decoration: none;
        }

        /* Mobile responsive styles */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            padding: 15px !important;
          }

          .header {
            padding: 20px 15px !important;
          }

          .content {
            padding: 20px 15px !important;
          }

          .glass-card {
            padding: 16px !important;
            margin: 16px 0 !important;
          }

          .card-title {
            font-size: 18px !important;
          }

          .btn-primary, .btn-secondary {
            display: block !important;
            width: 90% !important;
            margin: 10px auto !important;
            padding: 14px 20px !important;
            font-size: 16px !important;
          }

          .logo {
            font-size: 24px !important;
          }

          h1 {
            font-size: 20px !important;
          }
        }

        /* Dark mode support for email clients */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #08090A !important;
            color: #FFFFFF !important;
          }
        }
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
            <a href="${acceptUrl}" class="btn-primary">🤘 Join Crew</a>
            <a href="${declineUrl}" class="btn-secondary">😔 Not Interested</a>
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

🤘 Join Crew: ${acceptUrl}
😔 Not Interested: ${declineUrl}

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
        ],
        // CRITICAL: Disable click tracking to preserve tokenized URLs
        tracking_settings: {
          click_tracking: {
            enable: false
          },
          open_tracking: {
            enable: true
          }
        }
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
