import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { UserAvatar } from './UserAvatar'
import { UserHoverCard } from './UserHoverCard'
import { CompactStaticMapThumbnail } from '@/components/StaticMapThumbnail'
import { calculateAttendeeCount } from '@/lib/eventUtils'
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
  Coffee
} from 'lucide-react'
import type { Event } from '@/types'

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
  const eventUrl = `${window.location.origin}/event/${event.event_code || event.id}`

  const isHost = user && event.created_by === user.id

  // Calculate attendee count using the same logic as EventDetail
  const attendeeCount = calculateAttendeeCount(event)

  // Format event time and get status badge
  const formatEventTime = (dateTime: string) => {
    const date = new Date(dateTime)
    const now = new Date()

    if (isPast(date)) {
      return format(date, 'MMM d, h:mm a')
    }

    if (isToday(date)) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const nowHours = now.getHours()
      const nowMinutes = now.getMinutes()

      if (hours < nowHours || (hours === nowHours && minutes <= nowMinutes + 30)) {
        return 'Right Now! 🔥'
      }
      return `Today at ${format(date, 'h:mm a')}`
    }

    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`
    }

    if (isThisWeek(date)) {
      return format(date, 'EEEE \'at\' h:mm a')
    }

    return format(date, 'MMM d \'at\' h:mm a')
  }

  const getStatusBadge = (dateTime: string) => {
    const date = new Date(dateTime)
    const now = new Date()

    if (isPast(date)) {
      return { text: 'Past', variant: 'secondary' as const }
    }

    if (isToday(date)) {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const nowHours = now.getHours()
      const nowMinutes = now.getMinutes()

      if (hours < nowHours || (hours === nowHours && minutes <= nowMinutes + 30)) {
        return { text: 'Right Now', variant: 'destructive' as const }
      }
      return { text: 'Tonight', variant: 'default' as const }
    }

    if (isTomorrow(date)) {
      return { text: 'Tomorrow', variant: 'secondary' as const }
    }

    return { text: 'Upcoming', variant: 'outline' as const }
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

  const statusBadge = getStatusBadge(event.date_time)

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">
                {event.title}
              </h3>
              <Badge variant={statusBadge.variant}>
                {statusBadge.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              {formatEventTime(event.date_time)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <div className="truncate">
                <span className="text-sm text-muted-foreground">{event.place_name || event.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            {getDrinkIcon(event.drink_type)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Event Description */}
        {event.notes && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {event.notes}
          </p>
        )}

        {/* Vibe Badge and RSVP Count */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className={getVibeColor(event.vibe)}>
            {event.vibe}
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4" />
            {attendeeCount === 0 ? (
              isHost ? (
                <span className="text-muted-foreground">
                  No one has joined yet
                </span>
              ) : (
                <span className="text-primary font-medium animate-pulse">
                  Be the first to raise hell! ✨
                </span>
              )
            ) : (
              <span className="text-muted-foreground">
                {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
              </span>
            )}
          </div>
        </div>

        {/* Host Info */}
        <UserHoverCard
          userId={event.created_by}
          displayName={event.creator?.display_name}
          avatarUrl={event.creator?.avatar_url}
          isHost={true}
        >
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
            <UserAvatar
              userId={event.created_by}
              displayName={event.creator?.display_name}
              avatarUrl={event.creator?.avatar_url}
              size="xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isHost ? 'Hosted by You' : `Hosted by ${event.creator?.display_name || 'Anonymous'}`}
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
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/30"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDelete(event)}
                  className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20 hover:border-destructive/30"
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
            <Link to={`/event/${event.event_code || event.id}`} className="flex-1">
              <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground">
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Button>
            </Link>

            {/* Share Button */}
            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="ghost"
              size="sm"
              className="px-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
    </Card>
  )
}