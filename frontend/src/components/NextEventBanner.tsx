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
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          rsvps!inner (
            user_id,
            status
          )
        `)
        .or(`created_by.eq.${userId},rsvps.user_id.eq.${userId}`)
        .eq('rsvps.status', 'going')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Error loading next event:', error)
        return null
      }

      // Also check for events where user is an accepted crew member
      const { data: crewEvents, error: crewError } = await supabase
        .from('events')
        .select(`
          *,
          event_members!inner (
            user_id,
            status
          )
        `)
        .eq('event_members.user_id', userId)
        .eq('event_members.status', 'accepted')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(1)

      if (crewError) {
        console.error('Error loading crew events:', crewError)
      }

      // Combine and find the earliest event
      const allEvents = [...(events || []), ...(crewEvents || [])]

      if (allEvents.length > 0) {
        // Sort by date and take the earliest
        const sortedEvents = allEvents.sort((a, b) =>
          new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        )

        const earliestEvent = sortedEvents[0]
        return earliestEvent
      }
    } catch (error) {
      console.error('Error loading next event:', error)
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className={cn("bg-gradient-to-r from-background to-muted/20 border-primary/20", className)}>
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
      "bg-gradient-to-r from-background via-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group",
      className
    )}>
      <Link to={eventUrl}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h3 className="text-lg font-bold text-foreground">
                Your Next Clink is Coming Up!
              </h3>
            </div>
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="space-y-3">
            {/* Event Title and Host Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xl font-bold text-foreground">
                {nextEvent.title}
              </h4>
              {isHost && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <Crown className="w-3 h-3 mr-1" />
                  You're Hosting
                </Badge>
              )}
              {joinStatus === 'crew' && (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Crew Member
                </Badge>
              )}
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {formatEventTiming(nextEvent.date_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate">
                  {nextEvent.place_name || nextEvent.location}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {nextEvent.drink_type && (
                  <Badge variant="outline" className="text-xs">
                    {nextEvent.drink_type}
                  </Badge>
                )}
                {nextEvent.vibe && (
                  <Badge variant="outline" className="text-xs">
                    {nextEvent.vibe} vibe
                  </Badge>
                )}
              </div>

              <Button
                variant={isHost ? "default" : "outline"}
                size="sm"
                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
