import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EventRatingModal } from '@/components/EventRatingModal'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Star, Info, Edit } from 'lucide-react'
import {
  getEventRatings,
  getUserEventRating,
  canUserRateEvent,
  hasEventConcluded,
  deleteEventRating
} from '@/lib/eventRatingService'
import type { Event, EventRating } from '@/types'
import { cn } from '@/lib/utils'

interface ReviewsPanelProps {
  eventName: string
  averageRating: number
  reviewCount: number
  event: Event
  reviews?: EventRating[]
  className?: string
}

export function ReviewsPanel({
  eventName,
  averageRating,
  reviewCount,
  event,
  reviews = [],
  className
}: ReviewsPanelProps) {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<EventRating[]>(reviews)
  const [userRating, setUserRating] = useState<EventRating | null>(null)
  const [canRate, setCanRate] = useState(false)
  const [eventConcluded, setEventConcluded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)

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
    loadRatingData() // Reload to get updated averages
  }

  const handleDeleteRating = async () => {
    if (!userRating) return

    try {
      await deleteEventRating(userRating.id)
      setUserRating(null)
      toast.success('Rating deleted successfully')
      loadRatingData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete rating')
    }
  }

  // Calculate full and half stars for display
  const getStarDisplay = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    return { fullStars, hasHalfStar, emptyStars }
  }

  const { fullStars, hasHalfStar, emptyStars } = getStarDisplay(averageRating)

  return (
    <>
      <div className={cn('bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        {/* Header Bar - Google Reviews Style */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Event Name */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {eventName}
            </h2>

            {/* Rating Display */}
            {reviewCount > 0 ? (
              <div className="flex items-center gap-3">
                {/* Large Average Rating */}
                <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {averageRating.toFixed(1)}
                </span>

                {/* Star Icons */}
                <div className="flex items-center gap-0.5">
                  {/* Full Stars */}
                  {Array.from({ length: fullStars }).map((_, i) => (
                    <Star
                      key={`full-${i}`}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}

                  {/* Half Star */}
                  {hasHalfStar && (
                    <div className="relative">
                      <Star className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                      <div className="absolute inset-0 overflow-hidden w-1/2">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  )}

                  {/* Empty Stars */}
                  {Array.from({ length: emptyStars }).map((_, i) => (
                    <Star
                      key={`empty-${i}`}
                      className="h-5 w-5 text-gray-300 dark:text-gray-600"
                    />
                  ))}
                </div>

                {/* Review Count */}
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>

                {/* Info Icon */}
                <Info className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
              </div>
            ) : null}
          </div>

          {/* Write Review Button */}
          {user && canRate && eventConcluded && (
            <Button
              variant="outline"
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              {userRating ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit review
                </>
              ) : (
                'Write a review'
              )}
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6">
          {reviewCount === 0 ? (
            /* Empty State - Google Reviews Style */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                <Star className="h-8 w-8 text-gray-400 dark:text-gray-500 stroke-2" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            /* Reviews List - Placeholder for now */
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Reviews will be displayed here...
              </p>
            </div>
          )}
        </div>
      </div>

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
