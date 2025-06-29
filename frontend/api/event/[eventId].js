// Vercel Serverless Function for Event Meta Tags
const SUPABASE_URL = 'https://arpphimkotjvnfoacquj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDYwNjYsImV4cCI6MjA2Mzc4MjA2Nn0.GksQ0jn0RuJCAqDcP2m2B0Z5uPP7_y-efc2EqztrL3k'

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
  
  let description = `Join us for "${event.title}" on ${formattedDate} at ${location}.${vibe}${privacy}`
  
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
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
