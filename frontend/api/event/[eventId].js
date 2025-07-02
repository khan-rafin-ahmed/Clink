// Vercel Serverless Function for Event Meta Tags
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

const SOCIAL_BOTS = [
  'facebookexternalhit',
  'Twitterbot', 
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'YandexBot',
  'DuckDuckBot',
  'Applebot'
]

function isSocialBot(userAgent) {
  if (!userAgent) return false
  return SOCIAL_BOTS.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()))
}

async function getEventData(eventId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data[0] || null
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateEventHTML(event, eventUrl) {
  const title = `${event.title} | Thirstee`
  
  // Format the date exactly like EventInvitationCard.tsx does
  // Use +06 timezone to match your local timezone
  const eventDate = new Date(event.date_time)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka' // +06 timezone
  })
  
  // Prioritize actual place name from Google Maps, then nickname, then fallback
  let location = event.place_name || event.location || 'Location TBD'

  // If we have both place name and nickname, show both
  if (event.place_name && event.place_nickname) {
    location = `${event.place_name} (${event.place_nickname})`
  } else if (event.place_nickname && !event.place_name) {
    location = event.place_nickname
  }

  let description = `Join me on ${formattedDate} at ${location}`

  if (event.notes && event.notes.trim()) {
    description = `${event.notes.trim()} | ${formattedDate} at ${location}`
  }
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }
  
  const getDefaultImage = (vibe) => {
    const vibeImages = {
      casual: '/assets/covers/Casual Hang.webp',
      party: '/assets/covers/Party Mode.webp',
      chill: '/assets/covers/Chill Vibes.webp', 
      wild: '/assets/covers/Wild Night.webp',
      classy: '/assets/covers/Classy Evening.webp',
      shots: '/assets/covers/Shots Night.webp'
    }
    return vibeImages[vibe || 'casual'] || '/assets/covers/Party Mode.webp'
  }
  
  const image = event.cover_image_url || getDefaultImage(event.vibe)
  const fullImageUrl = `https://www.thirstee.app${image}`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://www.thirstee.app/thirstee-logo.svg" />
    <link rel="icon" type="image/x-icon" href="https://www.thirstee.app/favicon.ico" />
    <link rel="shortcut icon" href="https://www.thirstee.app/thirstee-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${eventUrl}" />
    <meta property="og:site_name" content="Thirstee" />
    <meta property="og:image" content="${fullImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${fullImageUrl}" />
    <meta name="twitter:image:alt" content="${escapeHtml(title)}" />

    <!-- Additional Social Platform Tags -->
    <meta property="linkedin:title" content="${escapeHtml(title)}" />
    <meta property="linkedin:description" content="${escapeHtml(description)}" />
    <meta property="linkedin:image" content="${fullImageUrl}" />
    
    <!-- Redirect regular users to the app -->
    <script>
      if (!navigator.userAgent.match(/(facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Googlebot|bingbot)/i)) {
        window.location.href = '${eventUrl}';
      }
    </script>
  </head>
  <body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: #08090A; color: white;">
      <div style="text-align: center; max-width: 600px; padding: 20px;">
        <h1 style="color: #FF7747; margin-bottom: 20px;">${event.title}</h1>
        <p style="color: #FFD37E; margin-bottom: 20px;">${formattedDate}</p>
        <p style="color: #CCCCCC; margin-bottom: 30px;">${location}</p>
        ${event.notes ? `<p style="color: #FFFFFF; margin-bottom: 30px;">${event.notes}</p>` : ''}
        <p style="color: #B3B3B3;">Loading Thirstee...</p>
      </div>
    </div>
  </body>
</html>`
}

export default async function handler(req, res) {
  const { eventId } = req.query
  const userAgent = req.headers['user-agent'] || ''
  
  console.log('Meta request for event:', eventId, 'User-Agent:', userAgent)
  
  // Check if this is a social bot
  if (!isSocialBot(userAgent)) {
    // Redirect regular users to the main app
    return res.redirect(302, `https://www.thirstee.app/event/${eventId}`)
  }
  
  try {
    const event = await getEventData(eventId)
    
    if (!event) {
      // Event not found, redirect to main app
      return res.redirect(302, 'https://www.thirstee.app')
    }
    
    const eventUrl = `https://www.thirstee.app/event/${eventId}`
    const html = generateEventHTML(event, eventUrl)
    
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.status(200).send(html)
    
  } catch (error) {
    console.error('Error generating meta tags:', error)
    res.redirect(302, 'https://www.thirstee.app')
  }
}
