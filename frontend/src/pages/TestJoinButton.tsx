import { useState, useEffect } from 'react'
import { JoinEventButton } from '@/components/JoinEventButton'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function TestJoinButton() {
  const { user } = useAuth()
  const [isJoined, setIsJoined] = useState(false)
  const [realEvent, setRealEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Try to get a real event from the database for testing
  useEffect(() => {
    const fetchRealEvent = async () => {
      try {
        // Get the first public event that's not past
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_public', true)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true })
          .limit(1)

        if (error) {
          console.error('Error fetching events:', error)
          // Fall back to mock event
          setRealEvent(mockEvent)
        } else if (events && events.length > 0) {
          setRealEvent(events[0])
          console.log('Using real event for testing:', events[0])
        } else {
          // No real events found, use mock
          setRealEvent(mockEvent)
          console.log('No real events found, using mock event')
        }
      } catch (error) {
        console.error('Error in fetchRealEvent:', error)
        setRealEvent(mockEvent)
      } finally {
        setLoading(false)
      }
    }

    fetchRealEvent()
  }, [])

  // Mock event data (fallback)
  const mockEvent = {
    id: 'test-event-123',
    title: 'Test Event for Join Button (Mock)',
    date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    created_by: 'different-user-id', // Not the current user
    is_public: true
  }

  const event = realEvent || mockEvent

  const isHost = user && event.created_by === user.id
  const isPastEvent = new Date(event.date_time) < new Date()
  const isRealEvent = event.id !== 'test-event-123'

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading test event...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Join Button Test Page</h1>
          <p className="text-[#B3B3B3]">
            This page tests the join button functionality across different states
          </p>
          {isRealEvent ? (
            <div className="mt-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">✅ Using real event from database</p>
            </div>
          ) : (
            <div className="mt-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">⚠️ Using mock event (database calls will fail)</p>
            </div>
          )}
        </div>

        {/* User Status */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current User Status</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Authenticated:</span> {user ? 'Yes' : 'No'}
            </p>
            {user && (
              <p className="text-[#B3B3B3]">
                <span className="text-white font-medium">User ID:</span> {user.id}
              </p>
            )}
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Is Host:</span> {isHost ? 'Yes' : 'No'}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Is Past Event:</span> {isPastEvent ? 'Yes' : 'No'}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Is Joined:</span> {isJoined ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Event Info */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {isRealEvent ? 'Real Event Details' : 'Mock Event Details'}
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Title:</span> {event.title}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Date:</span> {new Date(event.date_time).toLocaleString()}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Event ID:</span> {event.id}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Created By:</span> {event.created_by}
            </p>
            <p className="text-[#B3B3B3]">
              <span className="text-white font-medium">Public:</span> {event.is_public ? 'Yes' : 'No'}
            </p>
            {event.location && (
              <p className="text-[#B3B3B3]">
                <span className="text-white font-medium">Location:</span> {event.location}
              </p>
            )}
            {event.notes && (
              <p className="text-[#B3B3B3]">
                <span className="text-white font-medium">Notes:</span> {event.notes}
              </p>
            )}
          </div>
        </div>

        {/* Join Button Test - Mobile Layout */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Mobile Layout Test</h2>
          <p className="text-[#B3B3B3] mb-4 text-sm">
            This simulates how the join button appears on mobile devices
          </p>
          
          {!isPastEvent && !isHost && (
            <div className="glass-card rounded-xl p-4 shadow-sm">
              <JoinEventButton
                eventId={event.id}
                initialJoined={isJoined}
                onJoinChange={(joined) => {
                  setIsJoined(joined)
                  console.log('Join status changed:', joined)
                  if (isRealEvent) {
                    toast.success(joined ? 'Successfully joined event!' : 'Successfully left event!')
                  } else {
                    toast.error('This is a mock event - database operations will fail')
                  }
                }}
                className="w-full text-lg font-bold"
                size="lg"
              />

              {!user && (
                <p className="text-sm text-[#B3B3B3] text-center mt-3">
                  Sign in to join this legendary session! 🤘
                </p>
              )}
            </div>
          )}

          {isHost && (
            <div className="glass-card rounded-xl p-4 shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-lg">👑</span>
                <span className="font-bold text-white">You're hosting this session!</span>
              </div>
              <p className="text-[#B3B3B3] text-sm">
                Share the event link to invite more legends 🎉
              </p>
            </div>
          )}

          {isPastEvent && (
            <div className="glass-card rounded-xl p-4 shadow-sm">
              <div className="text-center">
                <div className="text-3xl mb-2">😢</div>
                <h3 className="font-semibold text-white mb-1">This event has passed!</h3>
                <p className="text-[#B3B3B3] text-sm">
                  Join future events to be part of the action! 🍻
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Join Button Test - Desktop Layout */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Desktop Layout Test</h2>
          <p className="text-[#B3B3B3] mb-4 text-sm">
            This simulates how the join button appears on desktop devices
          </p>
          
          {!isPastEvent && !isHost && (
            <div className="flex justify-center">
              <JoinEventButton
                eventId={event.id}
                initialJoined={isJoined}
                onJoinChange={(joined) => {
                  setIsJoined(joined)
                  console.log('Join status changed:', joined)
                  if (isRealEvent) {
                    toast.success(joined ? 'Successfully joined event!' : 'Successfully left event!')
                  } else {
                    toast.error('This is a mock event - database operations will fail')
                  }
                }}
                className="px-8 py-3"
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-sm text-[#B3B3B3]">
            <p>1. <span className="text-white font-medium">Without Authentication:</span> Button should show "Sign in to Join" and redirect to login when clicked</p>
            <p>2. <span className="text-white font-medium">With Authentication:</span> Button should show "Join the Party" and allow joining/leaving</p>
            <p>3. <span className="text-white font-medium">Mobile Touch:</span> On mobile, touch the "Joined" button to see "Leave Event" text</p>
            <p>4. <span className="text-white font-medium">Desktop Hover:</span> On desktop, hover over "Joined" button to see "Leave Event" text</p>
            <p>5. <span className="text-white font-medium">Leave Functionality:</span> Click/tap "Leave Event" to leave the event</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Information</h2>
          <pre className="text-xs text-[#B3B3B3] bg-black/20 p-4 rounded-lg overflow-auto">
            {JSON.stringify({
              user: user ? { id: user.id, email: user.email } : null,
              event: {
                id: event.id,
                title: event.title,
                created_by: event.created_by,
                is_public: event.is_public,
                date_time: event.date_time
              },
              isRealEvent,
              isHost,
              isPastEvent,
              isJoined,
              showJoinButton: !isPastEvent && !isHost
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
