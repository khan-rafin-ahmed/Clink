/**
 * Meta Tag Service for Dynamic Social Media Sharing
 * Handles Open Graph and Twitter Card meta tags for events
 */

export interface MetaTagData {
  title: string
  description: string
  image?: string
  url: string
  type?: 'website' | 'article'
  siteName?: string
  twitterCard?: 'summary' | 'summary_large_image'
}

/**
 * Generate meta tag data for an event
 */
export function generateEventMetaTags(event: {
  title: string
  description?: string | null
  cover_image_url?: string | null
  vibe?: string | null
  date_time: string
  location?: string | null
  place_nickname?: string | null
  is_public: boolean
}, eventUrl: string): MetaTagData {
  
  // Create compelling title
  const title = `${event.title} | Thirstee`
  
  // Create description
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
  
  // Add custom description if provided
  if (event.description?.trim()) {
    description = `${event.description.trim()} | ${formattedDate} at ${location}${privacy}`
  }
  
  // Ensure description is within limits (160 chars for optimal display)
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }
  
  // Use event cover image or default
  const image = event.cover_image_url || getDefaultSocialImage(event.vibe)
  
  return {
    title,
    description,
    image,
    url: eventUrl,
    type: 'article',
    siteName: 'Thirstee',
    twitterCard: 'summary_large_image'
  }
}

/**
 * Get default social sharing image based on vibe (using existing cover images)
 */
function getDefaultSocialImage(vibe?: string | null): string {
  const baseUrl = window.location.origin

  // Map vibes to existing default cover images in /assets/covers/
  const vibeImages: Record<string, string> = {
    casual: `${baseUrl}/assets/covers/Casual Hang.webp`,
    party: `${baseUrl}/assets/covers/Party Mode.webp`,
    chill: `${baseUrl}/assets/covers/Chill Vibes.webp`,
    wild: `${baseUrl}/assets/covers/Wild Night.webp`,
    classy: `${baseUrl}/assets/covers/Classy Evening.webp`,
    shots: `${baseUrl}/assets/covers/Shots Night.webp`
  }

  return vibeImages[vibe || 'casual'] || `${baseUrl}/assets/covers/Party Mode.webp`
}

/**
 * Get default crew image for social sharing
 */
function getDefaultCrewImage(): string {
  const baseUrl = window.location.origin
  // Use dedicated crew OG image
  return `${baseUrl}/og-default-crew.webp`
}

/**
 * Generate meta tag data for a crew
 */
export function generateCrewMetaTags(crew: {
  name: string
  description?: string | null
  vibe?: string | null
  member_count?: number
  is_public: boolean
}, crewUrl: string): MetaTagData {

  // Create compelling title
  const title = `${crew.name} | Thirstee`

  // Create description
  const memberText = crew.member_count ? `${crew.member_count} member${crew.member_count !== 1 ? 's' : ''}` : 'Crew'
  const vibeText = crew.vibe ? ` ${crew.vibe.charAt(0).toUpperCase() + crew.vibe.slice(1)} vibes.` : ''
  const privacy = crew.is_public ? '' : ' (Private Crew)'

  let description = `${memberText} ready to raise hell together.${vibeText}${privacy}`

  // Add custom description if provided
  if (crew.description?.trim()) {
    description = `${crew.description.trim()} | ${memberText}${privacy}`
  }

  // Ensure description is within limits (160 chars for optimal display)
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }

  // Use default crew image
  const image = getDefaultCrewImage()

  return {
    title,
    description,
    image,
    url: crewUrl,
    type: 'article',
    siteName: 'Thirstee',
    twitterCard: 'summary_large_image'
  }
}

/**
 * Generate meta tag data for the main app
 */
export function generateAppMetaTags(): MetaTagData {
  return {
    title: 'Thirstee – Tap. Drink. Repeat.',
    description: 'Thirstee helps you skip the planning drama. Launch a drink plan, gather your crew, and vibe in real-time. 60-second setup. Max-level chaos.',
    image: `${window.location.origin}/assets/covers/Party Mode.webp`, // Use existing party cover as main app image
    url: window.location.origin,
    type: 'website',
    siteName: 'Thirstee',
    twitterCard: 'summary_large_image'
  }
}

/**
 * Apply meta tags to document head
 */
export function applyMetaTags(metaData: MetaTagData): void {
  // Update document title
  document.title = metaData.title
  
  // Helper function to set or update meta tag
  const setMetaTag = (property: string, content: string, isProperty = true) => {
    const attribute = isProperty ? 'property' : 'name'
    let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, property)
      document.head.appendChild(meta)
    }
    
    meta.setAttribute('content', content)
  }
  
  // Basic meta tags
  setMetaTag('description', metaData.description, false)
  
  // Open Graph tags
  setMetaTag('og:title', metaData.title)
  setMetaTag('og:description', metaData.description)
  setMetaTag('og:url', metaData.url)
  setMetaTag('og:type', metaData.type || 'website')
  
  if (metaData.siteName) {
    setMetaTag('og:site_name', metaData.siteName)
  }
  
  if (metaData.image) {
    setMetaTag('og:image', metaData.image)
    setMetaTag('og:image:width', '1200')
    setMetaTag('og:image:height', '630')
    setMetaTag('og:image:alt', metaData.title)
  }
  
  // Twitter Card tags
  setMetaTag('twitter:card', metaData.twitterCard || 'summary_large_image', false)
  setMetaTag('twitter:title', metaData.title, false)
  setMetaTag('twitter:description', metaData.description, false)
  
  if (metaData.image) {
    setMetaTag('twitter:image', metaData.image, false)
    setMetaTag('twitter:image:alt', metaData.title, false)
  }
  
  // Additional social platform tags
  setMetaTag('linkedin:title', metaData.title)
  setMetaTag('linkedin:description', metaData.description)
  
  if (metaData.image) {
    setMetaTag('linkedin:image', metaData.image)
  }
}

/**
 * Reset meta tags to default app values
 */
export function resetMetaTags(): void {
  const defaultMeta = generateAppMetaTags()
  applyMetaTags(defaultMeta)
}

/**
 * Generate shareable URL with UTM parameters for tracking
 */
export function generateShareableUrl(
  baseUrl: string, 
  source: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin' | 'copy' | 'native' = 'copy'
): string {
  const url = new URL(baseUrl)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', 'social')
  url.searchParams.set('utm_campaign', 'event_share')
  return url.toString()
}

/**
 * Validate image URL for social sharing
 */
export function validateSocialImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Check if image meets minimum requirements for social sharing
      const minWidth = 600
      const minHeight = 315
      resolve(img.width >= minWidth && img.height >= minHeight)
    }
    img.onerror = () => resolve(false)
    img.src = imageUrl
  })
}

/**
 * Generate structured data for events (JSON-LD)
 */
export function generateEventStructuredData(event: {
  title: string
  description?: string | null
  date_time: string
  location?: string | null
  place_nickname?: string | null
  cover_image_url?: string | null
  is_public: boolean
}, eventUrl: string): object {
  const startDate = new Date(event.date_time).toISOString()
  
  return {
    "@context": "https://schema.org",
    "@type": "SocialEvent",
    "name": event.title,
    "description": event.description || `Join us for ${event.title}`,
    "startDate": startDate,
    "url": eventUrl,
    "location": {
      "@type": "Place",
      "name": event.place_nickname || event.location || "Location TBD"
    },
    "organizer": {
      "@type": "Organization",
      "name": "Thirstee"
    },
    "image": event.cover_image_url || getDefaultSocialImage(),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
  }
}

/**
 * Apply structured data to page
 */
export function applyStructuredData(structuredData: object): void {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]')
  if (existingScript) {
    existingScript.remove()
  }
  
  // Add new structured data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredData)
  document.head.appendChild(script)
}
