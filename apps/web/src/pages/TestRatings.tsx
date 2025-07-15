import { useState } from 'react'
import { StarRating, StarRatingDisplay } from '@/components/StarRating'
import { EventRatingModal } from '@/components/EventRatingModal'
import { ReviewsPanel } from '@/components/ReviewsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock event data for testing
const mockEvent = {
  id: 'test-event-id',
  title: 'Test Drinking Session',
  date_time: new Date().toISOString(),
  location: 'Test Location',
  created_by: 'test-user-id',
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  notes: 'This is a test event for rating functionality',
  average_rating: 4.2,
  total_ratings: 15
}

export function TestRatings() {
  const [rating, setRating] = useState(0)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Google Reviews Style Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Testing the new ReviewsPanel component with Google Reviews styling
          </p>
        </div>

        {/* New Google Reviews Style Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Google Reviews Style Panel</h2>

          {/* With Reviews */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">With Reviews (4.4 rating, 737 reviews)</h3>
            <ReviewsPanel
              eventName="Loki Restaurant & Bar"
              averageRating={4.4}
              reviewCount={737}
              event={mockEvent}
            />
          </div>

          {/* Empty State */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Empty State (No reviews yet)</h3>
            <ReviewsPanel
              eventName="New Event - No Reviews"
              averageRating={0}
              reviewCount={0}
              event={mockEvent}
            />
          </div>

          {/* Different Rating Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">High Rating (4.8)</h3>
              <ReviewsPanel
                eventName="Amazing Cocktail Night"
                averageRating={4.8}
                reviewCount={156}
                event={mockEvent}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Half Star (3.5)</h3>
              <ReviewsPanel
                eventName="Mixed Reviews Event"
                averageRating={3.5}
                reviewCount={42}
                event={mockEvent}
              />
            </div>
          </div>
        </div>

        {/* Interactive Star Rating */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Star Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rate this test (click stars):</label>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                Current rating: {rating} stars
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Star Ratings */}
        <Card>
          <CardHeader>
            <CardTitle>Modern Rating Display Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Compact Style</h4>
                <StarRatingDisplay
                  averageRating={4.5}
                  totalRatings={23}
                  size="sm"
                  variant="compact"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Default Style</h4>
                <StarRatingDisplay
                  averageRating={3.8}
                  totalRatings={12}
                  size="md"
                  variant="default"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Detailed Style</h4>
                <StarRatingDisplay
                  averageRating={4.2}
                  totalRatings={156}
                  size="lg"
                  variant="detailed"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">No Ratings</h4>
                <StarRatingDisplay
                  averageRating={0}
                  totalRatings={0}
                  size="md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Modal Test */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Modal Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowModal(true)}>
              Open Rating Modal
            </Button>
          </CardContent>
        </Card>

        {/* Readonly Star Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Readonly Star Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">1 Star</p>
                <StarRating rating={1} readonly size="md" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">2.5 Stars</p>
                <StarRating rating={2.5} readonly size="md" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">5 Stars</p>
                <StarRating rating={5} readonly size="md" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Rating Modal */}
        <EventRatingModal
          event={mockEvent}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRatingSubmitted={(rating) => {
            console.log('Rating submitted:', rating)
            setShowModal(false)
          }}
        />
      </div>
    </div>
  )
}
