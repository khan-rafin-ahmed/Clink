import { useState, useEffect } from 'react'
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { UserAvatar } from './UserAvatar'
import { ClickableUserAvatar } from './ClickableUserAvatar'
import { LiveBadge } from './LiveBadge'
import { MapPin, ArrowRight, Edit, MoreVertical, Share2, Clock, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { getUserJoinStatus, calculateAttendeeCount, getLocationDisplayName } from '@/lib/eventUtils'
import { getEventCoverImage, getVibeFallbackGradient, getVibeEmoji } from '@/lib/coverImageUtils'
import type { Event } from '@/types'
import { cn } from '@/lib/utils'

interface NextEventBannerProps {
  userId: string
  className?: string
}

export function NextEventBanner({ userId, className }: NextEventBannerProps) {
  const { user } = useAuth()
  const [nextEvent, setNextEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Format event time - same as EnhancedEventCard
  const formatEventTime = (dateTime: string) => {
    const eventDate = new Date(dateTime)
    if (isToday(eventDate)) return `Today at ${format(eventDate, 'h:mm a')}`
    if (isTomorrow(eventDate)) return `Tomorrow at ${format(eventDate, 'h:mm a')}`
    if (isThisWeek(eventDate)) return format(eventDate, 'EEEE \'at\' h:mm a')
    return format(eventDate, 'MMM d \'at\' h:mm a')
  }

  // Generate proper URL based on event privacy and slug - same as EnhancedEventCard
  const getEventUrl = (event: Event) => {
    const baseUrl = window.location.origin
    if (event.is_public && event.public_slug) {
      return `${baseUrl}/event/${event.public_slug}`
    } else if (!event.is_public && event.private_slug) {
      return `${baseUrl}/private-event/${event.private_slug}`
    }
    return `${baseUrl}/event/${event.event_code || event.id}`
  }

  // Get status badge - same as EnhancedEventCard
  const getStatusBadge = () => {
    if (!nextEvent) return { text: 'Upcoming', variant: 'outline' as const }
    const eventDate = new Date(nextEvent.date_time)
    const isPastEvent = isPast(eventDate)

    if (isPastEvent) return { text: 'Past', variant: 'secondary' as const }
    if (isToday(eventDate)) return { text: 'Today', variant: 'default' as const }
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', variant: 'accent' as const }
    return { text: 'Upcoming', variant: 'outline' as const }
  }

  // Generate placeholder image based on event vibe - same as EnhancedEventCard
  const getPlaceholderImage = () => {
    if (!nextEvent) return null
    const gradient = getVibeFallbackGradient(nextEvent.vibe)
    const vibeEmoji = getVibeEmoji(nextEvent.vibe)

    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <div className="text-center space-y-2">
          <div className="text-4xl opacity-80">
            {vibeEmoji}
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {nextEvent.vibe || 'Event'}
          </div>
        </div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }} />
        </div>
      </div>
    )
  }

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
  const eventUrl = getEventUrl(nextEvent).replace(window.location.origin, '')
  const displayCount = calculateAttendeeCount(nextEvent)
  const statusBadge = getStatusBadge()
  const isHostUser = user && nextEvent.created_by === user.id

  return (
    <Link to={eventUrl} className="block">
      <Card className={cn(
        "event-card w-full interactive-card group glass-card transition-all duration-300 hover:shadow-white-lg relative overflow-hidden backdrop-blur-sm rounded-xl cursor-pointer border-l-2 border-l-accent-primary",
        className
      )} style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
        {/* Glass shimmer overlay */}
        <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        {/* Actions Dropdown - Top Right */}
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-[44px] w-[44px] md:h-8 md:w-8 p-0 hover:bg-bg-glass-hover backdrop-blur-sm flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-modal border-border/50">
              <DropdownMenuItem asChild>
                <Link to={eventUrl} className="flex items-center">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </DropdownMenuItem>
              {isHost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`${eventUrl}?edit=true`} className="flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Event
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardContent className="px-4 py-4 relative z-10">
          {/* Lu.ma-style layout - Always side-by-side */}
          <div className="flex items-start gap-x-4">
            {/* Lu.ma-style Fixed Width Image */}
            <div className="flex-shrink-0">
              <div className="w-[96px] h-[96px] rounded-xl overflow-hidden bg-card-hover">
                {getEventCoverImage(nextEvent.cover_image_url, nextEvent.vibe) && !imageError ? (
                  <img
                    src={getEventCoverImage(nextEvent.cover_image_url, nextEvent.vibe)}
                    alt={nextEvent.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-secondary/20 flex items-center justify-center">
                    <span className="text-2xl">{getVibeEmoji(nextEvent.vibe)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Content - Main Section */}
            <div className="flex-1 min-w-0">
              {/* Upcoming Session Badge */}
              <div className="text-xs uppercase font-bold text-accent-primary mb-1 flex items-center gap-1">
                🔥 Upcoming Session
              </div>

              {/* Time and Title Row */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-accent-primary flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatEventTime(nextEvent.date_time)}</span>
                  <LiveBadge
                    dateTime={nextEvent.date_time}
                    endTime={nextEvent.end_time}
                    durationType={nextEvent.duration_type}
                  />
                </div>
              </div>

              {/* Title - Always fully visible, no truncation */}
              <h4 className="font-heading text-white text-base font-semibold mb-2 leading-tight">
                {nextEvent.title}
              </h4>

              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <div className="truncate">
                  <span className="truncate">
                    {getLocationDisplayName(nextEvent)}
                  </span>
                  {nextEvent.place_nickname && (
                    <div className="text-xs text-muted-foreground/70 truncate">
                      {nextEvent.place_nickname}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section - Responsive Layout */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Attendee Count and Avatars */}
                <div className="flex items-center gap-2">
                  {/* Enhanced Attendee Avatars - Show at least 3 avatars */}
                  <div className="flex -space-x-1">
                    {/* Host Avatar - Clickable */}
                    <ClickableUserAvatar
                      userId={nextEvent.created_by}
                      displayName={`User ${nextEvent.created_by.slice(-4)}`}
                      avatarUrl={null}
                      size="sm"
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-background ring-1 ring-white/20 hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative overflow-hidden">
                        <UserAvatar
                          userId={nextEvent.created_by}
                          displayName={`User ${nextEvent.created_by.slice(-4)}`}
                          avatarUrl={null}
                          size="sm"
                          className="w-full h-full"
                        />
                      </div>
                    </ClickableUserAvatar>
                    {/* Second attendee placeholder */}
                    {displayCount > 1 && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-secondary/20 to-accent-primary/20 border-2 border-background ring-1 ring-white/20 flex items-center justify-center hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative">
                        <Users className="w-2 h-2 text-accent-primary" />
                      </div>
                    )}
                    {/* Third attendee placeholder */}
                    {displayCount > 2 && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent-secondary/20 border-2 border-background ring-1 ring-white/20 flex items-center justify-center hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative">
                        <Users className="w-2 h-2 text-primary" />
                      </div>
                    )}
                    {/* Count badge for remaining attendees */}
                    {displayCount > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border-2 border-background ring-1 ring-white/20 flex items-center justify-center hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative">
                        <span className="text-[10px] font-bold text-accent-primary">
                          +{displayCount - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{displayCount} attending</span>
                </div>

                {/* Badge Layout - Responsive: Below on mobile, inline on desktop */}
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                  {/* Vibe Badge */}
                  <div className="glass-pill text-white font-medium flex items-center text-xs px-2 py-1 min-h-[36px] md:min-h-0">
                    <span className="text-[#CFCFCF]">{getVibeEmoji(nextEvent.vibe)}</span>
                    <span className="text-white font-medium ml-1">{nextEvent.vibe}</span>
                  </div>
                  {/* Public/Private Badge */}
                  <Badge
                    variant={nextEvent.is_public ? "default" : "secondary"}
                    size="sm"
                    className="text-xs px-2 py-1 whitespace-nowrap min-h-[36px] md:min-h-0 flex items-center"
                  >
                    {nextEvent.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={nextEvent.title}
          url={`${window.location.origin}${eventUrl}`}
        />
      </Card>
    </Link>
  )
}
