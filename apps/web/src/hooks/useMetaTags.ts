import { useEffect } from 'react'
import {
  applyMetaTags,
  resetMetaTags,
  generateEventMetaTags,
  generateCrewMetaTags,
  generateAppMetaTags,
  applyStructuredData,
  generateEventStructuredData,
  type MetaTagData
} from '@/lib/metaTagService'

/**
 * Hook for managing dynamic meta tags
 */
export function useMetaTags(metaData?: MetaTagData) {
  useEffect(() => {
    if (metaData) {
      applyMetaTags(metaData)
    } else {
      resetMetaTags()
    }

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      resetMetaTags()
    }
  }, [metaData])
}

/**
 * Hook specifically for event meta tags
 */
export function useEventMetaTags(event?: {
  title: string
  notes?: string | null  // Changed from description to notes to match Event type
  cover_image_url?: string | null
  vibe?: string | null
  date_time: string
  location?: string | null
  place_nickname?: string | null
  is_public: boolean
}, eventUrl?: string) {
  
  useEffect(() => {
    console.log('🔍 useEventMetaTags called with:', { event: !!event, eventUrl, eventTitle: event?.title })

    if (event && eventUrl) {
      // Generate and apply meta tags
      const metaData = generateEventMetaTags(event, eventUrl)
      applyMetaTags(metaData)

      // Generate and apply structured data
      const structuredData = generateEventStructuredData(event, eventUrl)
      applyStructuredData(structuredData)

      console.log('🏷️ Applied event meta tags:', metaData)
      console.log('📊 Applied structured data:', structuredData)

      // Verify the meta tags were actually applied
      setTimeout(() => {
        const titleElement = document.querySelector('title')
        const descElement = document.querySelector('meta[name="description"]')
        console.log('✅ Verified meta tags:', {
          title: titleElement?.textContent,
          description: descElement?.getAttribute('content')
        })
      }, 100)
    } else {
      console.log('⚠️ No event data or URL, resetting to default meta tags')
      resetMetaTags()
    }

    // Cleanup function - only remove structured data, don't reset meta tags
    // as that interferes with navigation between pages
    return () => {
      // Remove structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [event, eventUrl])
}

/**
 * Hook specifically for crew meta tags
 */
export function useCrewMetaTags(crew?: {
  name: string
  description?: string | null
  vibe?: string | null
  member_count?: number
  is_public: boolean
}, crewUrl?: string) {

  useEffect(() => {
    if (crew && crewUrl) {
      // Generate and apply meta tags
      const metaData = generateCrewMetaTags(crew, crewUrl)
      applyMetaTags(metaData)

      console.log('🏷️ Applied crew meta tags:', metaData)
    } else {
      resetMetaTags()
    }

    // Cleanup function
    return () => {
      resetMetaTags()
    }
  }, [crew, crewUrl])
}

/**
 * Hook for app-level meta tags
 */
export function useAppMetaTags() {
  useEffect(() => {
    const metaData = generateAppMetaTags()
    applyMetaTags(metaData)

    console.log('🏷️ Applied app meta tags:', metaData)
  }, [])
}
