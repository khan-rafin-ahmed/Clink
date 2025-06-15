import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Crown, ArrowRight, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatEventTiming, getUserJoinStatus } from '@/lib/eventUtils'
import type { Event } from '@/types'
import { cn } from '@/lib/utils'

interface NextEventBannerProps {
  userId: string
  className?: string
}

export function NextEventBanner({ userId, className }: NextEventBannerProps) {
  const [nextEvent, setNextEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    loadNextEvent()
  }, [userId])

  const loadNextEvent = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const event = await getNextEvent(userId)
      setNextEvent(event)
      setIsHost(event?.created_by === userId)
    } catch (error) {
      console.error('Error loading next event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNextEvent = async (userId: string): Promise<Event | null> => {
    if (!userId) return null

    try {
      // Get upcoming events where user is either:
      // 1. The host (created_by)
      // 2. Has RSVP'd as 'going'
      // 3. Is an accepted event member (crew member)

      // First, get events created by the user
      const { data: hostedEvents, error: hostedError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5)

      if (hostedError) {
        console.error('Error loading hosted events:', hostedError)
        return null
      }

      // Get events where user has RSVP'd
      const { data: rsvpEvents, error: rsvpError } = await supabase
        .from('events')
        .select(`
          *,
          rsvps!inner (
            status,
            user_id
          )
        `)
        .eq('rsvps.user_id', userId)
        .eq('rsvps.status', 'going')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5)

      if (rsvpError) {
        console.error('Error loading RSVP events:', rsvpError)
        return null
      }

      // Get events where user is a crew member
      const { data: memberEvents, error: memberError } = await supabase
        .from('events')
        .select(`
          *,
          event_members!inner (
            status,
            user_id
          )
        `)
        .eq('event_members.user_id', userId)
        .eq('event_members.status', 'accepted')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5)

      if (memberError) {
        console.error('Error loading member events:', memberError)
        return null
      }

      // Combine all events and find the earliest one
      const allEvents = [
        ...(hostedEvents || []),
        ...(rsvpEvents || []),
        ...(memberEvents || [])
      ]

      if (allEvents.length === 0) {
        return null
      }

      // Remove duplicates and sort by date
      const uniqueEvents = allEvents.filter((event, index, self) =>
        index === self.findIndex(e => e.id === event.id)
      )

      uniqueEvents.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      return uniqueEvents[0] || null
    } catch (error) {
      console.error('Error loading next event:', error)
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className={cn("bg-gradient-to-r from-background to-muted/20", className)} style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!nextEvent) {
    return null // Don't show banner if no upcoming events
  }

  const joinStatus = getUserJoinStatus(nextEvent, userId)
  const eventUrl = `/event/${nextEvent.event_code || nextEvent.id}`

  return (
    <Card className={cn(
      "glass-card glass-halo relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-xl",
      className
    )} style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
      {/* Parallax Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/10 opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent-primary/5 to-transparent opacity-80"></div>

      <Link to={eventUrl}>
        <CardContent className="relative z-10 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl float flex-shrink-0">🔥</span>
              <h3 className="text-lg font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent truncate">
                Your Next Clink is Coming Up!
              </h3>
            </div>
            <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
          </div>

          <div className="space-y-3">
            {/* Event Title and Host Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="text-xl font-bold text-foreground truncate max-w-[300px] flex-shrink-0">
                {nextEvent.title}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {isHost && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 min-h-[36px] flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    You're Hosting
                  </Badge>
                )}
                {joinStatus === 'crew' && (
                  <Badge variant="outline" className="border-primary/30 text-primary min-h-[36px] flex items-center">
                    Crew Member
                  </Badge>
                )}
              </div>
            </div>

            {/* Event Details - Enhanced Glass Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="glass-pill px-3 py-2 flex items-center gap-2 pill-glow min-h-[36px]" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                <Calendar className="w-4 h-4 clock-tick text-accent-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {formatEventTiming(nextEvent.date_time)}
                </span>
              </div>
              {nextEvent.location && (
                <div className="glass-pill px-3 py-2 flex items-center gap-2 min-h-[36px] max-w-[250px]" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                  <MapPin className="w-4 h-4 text-accent-secondary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {nextEvent.place_name || nextEvent.location}
                  </span>
                </div>
              )}
            </div>

            {/* Action Section - Enhanced Glass Design with Responsive Layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                {nextEvent.drink_type && (
                  <div className="glass-pill px-2 py-1 text-xs font-medium text-accent-secondary min-h-[36px] flex items-center" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                    🍺 {nextEvent.drink_type}
                  </div>
                )}
                {nextEvent.vibe && (
                  <div className="glass-pill px-2 py-1 text-xs font-medium text-accent-primary min-h-[36px] flex items-center" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                    ✨ {nextEvent.vibe} vibe
                  </div>
                )}
              </div>

              <Button
                variant={isHost ? "default" : "outline"}
                size="sm"
                className={cn(
                  "min-h-[36px] flex-shrink-0",
                  isHost
                    ? "bg-gradient-primary hover:shadow-white-lg"
                    : "glass-card hover:border-accent-primary/50"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = eventUrl
                }}
              >
                {isHost ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </>
                ) : (
                  <>
                    View Event
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
