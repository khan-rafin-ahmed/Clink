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
 * Base email template with Thirstee branding
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
        
        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #0E0E10 !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #ffffff;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0E0E10;
        }
        
        .header {
            background: linear-gradient(135deg, #FF7747 0%, #FFD37E 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #000000;
            text-decoration: none;
            text-shadow: none;
        }
        
        .tagline {
            font-size: 14px;
            color: #000000;
            margin-top: 5px;
            opacity: 0.8;
        }
        
        .content {
            padding: 40px 20px;
            background-color: #1A1A1A;
        }
        
        .footer {
            padding: 30px 20px;
            background-color: #0E0E10;
            text-align: center;
            border-top: 1px solid #333333;
        }
        
        .footer-text {
            font-size: 12px;
            color: #B3B3B3;
            line-height: 1.5;
        }
        
        .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #FF7747;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 10px 5px;
        }
        
        .button-secondary {
            background-color: transparent;
            border: 2px solid #FF7747;
            color: #FF7747 !important;
        }
        
        .event-card {
            background-color: #2A2A2A;
            border: 1px solid #FF7747;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .event-title {
            font-size: 24px;
            font-weight: bold;
            color: #FF7747;
            margin-bottom: 15px;
        }
        
        .event-detail {
            margin: 10px 0;
            color: #B3B3B3;
            font-size: 14px;
        }
        
        .event-detail strong {
            color: #ffffff;
        }
        
        .vibe-badge {
            display: inline-block;
            background-color: #FFD37E;
            color: #000000;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 10px 0;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            .content {
                padding: 20px 15px !important;
            }
            .button {
                display: block !important;
                width: 90% !important;
                margin: 10px auto !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">THIRSTEE</div>
            <div class="tagline">Tap. Plan. Thirstee.</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘<br>
                <br>
                This email was sent because you're part of the Thirstee community.<br>
                <a href="#" style="color: #FF7747;">Unsubscribe</a> | 
                <a href="#" style="color: #FF7747;">Update Preferences</a>
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
    <h1 style="color: #FF7747; font-size: 28px; margin-bottom: 20px;">
      ${vibeEmoji} You're Invited to Raise Hell!
    </h1>
    
    <p style="font-size: 16px; color: #ffffff; line-height: 1.6;">
      <strong>${data.inviterName}</strong> has invited you to join their drinking session. 
      Time to gather the crew and make some memories!
    </p>
    
    <div class="event-card">
      <div class="event-title">${data.eventTitle}</div>
      
      ${data.vibe ? `<div class="vibe-badge">${data.vibe} vibes</div>` : ''}
      
      <div class="event-detail">
        <strong>📅 When:</strong> ${data.eventDate} at ${data.eventTime}
      </div>
      
      <div class="event-detail">
        <strong>📍 Where:</strong> ${data.eventLocation}
      </div>
      
      ${data.eventDescription ? `
        <div class="event-detail" style="margin-top: 15px;">
          <strong>📝 Details:</strong><br>
          ${data.eventDescription}
        </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.acceptUrl}" class="button">
        🍺 Accept Invitation
      </a>
      <a href="${data.declineUrl}" class="button button-secondary">
        😔 Can't Make It
      </a>
    </div>
    
    <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
      <a href="${data.eventUrl}" style="color: #FF7747;">View full event details</a>
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
    <h1 style="color: #FF7747; font-size: 28px; margin-bottom: 20px;">
      ⏰ Session Starting Soon!
    </h1>
    
    <p style="font-size: 16px; color: #ffffff; line-height: 1.6;">
      Don't forget! Your drinking session is starting in 1 hour. 
      Time to get ready and head out! 🍺
    </p>
    
    <div class="event-card">
      <div class="event-title">${data.eventTitle}</div>
      
      <div class="event-detail">
        <strong>📅 When:</strong> ${data.eventDate} at ${data.eventTime}
      </div>
      
      <div class="event-detail">
        <strong>📍 Where:</strong> ${data.eventLocation}
      </div>
      
      <div class="event-detail">
        <strong>👥 Who's Going:</strong> ${data.attendeeCount} people (including you!)
      </div>
      
      <div class="event-detail">
        <strong>🎯 Host:</strong> ${data.hostName}
      </div>
      
      ${data.eventDescription ? `
        <div class="event-detail" style="margin-top: 15px;">
          <strong>📝 Details:</strong><br>
          ${data.eventDescription}
        </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.eventUrl}" class="button">
        🍺 View Event Details
      </a>
      ${data.mapUrl ? `
        <a href="${data.mapUrl}" class="button button-secondary">
          🗺️ Get Directions
        </a>
      ` : ''}
    </div>
    
    <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #FFD37E; margin-top: 0;">📱 Quick Tips:</h3>
      <ul style="color: #B3B3B3; font-size: 14px; line-height: 1.6;">
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
  const content = `
    <h1 style="color: #FF7747; font-size: 28px; margin-bottom: 20px;">
      🤘 Join the Crew!
    </h1>

    <p style="font-size: 16px; color: #ffffff; line-height: 1.6;">
      <strong>${data.inviterName}</strong> has invited you to join their crew on Thirstee.
      Time to connect with fellow hell-raisers and never drink alone!
    </p>

    <div class="event-card">
      <div class="event-title">${data.crewName}</div>

      <div class="event-detail">
        <strong>👥 Members:</strong> ${data.memberCount} crew member${data.memberCount !== 1 ? 's' : ''}
      </div>

      ${data.crewDescription ? `
        <div class="event-detail" style="margin-top: 15px;">
          <strong>📝 About:</strong><br>
          ${data.crewDescription}
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.acceptUrl}" class="button">
        🤘 Join the Crew
      </a>
      <a href="${data.declineUrl}" class="button button-secondary">
        😔 Not Interested
      </a>
    </div>

    <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
      <a href="${data.crewUrl}" style="color: #FF7747;">View crew details</a>
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
