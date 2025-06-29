// Simple Meta Tag API for testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
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
      throw new Error(`HTTP error! status: ${response.status}`)
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
  
  const eventDate = new Date(event.date_time)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const location = event.place_nickname || event.location || 'Location TBD'
  const vibe = event.vibe ? ` ${event.vibe.charAt(0).toUpperCase() + event.vibe.slice(1)} vibes` : ''
  const privacy = event.is_public ? '' : ' (Private Event)'
  
  let description = `Join us for ${event.title} on ${formattedDate} at ${location}.${vibe}${privacy}`
  
  if (event.notes && event.notes.trim()) {
    description = `${event.notes.trim()} | ${formattedDate} at ${location}${privacy}`
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
    <link rel="icon" type="image/x-icon" href="https://www.thirstee.app/favicon.ico" />
    <link rel="icon" type="image/svg+xml" href="https://www.thirstee.app/thirstee-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${eventUrl}" />
    <meta property="og:site_name" content="Thirstee" />
    <meta property="og:image" content="${fullImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${fullImageUrl}" />
    <meta name="twitter:image:alt" content="${title}" />
    
    <!-- Additional Social Platform Tags -->
    <meta property="linkedin:title" content="${title}" />
    <meta property="linkedin:description" content="${description}" />
    <meta property="linkedin:image" content="${fullImageUrl}" />
    
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #08090A;
        color: white;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        text-align: center;
        max-width: 600px;
        padding: 20px;
      }
      h1 {
        color: #FF7747;
        margin-bottom: 20px;
        font-size: 2.5rem;
      }
      .date {
        color: #FFD37E;
        margin-bottom: 20px;
        font-size: 1.2rem;
      }
      .location {
        color: #CCCCCC;
        margin-bottom: 30px;
        font-size: 1.1rem;
      }
      .notes {
        color: #FFFFFF;
        margin-bottom: 30px;
        font-size: 1rem;
        line-height: 1.5;
      }
      .loading {
        color: #B3B3B3;
        font-size: 0.9rem;
      }
      .redirect-btn {
        background: #FF7747;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        margin-top: 20px;
        text-decoration: none;
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${event.title}</h1>
      <div class="date">${formattedDate}</div>
      <div class="location">${location}</div>
      ${event.notes ? `<div class="notes">${event.notes}</div>` : ''}
      <div class="loading">Loading Thirstee...</div>
      <a href="${eventUrl}" class="redirect-btn">Open in Thirstee</a>
    </div>
    
    <script>
      // Auto-redirect after 3 seconds for regular users
      setTimeout(() => {
        if (!navigator.userAgent.match(/(facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|Googlebot|bingbot)/i)) {
          window.location.href = '${eventUrl}';
        }
      }, 3000);
    </script>
  </body>
</html>`
}

export default async function handler(req, res) {
  const { eventId } = req.query
  
  // Log for debugging
  console.log('Meta API called with eventId:', eventId)
  console.log('User-Agent:', req.headers['user-agent'])
  
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' })
  }
  
  try {
    const event = await getEventData(eventId)
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    const eventUrl = `https://www.thirstee.app/event/${eventId}`
    const html = generateEventHTML(event, eventUrl)
    
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(html)
    
  } catch (error) {
    console.error('Error in meta API:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
