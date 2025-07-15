import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StarRating } from '@/components/StarRating'
import { toast } from 'sonner'
import { Star, MessageSquare } from 'lucide-react'
import type { Event, EventRating } from '@/types'

interface EventRatingModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onRatingSubmitted?: (rating: EventRating) => void
  existingRating?: EventRating | null
}

export function EventRatingModal({
  event,
  isOpen,
  onClose,
  onRatingSubmitted,
  existingRating
}: EventRatingModalProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0)
  const [feedback, setFeedback] = useState(existingRating?.feedback_text || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating)
      setFeedback(existingRating.feedback_text || '')
    } else {
      setRating(0)
      setFeedback('')
    }
  }, [existingRating, isOpen])

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      // Import the rating service function dynamically to avoid circular imports
      const { submitEventRating } = await import('@/lib/eventRatingService')
      
      const ratingData = await submitEventRating(
        event.id,
        rating,
        feedback.trim() || null
      )

      toast.success(
        existingRating 
          ? 'Rating updated successfully! 🌟' 
          : 'Thanks for rating this event! 🌟'
      )
      
      onRatingSubmitted?.(ratingData)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            {existingRating ? 'Update Your Rating' : 'Rate This Event'}
          </DialogTitle>
          <DialogDescription className="text-base">
            How was "{event.title}"? Your feedback helps other users and the host improve future events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Event Info */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(event.date_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-4">
            <label className="text-sm font-semibold">
              Your Rating *
            </label>
            <div className="flex flex-col items-center gap-4 py-4">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                className="justify-center"
              />
              <div className="text-center">
                {rating === 0 && (
                  <p className="text-sm text-muted-foreground font-medium">
                    Tap a star to rate this event
                  </p>
                )}
                {rating === 1 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p className="text-sm font-semibold text-red-600">Poor Experience</p>
                  </div>
                )}
                {rating === 2 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-sm font-semibold text-orange-600">Below Average</p>
                  </div>
                )}
                {rating === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-semibold text-blue-600">Good Event</p>
                  </div>
                )}
                {rating === 4 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-sm font-semibold text-green-600">Great Experience</p>
                  </div>
                )}
                {rating === 5 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <p className="text-sm font-semibold text-primary">Outstanding! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-4">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Share Your Experience (Optional)
            </label>
            <Textarea
              placeholder="What made this event special? Any suggestions for improvement? Your feedback helps create better experiences..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none border-2 focus:border-primary/50 transition-colors"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">
                Your feedback helps hosts create amazing events
              </span>
              <span className="text-muted-foreground tabular-nums">
                {feedback.length}/500
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {existingRating ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
