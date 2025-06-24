/**
 * Email Templates for Thirstee App
 * Responsive HTML email templates matching the app's design system
 */

export interface EventInvitationData {
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  inviterName: string
  inviterAvatar?: string
  eventDescription?: string
  acceptUrl: string
  declineUrl: string
  eventUrl: string
  vibe?: string
}

export interface EventReminderData {
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  hostName: string
  eventDescription?: string
  eventUrl: string
  mapUrl?: string
  attendeeCount: number
}

export interface CrewInvitationData {
  crewName: string
  inviterName: string
  inviterAvatar?: string
  crewDescription?: string
  acceptUrl: string
  declineUrl: string
  crewUrl: string
  memberCount: number
}

/**
 * Base email template with Thirstee branding - Updated Design System
 * Enhanced for mobile email client compatibility
 */
function getBaseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="date=no">
    <meta name="format-detection" content="address=no">
    <meta name="format-detection" content="email=no">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Thirstee</title>
    ${preheader ? `<meta name="description" content="${preheader}">` : ''}
    ${preheader ? `
    <!--[if !mso]><!-->
    <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: transparent; opacity: 0;">
        ${preheader}
    </div>
    <!--<![endif]-->` : ''}
    <style>
        /* Reset styles */
        * {
            box-sizing: border-box;
        }
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Base styles - Enhanced Mobile Support */
        html {
            background-color: #08090A !important;
        }
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #08090A !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #FFFFFF !important;
            width: 100% !important;
            height: 100% !important;
        }

        /* Force dark background on all email clients */
        .email-wrapper {
            background-color: #08090A !important;
            width: 100% !important;
            height: 100% !important;
        }

        .email-container {
            max-width: 600px !important;
            margin: 0 auto !important;
            background-color: #08090A !important;
            width: 100% !important;
        }

        .header {
            background-color: #08090A !important;
            padding: 30px 20px !important;
            text-align: center !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }

        .logo {
            font-size: 28px !important;
            font-weight: bold !important;
            color: #FFFFFF !important;
            text-decoration: none !important;
            text-shadow: none !important;
        }

        .tagline {
            font-size: 14px !important;
            color: #B3B3B3 !important;
            margin-top: 8px !important;
            opacity: 1 !important;
        }

        .content {
            padding: 40px 20px !important;
            background-color: #08090A !important;
        }

        .footer {
            padding: 30px 20px !important;
            background-color: #08090A !important;
            text-align: center !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
        }

        .footer-text {
            font-size: 12px !important;
            color: #B3B3B3 !important;
            line-height: 1.5 !important;
        }

        .footer-text a {
            color: #00FFA3 !important;
            text-decoration: none !important;
        }

        .footer-text a:hover {
            text-decoration: underline !important;
        }

        .btn-primary {
            display: inline-block !important;
            padding: 12px 24px !important;
            background-color: #FFFFFF !important;
            color: #08090A !important;
            text-decoration: none !important;
            border-radius: 9999px !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            text-align: center !important;
            margin: 8px !important;
            border: none !important;
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            background-color: rgba(255,255,255,0.9) !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255,255,255,0.2);
        }

        .btn-secondary {
            display: inline-block !important;
            padding: 12px 24px !important;
            background-color: #07080A !important;
            color: #FFFFFF !important;
            text-decoration: none !important;
            border-radius: 9999px !important;
            font-weight: 500 !important;
            font-size: 15px !important;
            text-align: center !important;
            margin: 8px !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            transition: all 0.2s ease;
        }

        .btn-secondary:hover {
            background-color: rgba(255,255,255,0.03) !important;
            color: #FFFFFF !important;
        }

        .glass-card {
            background: rgba(255,255,255,0.05) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 16px !important;
            padding: 24px !important;
            margin: 24px 0 !important;
            backdrop-filter: blur(10px);
        }

        .card-title {
            font-size: 20px !important;
            font-weight: 600 !important;
            color: #FFFFFF !important;
            margin-bottom: 16px !important;
        }

        .card-detail {
            margin: 12px 0 !important;
            color: #B3B3B3 !important;
            font-size: 15px !important;
            line-height: 1.6 !important;
        }

        .card-detail strong {
            color: #FFFFFF !important;
        }

        .vibe-badge {
            display: inline-block !important;
            background: rgba(255,255,255,0.08) !important;
            color: #FFFFFF !important;
            padding: 6px 12px !important;
            border-radius: 9999px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            text-transform: uppercase !important;
            margin: 12px 0 !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
        }

        /* Mobile responsive and email client specific fixes */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                background-color: #08090A !important;
            }
            .email-container {
                width: 100% !important;
                background-color: #08090A !important;
            }
            .header {
                background-color: #08090A !important;
                padding: 20px 15px !important;
            }
            .content {
                padding: 20px 15px !important;
                background-color: #08090A !important;
            }
            .footer {
                background-color: #08090A !important;
                padding: 20px 15px !important;
            }
            .btn-primary, .btn-secondary {
                display: block !important;
                width: 90% !important;
                margin: 10px auto !important;
            }
            .glass-card {
                padding: 16px !important;
                margin: 16px 0 !important;
                background: rgba(255,255,255,0.05) !important;
            }
            .card-title {
                font-size: 18px !important;
            }
        }

        /* Dark mode support for email clients that support it */
        @media (prefers-color-scheme: dark) {
            .email-wrapper {
                background-color: #08090A !important;
            }
            .email-container {
                background-color: #08090A !important;
            }
            .header, .content, .footer {
                background-color: #08090A !important;
            }
        }

        /* iOS Mail specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .email-wrapper {
                background-color: #08090A !important;
            }
            body {
                background-color: #08090A !important;
            }
        }

        /* Gmail mobile app fixes */
        u + .body .email-wrapper {
            background-color: #08090A !important;
        }

        /* Outlook mobile fixes */
        .ExternalClass {
            width: 100% !important;
            background-color: #08090A !important;
        }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100% !important;
            background-color: #08090A !important;
        }
    </style>
</head>
<body class="body" style="margin: 0 !important; padding: 0 !important; background-color: #08090A !important; color: #FFFFFF !important;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #08090A;">
        <tr>
            <td>
    <![endif]-->

    <div class="email-wrapper" style="background-color: #08090A !important; width: 100% !important; height: 100% !important;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #08090A !important;">
            <tr>
                <td align="center" style="background-color: #08090A !important;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="email-container" style="max-width: 600px !important; width: 100% !important; background-color: #08090A !important;">
                        <!-- Header -->
                        <tr>
                            <td class="header" style="background-color: #08090A !important; padding: 30px 20px !important; text-align: center !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important;">
                                <div class="logo" style="font-size: 28px !important; font-weight: bold !important; color: #FFFFFF !important; text-decoration: none !important;">🤘 Thirstee</div>
                                <div class="tagline" style="font-size: 14px !important; color: #B3B3B3 !important; margin-top: 8px !important;">Join the Crew!</div>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td class="content" style="padding: 40px 20px !important; background-color: #08090A !important;">
                                ${content}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td class="footer" style="padding: 30px 20px !important; background-color: #08090A !important; text-align: center !important; border-top: 1px solid rgba(255,255,255,0.1) !important;">
                                <div class="footer-text" style="font-size: 12px !important; color: #B3B3B3 !important; line-height: 1.5 !important;">
                                    © 2025 Thirstee. Built with 🍻 & 🤘 by Roughin<br>
                                    <br>
                                    <a href="#" style="color: #00FFA3 !important; text-decoration: none !important;">Unsubscribe</a> |
                                    <a href="#" style="color: #00FFA3 !important; text-decoration: none !important;">Update Preferences</a>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <!--[if mso | IE]>
            </td>
        </tr>
    </table>
    <![endif]-->
</body>
</html>
  `.trim()
}

/**
 * Event Invitation Email Template
 */
export function generateEventInvitationEmail(data: EventInvitationData): { html: string; text: string; subject: string } {
  const vibeEmoji = {
    casual: '😎',
    party: '🎉',
    chill: '🌙',
    wild: '🔥',
    classy: '🥂',
    shots: '🥃'
  }[data.vibe || 'casual'] || '🍺'

  const content = `
    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">
      🥂 You're Invited to Raise Hell!
    </h1>

    <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;">
      <strong style="color: #FFFFFF;">${data.inviterName}</strong> invited you to a Session
    </p>

    <div class="glass-card">
      <div class="card-title">${data.eventTitle}</div>

      ${data.vibe ? `<div class="vibe-badge">${vibeEmoji} ${data.vibe.toUpperCase()} VIBES</div>` : ''}

      <div class="card-detail">
        <strong>📅 Date:</strong> ${data.eventDate} at ${data.eventTime}
      </div>

      <div class="card-detail">
        <strong>📍 Location:</strong> ${data.eventLocation || 'To be announced'}
      </div>

      ${data.eventDescription ? `
        <div class="card-detail" style="margin-top: 16px;">
          <strong>📝 Details:</strong><br>
          ${data.eventDescription}
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.acceptUrl}" class="btn-primary">
        🍺 Accept Invitation
      </a>
      <a href="${data.declineUrl}" class="btn-secondary">
        😔 Can't Make It
      </a>
    </div>

    <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
      <a href="${data.eventUrl}" style="color: #00FFA3; text-decoration: underline;">View full event details</a>
    </p>
  `

  const text = `
🍺 You're Invited to Raise Hell!

${data.inviterName} has invited you to join their drinking session: "${data.eventTitle}"

📅 When: ${data.eventDate} at ${data.eventTime}
📍 Where: ${data.eventLocation}
${data.eventDescription ? `📝 Details: ${data.eventDescription}` : ''}

Accept: ${data.acceptUrl}
Decline: ${data.declineUrl}
View Details: ${data.eventUrl}

© 2025 Thirstee - Built by Roughin while drinking beers and raising hell. 🤘
  `.trim()

  return {
    html: getBaseTemplate(content, `You're invited to ${data.eventTitle}`),
    text,
    subject: `🍺 You're invited: ${data.eventTitle}`
  }
}

/**
 * Event Reminder Email Template
 */
export function generateEventReminderEmail(data: EventReminderData): { html: string; text: string; subject: string } {
  const content = `
    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">
      ⏰ Session Starting Soon!
    </h1>

    <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;">
      Don't forget! Your drinking session is starting in 1 hour.
      Time to get ready and head out! 🍺
    </p>

    <div class="glass-card">
      <div class="card-title">${data.eventTitle}</div>

      <div class="card-detail">
        <strong>📅 When:</strong> ${data.eventDate} at ${data.eventTime}
      </div>

      <div class="card-detail">
        <strong>📍 Where:</strong> ${data.eventLocation}
      </div>

      <div class="card-detail">
        <strong>👥 Who's Going:</strong> ${data.attendeeCount} people (including you!)
      </div>

      <div class="card-detail">
        <strong>🎯 Host:</strong> ${data.hostName}
      </div>

      ${data.eventDescription ? `
        <div class="card-detail" style="margin-top: 16px;">
          <strong>📝 Details:</strong><br>
          ${data.eventDescription}
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.eventUrl}" class="btn-primary">
        🍺 View Event Details
      </a>
      ${data.mapUrl ? `
        <a href="${data.mapUrl}" class="btn-secondary">
          🗺️ Get Directions
        </a>
      ` : ''}
    </div>

    <div class="glass-card" style="margin-top: 24px;">
      <h3 style="color: #FFFFFF; margin-top: 0; font-size: 16px; font-weight: 600;">📱 Quick Tips:</h3>
      <ul style="color: #B3B3B3; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li>Bring your ID and some cash</li>
        <li>Stay hydrated and drink responsibly</li>
        <li>Let someone know where you're going</li>
        <li>Have a safe way to get home</li>
      </ul>
    </div>
  `

  const text = `
⏰ Session Starting Soon!

Don't forget! Your drinking session "${data.eventTitle}" is starting in 1 hour.

📅 When: ${data.eventDate} at ${data.eventTime}
📍 Where: ${data.eventLocation}
👥 Who's Going: ${data.attendeeCount} people (including you!)
🎯 Host: ${data.hostName}
${data.eventDescription ? `📝 Details: ${data.eventDescription}` : ''}

View Details: ${data.eventUrl}
${data.mapUrl ? `Get Directions: ${data.mapUrl}` : ''}

Quick Tips:
- Bring your ID and some cash
- Stay hydrated and drink responsibly
- Let someone know where you're going
- Have a safe way to get home

© 2025 Thirstee - Built by Roughin while drinking beers and raising hell. 🤘
  `.trim()

  return {
    html: getBaseTemplate(content, `${data.eventTitle} starts in 1 hour!`),
    text,
    subject: `⏰ Starting soon: ${data.eventTitle}`
  }
}

/**
 * Crew Invitation Email Template
 */
export function generateCrewInvitationEmail(data: CrewInvitationData): { html: string; text: string; subject: string } {
  const memberCountText = data.memberCount === 0
    ? '👤 Be the first to join!'
    : `👥 ${data.memberCount} member${data.memberCount !== 1 ? 's' : ''}`

  const content = `
    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">
      🍻 Crew Invitation
    </h1>

    <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;">
      <strong style="color: #FFFFFF;">${data.inviterName}</strong> has invited you to join their crew
    </p>

    <div class="glass-card">
      <div class="card-title" style="color: #FFFFFF;">${data.crewName}</div>

      <div class="card-detail">
        ${memberCountText}
      </div>

      ${data.crewDescription ? `
        <div class="card-detail" style="margin-top: 16px;">
          <strong>📝 Description:</strong><br>
          ${data.crewDescription}
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.acceptUrl}" class="btn-primary">
        🤘 View Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
      If button doesn't work: <a href="${data.crewUrl}" style="color: #00FFA3; text-decoration: underline;">View in browser</a>
    </p>
  `

  const text = `
🤘 Join the Crew!

${data.inviterName} has invited you to join "${data.crewName}" on Thirstee.

👥 Members: ${data.memberCount} crew member${data.memberCount !== 1 ? 's' : ''}
${data.crewDescription ? `📝 About: ${data.crewDescription}` : ''}

Join: ${data.acceptUrl}
Decline: ${data.declineUrl}
View Details: ${data.crewUrl}

© 2025 Thirstee - Built by Roughin while drinking beers and raising hell. 🤘
  `.trim()

  return {
    html: getBaseTemplate(content, `Join ${data.crewName}`),
    text,
    subject: `🤘 You're invited to join ${data.crewName}`
  }
}
