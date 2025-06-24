import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Simple real-time hook for notifications
 */
export function useRealtimeNotifications(userId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onUpdate])
}

/**
 * Simple real-time hook for event RSVPs
 */
export function useRealtimeEventRSVPs(eventId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel(`rsvps:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, onUpdate])
}

/**
 * Simple real-time hook for events
 */
export function useRealtimeEvents(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
