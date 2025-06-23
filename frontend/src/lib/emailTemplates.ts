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
 */
function getBaseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Thirstee</title>
    ${preheader ? `<meta name="description" content="${preheader}">` : ''}
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
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

        /* Base styles - Updated Design System */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #08090A !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #FFFFFF;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #08090A;
        }

        .header {
            background-color: #08090A;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FFFFFF;
            text-decoration: none;
            text-shadow: none;
        }

        .tagline {
            font-size: 14px;
            color: #B3B3B3;
            margin-top: 8px;
            opacity: 1;
        }

        .content {
            padding: 40px 20px;
            background-color: #08090A;
        }

        .footer {
            padding: 30px 20px;
            background-color: #08090A;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .footer-text {
            font-size: 12px;
            color: #B3B3B3;
            line-height: 1.5;
        }

        .footer-text a {
            color: #00FFA3;
            text-decoration: none;
        }

        .footer-text a:hover {
            text-decoration: underline;
        }

        .btn-primary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #FFFFFF;
            color: #08090A !important;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            margin: 8px;
            border: none;
            transition: all 0.2s ease;
        }

        .btn-primary:hover {
            background-color: rgba(255,255,255,0.9);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255,255,255,0.2);
        }

        .btn-secondary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #07080A;
            color: #FFFFFF !important;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 15px;
            text-align: center;
            margin: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.2s ease;
        }

        .btn-secondary:hover {
            background-color: rgba(255,255,255,0.03);
            color: #FFFFFF !important;
        }
        
        .glass-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            backdrop-filter: blur(10px);
        }

        .card-title {
            font-size: 20px;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 16px;
        }

        .card-detail {
            margin: 12px 0;
            color: #B3B3B3;
            font-size: 15px;
            line-height: 1.6;
        }

        .card-detail strong {
            color: #FFFFFF;
        }

        .vibe-badge {
            display: inline-block;
            background: rgba(255,255,255,0.08);
            color: #FFFFFF;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            margin: 12px 0;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .content {
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
            }
            .card-title {
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🤘 Thirstee</div>
            <div class="tagline">Join the Crew!</div>
        </div>

        <div class="content">
            ${content}
        </div>

        <div class="footer">
            <div class="footer-text">
                © 2025 Thirstee. Built with 🍻 & 🤘 by Roughin<br>
                <br>
                <a href="#" class="footer-text">Unsubscribe</a> |
                <a href="#" class="footer-text">Update Preferences</a>
            </div>
        </div>
    </div>
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
