import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { getUserAccessibleEvents } from '@/lib/eventService'
import { updateRsvp } from '@/lib/eventService'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, Globe, Lock, Users, Calendar, MapPin } from 'lucide-react'
import type { Event, RsvpStatus } from '@/types'

export function Events() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingRsvp, setUpdatingRsvp] = useState<string | null>(null)

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
      return
    }
    if (user) {
      loadEvents()
    }
  }, [user, authLoading, navigate])

  const loadEvents = async () => {
    try {
      const data = await getUserAccessibleEvents()
      setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleRsvpUpdate = async (eventId: string, status: RsvpStatus) => {
    if (!user) return

    setUpdatingRsvp(eventId)
    try {
      // Optimistic update - update UI immediately
      setEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.id === eventId) {
            const updatedRsvps = event.rsvps?.filter(r => r.user_id !== user.id) || []
            updatedRsvps.push({ id: 'temp', status, user_id: user.id, users: null })
            return { ...event, rsvps: updatedRsvps }
          }
          return event
        })
      )

      await updateRsvp(eventId, user.id, status)
      toast.success(`RSVP updated to ${status}!`)
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast.error('Failed to update RSVP')
      // Revert optimistic update on error
      await loadEvents()
    } finally {
      setUpdatingRsvp(null)
    }
  }

  const getDrinkEmoji = (drinkType: string) => {
    const emojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥂',
      mixed: '🍹'
    }
    return emojis[drinkType] || '🍻'
  }

  const getVibeEmoji = (vibe: string) => {
    const emojis: Record<string, string> = {
      casual: '😎',
      party: '🎉',
      shots: '🥃',
      chill: '🌙',
      wild: '🔥',
      classy: '🥂'
    }
    return emojis[vibe] || '😎'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Discover Sessions 🍻</h1>
        <p className="text-muted-foreground mt-1">Find drinking sessions to join</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">No sessions found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              No public sessions available right now. Check back later or create your own!
            </p>
          </div>
          <Button onClick={() => navigate('/my-sessions')} size="lg" className="font-semibold">
            🍻 Create a Session
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => {
            const userRsvp = event.rsvps?.find(r => r.user_id === user.id)
            const rsvpCounts = {
              going: event.rsvps?.filter(r => r.status === 'going').length ?? 0,
              maybe: event.rsvps?.filter(r => r.status === 'maybe').length ?? 0,
              not_going: event.rsvps?.filter(r => r.status === 'not_going').length ?? 0,
            }

            return (
              <div key={event.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getDrinkEmoji(event.drink_type || 'beer')}</span>
                    <span className="text-lg">{getVibeEmoji(event.vibe || 'casual')}</span>
                    {event.is_public ? (
                      <Globe className="w-4 h-4 text-green-500" title="Public Event" />
                    ) : (
                      <Lock className="w-4 h-4 text-orange-500" title="Private Event" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="text-primary hover:text-primary/80"
                  >
                    View Details
                  </Button>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(event.date_time), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{rsvpCounts.going} going, {rsvpCounts.maybe} maybe</span>
                  </div>
                </div>

                {event.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
                    {event.notes}
                  </p>
                )}

                {/* RSVP Section */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your RSVP:</span>
                    <Select
                      value={userRsvp?.status || ''}
                      onValueChange={(value) => handleRsvpUpdate(event.id, value as RsvpStatus)}
                      disabled={updatingRsvp === event.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="RSVP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="going">🍻 Going</SelectItem>
                        <SelectItem value="maybe">🤔 Maybe</SelectItem>
                        <SelectItem value="not_going">❌ Can't go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
