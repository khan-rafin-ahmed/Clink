import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { UserAvatar } from './UserAvatar'
import { ClickableUserAvatar } from './ClickableUserAvatar'
import { UserHoverCard } from './UserHoverCard'
import { LiveBadge } from './LiveBadge'
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
  Clock,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Event } from '@/types'
import { calculateAttendeeCount, getLocationDisplayName } from '@/lib/eventUtils'
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
  variant?: 'default' | 'featured' | 'compact' | 'timeline' | 'grid'
  className?: string
  isUpcoming?: boolean
}

export function EnhancedEventCard({
  event,
  showHostActions = false,
  onEdit,
  onDelete,
  variant = 'default',
  className,
  isUpcoming = false
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

  // Get vibe styling with masculine colors
  const getVibeColor = (vibe?: string) => {
    switch (vibe) {
      case 'party': return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
      case 'chill': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'wild': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'classy': return 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'
      default: return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
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
      <Card className={cn("interactive-card group glass-card border-white/10 hover:border-accent-primary/20", className)}>
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
                  <h3 className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-accent-primary transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatEventTime(event.date_time)}
                    <LiveBadge
                      dateTime={event.date_time}
                      endTime={event.end_time}
                      durationType={event.duration_type}
                    />
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

  if (variant === 'timeline') {
    return (
      <Link to={getEventUrl().replace(window.location.origin, '')} className="block">
        <Card className={cn("event-card w-full max-w-2xl interactive-card group glass-card transition-all duration-300 hover:shadow-white-lg relative overflow-hidden backdrop-blur-sm rounded-xl cursor-pointer", isUpcoming && "border-l-2 border-l-accent-primary", className)} style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
          {/* Glass shimmer overlay */}
          <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        <CardContent className="px-4 py-4 relative z-10">
          {/* Lu.ma-style layout - Always side-by-side */}
          <div className="flex items-start gap-x-4">
            {/* Lu.ma-style Fixed Width Image */}
            <div className="flex-shrink-0">
              <div className="w-[96px] h-[96px] rounded-xl overflow-hidden bg-card-hover">
                {getEventCoverImage(event.cover_image_url, event.vibe) && !imageError ? (
                  <img
                    src={getEventCoverImage(event.cover_image_url, event.vibe)}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-secondary/20 flex items-center justify-center">
                    <span className="text-2xl">{getVibeEmoji(event.vibe)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Content - Main Section */}
            <div className="flex-1 min-w-0">
              {/* Upcoming Session Badge */}
              {isUpcoming && (
                <div className="text-xs uppercase font-bold text-accent-primary mb-1 flex items-center gap-1">
                  🔥 Upcoming Session
                </div>
              )}

              {/* Time and Title Row */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-accent-primary flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatEventTime(event.date_time)}</span>
                  <LiveBadge
                    dateTime={event.date_time}
                    endTime={event.end_time}
                    durationType={event.duration_type}
                  />
                </div>
              </div>

              {/* Title - Always fully visible, no truncation */}
              <h4 className="font-heading text-white text-base font-semibold mb-2 leading-tight">
                {event.title}
              </h4>

              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <div className="truncate">
                  <span className="truncate">
                    {getLocationDisplayName(event)}
                  </span>
                  {event.place_nickname && (
                    <div className="text-xs text-muted-foreground/70 truncate">
                      {event.place_nickname}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row - Attendees and Actions */}
              <div className="flex items-center justify-between">
                {/* Attendee Count and Avatars */}
                <div className="flex items-center gap-2">
                  {/* Enhanced Attendee Avatars - Show at least 3 avatars */}
                  <div className="flex -space-x-1">
                    {/* Host Avatar - Clickable */}
                    <ClickableUserAvatar
                      userId={event.created_by}
                      displayName={event.creator?.display_name}
                      avatarUrl={event.creator?.avatar_url}
                      size="sm"
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-background ring-1 ring-white/20 hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative overflow-hidden">
                        <UserAvatar
                          userId={event.created_by}
                          displayName={event.creator?.display_name}
                          avatarUrl={event.creator?.avatar_url}
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

                {/* Actions and Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tag Pills - Mobile Responsive */}
                  <div className="glass-pill text-white font-medium flex items-center">
                    <span className="text-[#CFCFCF]">{getVibeEmoji(event.vibe)}</span>
                    <span className="text-white font-medium">{event.vibe}</span>
                  </div>
                  <Badge
                    variant={event.is_public ? "default" : "secondary"}
                    size="sm"
                  >
                    {event.is_public ? "Public" : "Private"}
                  </Badge>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-[44px] w-[44px] md:h-6 md:w-6 p-0 hover:bg-bg-glass-hover backdrop-blur-sm flex items-center justify-center">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-modal border-border/50">
                      <DropdownMenuItem asChild>
                        <Link to={getEventUrl().replace(window.location.origin, '')} className="flex items-center">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Event
                      </DropdownMenuItem>
                      {showHostActions && isHost && (
                        <>
                          <DropdownMenuSeparator />
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(event)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(event)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
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
      </Link>
    )
  }

  // Grid View - Modern Fixed Height Cards for Discover Page
  if (variant === 'grid') {
    return (
      <Link to={getEventUrl().replace(window.location.origin, '')} className="block">
        <Card className={cn(
          "interactive-card group overflow-hidden glass-card border-white/10 hover:border-accent-primary/30 relative h-[420px] flex flex-col rounded-xl bg-glass shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer",
          isUpcoming && "border-l-2 border-l-accent-primary",
          className
        )}>
        {/* Image Section - Fixed Height */}
        <div className="relative overflow-hidden h-[180px] rounded-t-xl">
          {getEventCoverImage(event.cover_image_url, event.vibe) && !imageError ? (
            <img
              src={getEventCoverImage(event.cover_image_url, event.vibe)}
              alt={event.title}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                !imageLoaded && "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            getPlaceholderImage()
          )}

          {/* Light gradient overlay for text clarity */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Status badge - top-left outside image */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "glass-pill px-2 py-1 text-xs font-medium backdrop-blur-lg",
              statusBadge.variant === 'default'
                ? "border-accent-primary/50 text-accent-primary"
                : statusBadge.variant === 'secondary'
                ? "border-accent-secondary/50 text-accent-secondary"
                : "border-white/30 text-white"
            )}>
              {statusBadge.text}
            </div>
          </div>
        </div>

        {/* Content Section - Flexible height */}
        <CardContent className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-base font-semibold text-white mb-3 line-clamp-2">
            {event.title}
          </h3>

          {/* Metadata - Grouped vertically with spacing */}
          <div className="space-y-2 mb-4 flex-1">
            {/* Upcoming Session Badge */}
            {isUpcoming && (
              <div className="text-xs uppercase font-bold text-accent-primary mb-2 flex items-center gap-1">
                🔥 Upcoming Session
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatEventTime(event.date_time)}</span>
              <LiveBadge
                dateTime={event.date_time}
                endTime={event.end_time}
                durationType={event.duration_type}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <div className="truncate" title={getLocationDisplayName(event)}>
                <span className="truncate">
                  {getLocationDisplayName(event)}
                </span>
                {event.place_nickname && (
                  <div className="text-xs text-muted-foreground/70 truncate">
                    {event.place_nickname}
                  </div>
                )}
              </div>
            </div>

            {/* Tags - Max 2 tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="glass-pill font-medium flex items-center text-accent-primary">
                {getVibeEmoji(event.vibe)} {event.vibe}
              </div>
              <div className="glass-pill font-medium flex items-center text-muted-foreground">
                <Users className="w-4 h-4" />
                {displayCount}
              </div>
            </div>
          </div>

          {/* CTA Button - Full width */}
          <div className="mt-auto">
            <Button className="w-full btn-secondary glass-effect hover:bg-white/10 transition-all duration-300">
              View Event Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
      </Link>
    )
  }

  const isFeatured = variant === 'featured'

  return (
    <Link to={getEventUrl().replace(window.location.origin, '')} className="block">
      <Card className={cn(
        "interactive-card group overflow-hidden glass-card floating-tile border-white/10 hover:border-accent-primary/30 relative cursor-pointer",
        isFeatured && "ring-2 ring-primary/20 shadow-white",
        className
      )}>
      {/* Floating Glass Overlay */}
      <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Hero Image Section with Enhanced Blur Overlay */}
      <div className={cn(
        "relative overflow-hidden",
        isFeatured ? "h-48 sm:h-56" : "h-40 sm:h-48"
      )}>
        {getEventCoverImage(event.cover_image_url, event.vibe) && !imageError ? (
          <img
            src={getEventCoverImage(event.cover_image_url, event.vibe)}
            alt={event.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-sm",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          getPlaceholderImage()
        )}

        {/* Enhanced Overlay with Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
        <div className="absolute inset-0 backdrop-blur-[1px] group-hover:backdrop-blur-sm transition-all duration-500" />

        {/* Top Badges - Enhanced Glass Pills */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className={cn(
            "glass-pill px-2 py-1 text-xs font-medium backdrop-blur-lg",
            statusBadge.variant === 'default'
              ? "border-accent-primary/50 text-accent-primary"
              : statusBadge.variant === 'secondary'
              ? "border-accent-secondary/50 text-accent-secondary"
              : "border-white/30 text-white"
          )}>
            {statusBadge.text}
          </div>
          {isFeatured && (
            <div className="glass-pill px-2 py-1 text-xs font-medium backdrop-blur-lg border-amber-500/50 text-amber-500 pill-glow">
              ⭐ Featured
            </div>
          )}
        </div>

        {/* Share Button */}
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsShareModalOpen(true)
          }}
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
          <div className="glass-pill px-2 py-1 flex items-center gap-2 text-white text-sm font-medium backdrop-blur-lg border-white/30">
            <Calendar className="w-4 h-4 clock-tick" />
            {formatEventTime(event.date_time)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 sm:p-6">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <div className="truncate" title={getLocationDisplayName(event)}>
            <span className="truncate">
              {getLocationDisplayName(event)}
            </span>
            {event.place_nickname && (
              <div className="text-xs text-muted-foreground/70 truncate">
                {event.place_nickname}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.notes && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.notes}
          </p>
        )}

        {/* Vibe and Stats - Enhanced Glass Pills */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={cn(
              "glass-pill font-medium flex items-center",
              getVibeColor(event.vibe).includes('primary')
                ? "text-accent-primary"
                : "text-accent-secondary"
            )}>
              {getVibeEmoji(event.vibe)} {event.vibe}
            </div>
            <div className="glass-pill font-medium flex items-center text-muted-foreground">
              {getDrinkIcon()}
              <span className="capitalize">{event.drink_type}</span>
            </div>
          </div>
          <div className="glass-pill font-medium flex items-center text-blue-400">
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
          <div className="flex items-center gap-2 mb-4 p-2 glass-effect rounded-lg hover:bg-glass-hover transition-colors cursor-pointer">
            <ClickableUserAvatar
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
          {/* Host Actions - Enhanced Glass Buttons */}
          {showHostActions && isHost && (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(event)
                  }}
                  className="flex-1 glass-ripple hover-lift transition-all duration-300 bg-accent-secondary/10 border-accent-secondary/30 hover:bg-accent-secondary/20"
                >
                  <Edit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(event)
                  }}
                  className="flex-1 glass-ripple hover-lift transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Delete
                </Button>
              )}
            </div>
          )}

          {/* Main Action - Enhanced Glass Button */}
          <div className="block">
            <Button className="w-full group/btn glass-ripple hover-lift bg-gradient-primary hover:shadow-white-lg transition-all duration-300">
              View Event Details
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-2 group-hover/btn:scale-110 transition-all duration-300" />
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
    </Link>
  )
}
