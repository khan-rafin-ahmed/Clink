// Removed unused date-fns imports - using centralized eventUtils functions
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { UserAvatar } from './UserAvatar'
import { UserHoverCard } from './UserHoverCard'
import { GyroGlassCard } from './GyroGlassCard'
import { LiveBadge } from './LiveBadge'

// import { InnerCircleBadge } from './InnerCircleBadge' // Removed - using Crew System now
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Edit,
  Trash2,
  Wine,
  Beer,
  Martini,
  Coffee,
  ArrowRight
} from 'lucide-react'
import type { Event } from '@/types'
import { calculateAttendeeCount, getLocationDisplayName, getEventTimingStatus, formatEventTiming } from '@/lib/eventUtils'

interface EventCardProps {
  event: Event & {
    creator?: {
      display_name: string | null
      avatar_url: string | null
      user_id: string
    }
    rsvp_count?: number
  }
  showHostActions?: boolean
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}

export function EventCard({ event, showHostActions = false, onEdit, onDelete }: EventCardProps) {
  const { user } = useAuth()

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Generate proper URL based on event privacy and slug
  const getEventUrl = () => {
    const baseUrl = window.location.origin

    // Use proper slug for modern routing
    if (event.is_public && event.public_slug) {
      return `${baseUrl}/event/${event.public_slug}`
    } else if (!event.is_public && event.private_slug) {
      return `${baseUrl}/private-event/${event.private_slug}`
    }

    // Fallback to event_code for backward compatibility
    return `${baseUrl}/event/${event.event_code || event.id}`
  }

  const eventUrl = getEventUrl()

  const isHost = user && event.created_by === user.id

  // Use consistent attendee counting logic
  // If event has rsvp_count from RPC function, use that (already includes host + RSVPs + crew)
  // Otherwise, calculate from the event data (for events loaded with full RSVP/member data)
  const displayCount = event.rsvp_count !== undefined
    ? event.rsvp_count
    : calculateAttendeeCount(event)

  // Use centralized timing functions
  const getStatusBadge = (dateTime: string, endTime?: string | null, durationType?: string | null) => {
    const status = getEventTimingStatus(dateTime, endTime, durationType)

    switch (status) {
      case 'past':
        return { text: 'Past', variant: 'secondary' as const }
      case 'now':
        return { text: 'LIVE', variant: 'destructive' as const }
      case 'today':
        return { text: 'Tonight', variant: 'default' as const }
      case 'tomorrow':
        return { text: 'Tomorrow', variant: 'secondary' as const }
      default:
        return { text: 'Upcoming', variant: 'outline' as const }
    }
  }

  const getDrinkIcon = (drinkType: string | undefined) => {
    switch (drinkType) {
      case 'beer': return <Beer className="w-5 h-5" />
      case 'wine': return <Wine className="w-5 h-5" />
      case 'cocktails': return <Martini className="w-5 h-5" />
      case 'coffee': return <Coffee className="w-5 h-5" />
      default: return <Beer className="w-5 h-5" />
    }
  }

  const getVibeColor = (vibe: string | undefined) => {
    switch (vibe) {
      case 'party': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'chill': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'wild': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'classy': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-green-500/10 text-green-500 border-green-500/20'
    }
  }

  const getHostDisplayName = () => {
    if (!event.creator) {
      // Fallback to a more descriptive name using the user ID
      return `User ${event.created_by.slice(-4)}`
    }

    // Check if creator has a nickname
    const creatorData = event.creator as any
    if (creatorData.nickname) {
      return creatorData.nickname
    }

    return event.creator.display_name || `User ${event.created_by.slice(-4)}`
  }

  const statusBadge = getStatusBadge(event.date_time, event.end_time, event.duration_type)

  return (
    <GyroGlassCard
      className="group glass-card border border-white/10 hover:border-primary/30 rounded-xl"
      intensity={0.8}
      glassEffect="normal"
      enableGyro={true}
      fallbackToMouse={true}
    >

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-primary text-shadow">
                {event.title}
              </h3>
              <Badge
                variant={statusBadge.variant}
                size="sm"
                className="glass-effect border-white/20 backdrop-blur-sm hover:backdrop-blur-md"
              >
                {statusBadge.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4 group-hover:text-primary" />
              <span className="group-hover:text-foreground">
                {formatEventTiming(event.date_time, event.end_time, event.duration_type)}
              </span>
              <LiveBadge
                dateTime={event.date_time}
                endTime={event.end_time}
                durationType={event.duration_type}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 group-hover:text-primary" />
              <div className="truncate max-w-[200px]">
                <span
                  className="text-sm text-muted-foreground truncate group-hover:text-foreground"
                  title={event.place_nickname || getLocationDisplayName(event)}
                >
                  {event.place_nickname || getLocationDisplayName(event)}
                </span>
                {event.place_nickname && (event.place_name || event.location) && (
                  <div className="text-xs text-muted-foreground/70 truncate">
                    {event.place_name || event.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            {getDrinkIcon(event.drink_type)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        {/* Event Description */}
        {event.notes && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 group-hover:text-foreground/80">
            {event.notes}
          </p>
        )}

        {/* Vibe Badge and RSVP Count */}
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className={`${getVibeColor(event.vibe)} glass-effect backdrop-blur-sm hover:backdrop-blur-md`}
          >
            {event.vibe}
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 group-hover:text-primary" />
            <span className="text-muted-foreground group-hover:text-foreground">
              {displayCount} {displayCount === 1 ? 'person' : 'people'} going
            </span>
          </div>
        </div>

        {/* Host Info */}
        <UserHoverCard
          userId={event.created_by}
          displayName={event.creator?.display_name || getHostDisplayName()}
          avatarUrl={event.creator?.avatar_url}
          isHost={true}
        >
          <div className="flex items-center gap-2 mb-4 p-3 glass-effect rounded-xl hover:bg-white/10 cursor-pointer border border-white/10 hover:border-primary/30">
            <div className="relative">
              <UserAvatar
                userId={event.created_by}
                displayName={event.creator?.display_name || getHostDisplayName()}
                avatarUrl={event.creator?.avatar_url}
                size="xs"
                className="ring-2 ring-white/20 hover:ring-primary/40"
              />
              {isHost && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                {isHost ? 'Hosted by You 🍻' : `Hosted by ${getHostDisplayName()}`}
              </span>
              {/* Crew badge removed - using Crew System now */}
            </div>
          </div>
        </UserHoverCard>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Host Actions Row */}
          {showHostActions && isHost && (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 hover:border-primary/50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => onDelete(event)}
                  className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30 hover:border-destructive/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Main Actions Row */}
          <div className="flex gap-2">
            {/* View Details Button */}
            <Link to={getEventUrl().replace(window.location.origin, '')} className="flex-1">
              <Button
                variant="glass-primary"
                className="w-full group/btn backdrop-blur-lg hover:backdrop-blur-xl"
              >
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            {/* Share Button */}
            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="glass"
              size="icon-sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 glass-effect"
            >
              <Share2 className="w-4 h-4" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title}
        url={eventUrl}
      />
    </GyroGlassCard>
  )
}