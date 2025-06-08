import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cover image utility functions
const VIBE_COVER_IMAGES: Record<string, string> = {
  casual: '/assets/covers/Casual Hang.webp',
  party: '/assets/covers/Party Mode.webp',
  shots: '/assets/covers/Shots Night.webp',
  chill: '/assets/covers/Chill Vibes.webp',
  wild: '/assets/covers/Wild Night.webp',
  classy: '/assets/covers/Classy Evening.webp',
  other: '/assets/covers/default-event-cover.webp'
}

function getDefaultCoverImage(vibe?: string): string {
  if (!vibe || !(vibe in VIBE_COVER_IMAGES)) {
    return VIBE_COVER_IMAGES.other
  }
  return VIBE_COVER_IMAGES[vibe]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateEventRequest {
  title: string
  location: string
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  place_name?: string | null
  date_time: string
  drink_type?: string
  vibe?: string
  notes?: string
  is_public: boolean
  cover_image_url?: string | null
}

// Generate a shorter, more user-friendly event ID
function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const eventData: CreateEventRequest = await req.json()

    // Validate required fields
    if (!eventData.title || !eventData.location || !eventData.date_time) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, location, date_time' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate a unique event code
    let eventCode = generateEventCode()
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    // Ensure the event code is unique
    while (!isUnique && attempts < maxAttempts) {
      const { data: existingEvent } = await supabaseClient
        .from('events')
        .select('id')
        .eq('event_code', eventCode)
        .maybeSingle()

      if (!existingEvent) {
        isUnique = true
      } else {
        eventCode = generateEventCode()
        attempts++
      }
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique event code' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Assign default cover image if not provided
    const coverImageUrl = eventData.cover_image_url || getDefaultCoverImage(eventData.vibe)

    // Create the event
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .insert({
        title: eventData.title,
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        place_id: eventData.place_id,
        place_name: eventData.place_name,
        date_time: eventData.date_time,
        drink_type: eventData.drink_type,
        vibe: eventData.vibe,
        notes: eventData.notes,
        is_public: eventData.is_public,
        event_code: eventCode,
        created_by: user.id,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      return new Response(
        JSON.stringify({ error: 'Failed to create event', details: eventError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate shareable link
    const baseUrl = Deno.env.get('SITE_URL') || 'https://clink.app'
    const shareUrl = `${baseUrl}/event/${eventCode}`

    // Automatically RSVP the creator as "going"
    await supabaseClient
      .from('rsvps')
      .insert({
        event_id: event.id,
        user_id: user.id,
        status: 'going',
      })

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          ...event,
          share_url: shareUrl,
        },
        share_url: shareUrl,
        event_code: eventCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
