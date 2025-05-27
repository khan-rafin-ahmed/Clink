import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareModal } from '@/components/ShareModal'
import { createEventWithShareableLink } from '@/lib/eventService'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export function ShareTest() {
  const { user } = useAuth()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [testEvent, setTestEvent] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)

  const createTestEvent = async () => {
    if (!user) {
      toast.error('Please sign in to create events')
      return
    }

    setIsCreating(true)
    try {
      const eventData = {
        title: 'Test Share Event',
        location: 'Test Location',
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        notes: 'This is a test event for sharing functionality',
        is_public: true
      }

      const result = await createEventWithShareableLink(eventData)
      setTestEvent(result)
      toast.success('Test event created successfully!')
    } catch (error) {
      console.error('Error creating test event:', error)
      toast.error('Failed to create test event')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Share Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <p className="text-muted-foreground">Please sign in to test event creation and sharing.</p>
          )}
          
          {user && !testEvent && (
            <Button 
              onClick={createTestEvent} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating Test Event...' : 'Create Test Event'}
            </Button>
          )}

          {testEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Test Event Created!</h3>
                <p><strong>Event Code:</strong> {testEvent.event_code}</p>
                <p><strong>Share URL:</strong> {testEvent.share_url}</p>
              </div>
              
              <Button 
                onClick={() => setIsShareModalOpen(true)}
                className="w-full"
              >
                Test Share Modal
              </Button>
              
              <Button 
                onClick={() => window.open(testEvent.share_url, '_blank')}
                variant="outline"
                className="w-full"
              >
                Test Share URL
              </Button>
            </div>
          )}

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            title={testEvent?.event?.title || 'Test Event'}
            url={testEvent?.share_url || 'https://example.com'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
