import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RSVPButton } from '@/components/RSVPButton'
import { ShareModal } from '@/components/ShareModal'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface SessionCardProps {
  event: {
    id: string
    title: string
    notes?: string
    location: string
    date_time: string
    created_by: string
    rsvp_count?: number
    user_rsvp_status?: 'going' | 'maybe' | 'not_going' | null
    event_code?: string
    attendees?: Array<{
      id: string
      name: string
      emoji: string
    }>
  }
  showRSVPStatus?: boolean
  compact?: boolean
  onEdit?: (event: any) => void
  onDelete?: (event: any) => void
  showHostActions?: boolean
}

export function SessionCard({
  event,
  showRSVPStatus = false,
  compact = false,
  onEdit,
  onDelete,
  showHostActions = false
}: SessionCardProps) {
  const { user } = useAuth()
  const eventDate = new Date(event.date_time)
  const now = new Date()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const eventUrl = `${window.location.origin}/event/${event.event_code || event.id}`

  const isHost = user && event.created_by === user.id

  // Calculate date badge
  const getDateBadge = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const eventDateOnly = new Date(eventDate)
    eventDateOnly.setHours(0, 0, 0, 0)

    if (eventDateOnly.getTime() === today.getTime()) {
      return { text: 'Tonight', variant: 'default' as const }
    } else if (eventDateOnly.getTime() === tomorrow.getTime()) {
      return { text: 'Tomorrow', variant: 'secondary' as const }
    } else if (eventDate < now) {
      return { text: 'Past', variant: 'outline' as const }
    } else {
      const diffDays = Math.ceil((eventDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 7) {
        return { text: `In ${diffDays} days`, variant: 'secondary' as const }
      } else {
        return { text: eventDate.toLocaleDateString(), variant: 'outline' as const }
      }
    }
  }

  const getRSVPBadge = () => {
    if (!event.user_rsvp_status) return null

    const badges = {
      going: { text: '✅ Going', variant: 'default' as const },
      maybe: { text: '🤔 Maybe', variant: 'secondary' as const },
      not_going: { text: '❌ Not Going', variant: 'destructive' as const }
    }

    return badges[event.user_rsvp_status]
  }

  const dateBadge = getDateBadge()
  const rsvpBadge = getRSVPBadge()

  if (compact) {
    return (
      <div className="bg-card rounded-lg p-4 border border-border hover:border-primary/20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{event.title}</h3>
              <Badge variant={dateBadge.variant} className="text-xs">
                {dateBadge.text}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{event.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {showRSVPStatus && rsvpBadge && (
              <Badge variant={rsvpBadge.variant} className="text-xs">
                {rsvpBadge.text}
              </Badge>
            )}
            {showHostActions && isHost && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(event)}
                className="text-xs p-1"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {showHostActions && isHost && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(event)}
                className="text-xs p-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Link to={`/events/${event.id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                View
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <Badge variant={dateBadge.variant}>
              {dateBadge.text}
            </Badge>
            {showRSVPStatus && rsvpBadge && (
              <Badge variant={rsvpBadge.variant}>
                {rsvpBadge.text}
              </Badge>
            )}
          </div>
          {event.notes && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {event.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {eventDate.toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {event.location}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="sr-only">Session ID: {event.id}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            📤 Share
          </button>
          {showHostActions && isHost && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(event)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {showHostActions && isHost && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(event)}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <RSVPButton
            eventId={event.id}
            initialAttendees={event.attendees}
          />
          <Link to={`/events/${event.id}`}>
            <Button variant="outline">
              View Session
            </Button>
          </Link>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title}
        url={eventUrl}
      />
    </div>
  )
}
