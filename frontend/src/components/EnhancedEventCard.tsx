import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { UserAvatar } from './UserAvatar'
import { UserHoverCard } from './UserHoverCard'
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
  ArrowRight,
  Clock
} from 'lucide-react'
import type { Event } from '@/types'
import { calculateAttendeeCount } from '@/lib/eventUtils'
import { cn } from '@/lib/utils'
import { getEventCoverImage, getVibeFallbackGradient, getVibeEmoji } from '@/lib/coverImageUtils'

interface EnhancedEventCardProps {
  event: Event & {
    creator?: {
      display_name: string | null
      avatar_url: string | null
      user_id: string
    }
    rsvp_count?: number
    hero_image_url?: string | null
  }
  showHostActions?: boolean
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function EnhancedEventCard({ 
  event, 
  showHostActions = false, 
  onEdit, 
  onDelete,
  variant = 'default',
  className
}: EnhancedEventCardProps) {
  const { user } = useAuth()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Generate proper URL based on event privacy and slug
  const getEventUrl = () => {
    const baseUrl = window.location.origin
    if (event.is_public && event.public_slug) {
      return `${baseUrl}/event/${event.public_slug}`
    } else if (!event.is_public && event.private_slug) {
      return `${baseUrl}/private-event/${event.private_slug}`
    }
    return `${baseUrl}/event/${event.event_code || event.id}`
  }

  const eventUrl = getEventUrl()
  const isHost = user && event.created_by === user.id
  const displayCount = event.rsvp_count !== undefined ? event.rsvp_count : calculateAttendeeCount(event)

  // Format event time
  const formatEventTime = (dateTime: string) => {
    const eventDate = new Date(dateTime)
    if (isToday(eventDate)) return `Today at ${format(eventDate, 'h:mm a')}`
    if (isTomorrow(eventDate)) return `Tomorrow at ${format(eventDate, 'h:mm a')}`
    if (isThisWeek(eventDate)) return format(eventDate, 'EEEE \'at\' h:mm a')
    return format(eventDate, 'MMM d \'at\' h:mm a')
  }

  // Get status badge
  const getStatusBadge = () => {
    const eventDate = new Date(event.date_time)
    const isPastEvent = isPast(eventDate)

    if (isPastEvent) return { text: 'Past', variant: 'secondary' as const }
    if (isToday(eventDate)) return { text: 'Today', variant: 'default' as const }
    if (isTomorrow(eventDate)) return { text: 'Tomorrow', variant: 'accent' as const }
    return { text: 'Upcoming', variant: 'outline' as const }
  }

  const statusBadge = getStatusBadge()

  // Get drink icon
  const getDrinkIcon = () => {
    switch (event.drink_type) {
      case 'beer': return <Beer className="w-4 h-4" />
      case 'wine': return <Wine className="w-4 h-4" />
      case 'cocktails': return <Martini className="w-4 h-4" />
      case 'whiskey': return <Coffee className="w-4 h-4" />
      default: return <Martini className="w-4 h-4" />
    }
  }

  // Get vibe styling
  const getVibeColor = (vibe?: string) => {
    switch (vibe) {
      case 'party': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'chill': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'wild': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'classy': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default: return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  // Generate placeholder image based on event vibe
  const getPlaceholderImage = () => {
    const gradient = getVibeFallbackGradient(event.vibe)
    const vibeEmoji = getVibeEmoji(event.vibe)

    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <div className="text-center space-y-2">
          <div className="text-4xl opacity-80">
            {vibeEmoji}
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {event.vibe || 'Event'}
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

  if (variant === 'compact') {
    return (
      <Card className={cn("interactive-card group", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Compact Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-card-hover">
              {getEventCoverImage(event.cover_image_url, event.vibe) && !imageError ? (
                <img
                  src={getEventCoverImage(event.cover_image_url, event.vibe)}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                getPlaceholderImage()
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatEventTime(event.date_time)}
                  </div>
                </div>
                <Badge variant={statusBadge.variant} size="sm">
                  {statusBadge.text}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {displayCount}
                </div>
                <Link to={getEventUrl().replace(window.location.origin, '')}>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isFeatured = variant === 'featured'

  return (
    <Card className={cn(
      "interactive-card group overflow-hidden",
      isFeatured && "ring-2 ring-primary/20 shadow-gold",
      className
    )}>
      {/* Hero Image Section */}
      <div className={cn(
        "relative overflow-hidden",
        isFeatured ? "h-48 sm:h-56" : "h-40 sm:h-48"
      )}>
        {getEventCoverImage(event.cover_image_url, event.vibe) && !imageError ? (
          <img
            src={getEventCoverImage(event.cover_image_url, event.vibe)}
            alt={event.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          getPlaceholderImage()
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusBadge.variant} size="sm" className="backdrop-blur-sm">
            {statusBadge.text}
          </Badge>
          {isFeatured && (
            <Badge variant="default" size="sm" className="backdrop-blur-sm">
              ⭐ Featured
            </Badge>
          )}
        </div>

        {/* Share Button */}
        <Button
          onClick={() => setIsShareModalOpen(true)}
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className={cn(
            "font-heading font-bold text-white line-clamp-2 mb-1",
            isFeatured ? "text-lg sm:text-xl" : "text-base sm:text-lg"
          )}>
            {event.title}
          </h3>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Calendar className="w-4 h-4" />
            {formatEventTime(event.date_time)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 sm:p-6">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">
            {event.place_nickname || event.place_name || event.location}
          </span>
        </div>

        {/* Description */}
        {event.notes && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.notes}
          </p>
        )}

        {/* Vibe and Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getVibeColor(event.vibe)} size="sm">
              {event.vibe}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getDrinkIcon()}
              <span className="capitalize">{event.drink_type}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {displayCount}
          </div>
        </div>

        {/* Host Info */}
        <UserHoverCard
          userId={event.created_by}
          displayName={event.creator?.display_name || `User ${event.created_by.slice(-4)}`}
          avatarUrl={event.creator?.avatar_url}
          isHost={true}
        >
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
            <UserAvatar
              userId={event.created_by}
              displayName={event.creator?.display_name || `User ${event.created_by.slice(-4)}`}
              avatarUrl={event.creator?.avatar_url}
              size="sm"
            />
            <span className="text-sm text-muted-foreground">
              {isHost ? 'Hosted by You' : `Hosted by ${event.creator?.display_name || `User ${event.created_by.slice(-4)}`}`}
            </span>
          </div>
        </UserHoverCard>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Host Actions */}
          {showHostActions && isHost && (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(event)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(event)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Main Action */}
          <Link to={getEventUrl().replace(window.location.origin, '')} className="block">
            <Button className="w-full group/btn">
              View Event Details
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
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
