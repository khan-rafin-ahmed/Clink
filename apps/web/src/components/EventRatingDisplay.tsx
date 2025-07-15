import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating, StarRatingDisplay } from '@/components/StarRating'
import { EventRatingModal } from '@/components/EventRatingModal'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Star, MessageSquare, Edit, Trash2 } from 'lucide-react'
import {
  getEventRatings,
  getUserEventRating,
  canUserRateEvent,
  hasEventConcluded,
  deleteEventRating
} from '@/lib/eventRatingService'
import type { Event, EventRating } from '@/types'
import { format } from 'date-fns'

interface EventRatingDisplayProps {
  event: Event
  className?: string
}

export function EventRatingDisplay({ event, className }: EventRatingDisplayProps) {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<EventRating[]>([])
  const [userRating, setUserRating] = useState<EventRating | null>(null)
  const [canRate, setCanRate] = useState(false)
  const [eventConcluded, setEventConcluded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showAllRatings, setShowAllRatings] = useState(false)

  useEffect(() => {
    loadRatingData()
  }, [event.id, user])

  const loadRatingData = async () => {
    try {
      setLoading(true)

      // Load all ratings for the event
      const eventRatings = await getEventRatings(event.id)
      setRatings(eventRatings)

      if (user) {
        // Check if user can rate this event
        const canUserRate = await canUserRateEvent(event.id, user.id)
        setCanRate(canUserRate)

        // Get user's existing rating
        const existingRating = await getUserEventRating(event.id)
        setUserRating(existingRating)

        // Check if event has concluded
        const concluded = await hasEventConcluded(event.id)
        setEventConcluded(concluded)
      }
    } catch (error: any) {
      console.error('Error loading rating data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingSubmitted = (newRating: EventRating) => {
    setUserRating(newRating)
    // Update the ratings list
    setRatings(prev => {
      const filtered = prev.filter(r => r.user_id !== newRating.user_id)
      return [newRating, ...filtered]
    })
  }

  const handleDeleteRating = async () => {
    if (!userRating) return

    try {
      await deleteEventRating(event.id)
      setUserRating(null)
      setRatings(prev => prev.filter(r => r.user_id !== user?.id))
      toast.success('Rating deleted successfully')
    } catch (error: any) {
      console.error('Error deleting rating:', error)
      toast.error('Failed to delete rating')
    }
  }

  const displayedRatings = showAllRatings ? ratings : ratings.slice(0, 3)

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">Event Reviews</span>
            </div>
            {user && canRate && eventConcluded && (
              <Button
                variant={userRating ? "outline" : "default"}
                size="sm"
                onClick={() => setShowRatingModal(true)}
                className="gap-2 font-semibold"
              >
                {userRating ? (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Review
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Write Review
                  </>
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Average Rating Display */}
          {event.total_ratings && event.total_ratings > 0 ? (
            <div className="text-center py-6 border-b bg-gradient-to-br from-muted/20 to-muted/5 rounded-lg">
              <StarRatingDisplay
                averageRating={event.average_rating || 0}
                totalRatings={event.total_ratings || 0}
                size="lg"
                variant="detailed"
                className="justify-center"
              />
            </div>
          ) : (
            <div className="text-center py-8 border-b bg-muted/20 rounded-lg">
              <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                <Star className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
              {user && canRate && eventConcluded ? (
                <p className="text-sm text-muted-foreground">
                  Be the first to share your experience!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Reviews will appear after the event concludes
                </p>
              )}
            </div>
          )}

          {/* User's Rating (if exists) */}
          {userRating && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-5 border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/20">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">Your Review</h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRatingModal(true)}
                    className="h-8 px-2 hover:bg-primary/10"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteRating}
                    className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <StarRating rating={userRating.rating} readonly size="md" />
              {userRating.feedback_text && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Your Experience
                  </div>
                  <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                    <p className="text-sm leading-relaxed">
                      {userRating.feedback_text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Ratings */}
          {ratings.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">
                  {userRating ? 'Community Reviews' : 'Recent Reviews'}
                </h4>
                {ratings.length > 3 && !showAllRatings && (
                  <span className="text-sm text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-full">
                    {ratings.length} total
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {displayedRatings
                  .filter(rating => rating.user_id !== user?.id)
                  .map((rating) => (
                    <div key={rating.id} className="bg-card rounded-lg p-4 border border-border/50 hover:border-border transition-colors">
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10 ring-2 ring-muted">
                          <AvatarImage src={rating.user?.avatar_url || ''} />
                          <AvatarFallback className="font-semibold">
                            {rating.user?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="font-semibold text-sm">
                                {rating.user?.display_name || 'Anonymous User'}
                              </span>
                              <StarRating rating={rating.rating} readonly size="sm" />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {format(new Date(rating.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>

                          {rating.feedback_text && (
                            <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                              <p className="text-sm leading-relaxed">
                                {rating.feedback_text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {ratings.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllRatings(!showAllRatings)}
                  className="w-full font-semibold"
                >
                  {showAllRatings ? 'Show Less Reviews' : `Show All ${ratings.length} Reviews`}
                </Button>
              )}
            </div>
          )}

          {/* Rating Prompt for Eligible Users */}
          {user && canRate && eventConcluded && !userRating && (
            <div className="text-center py-6 border-t bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
              <div className="p-3 rounded-full bg-primary/20 w-fit mx-auto mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Share Your Experience</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                You attended this event! Help others by sharing how it went.
              </p>
              <Button
                onClick={() => setShowRatingModal(true)}
                className="gap-2 font-semibold"
                size="lg"
              >
                <Star className="h-4 w-4" />
                Write Your Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Modal */}
      <EventRatingModal
        event={event}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRatingSubmitted={handleRatingSubmitted}
        existingRating={userRating}
      />
    </>
  )
}
