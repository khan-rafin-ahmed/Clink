import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  Clock,
  Wine,
  Music,
  StickyNote
} from 'lucide-react'
import type { Event, RsvpStatus } from '@/types'

interface EventWithRsvps extends Event {
  rsvps: Array<{
    id: string
    status: RsvpStatus
    user_id: string
    users: {
      email: string
    } | null
  }>
}

export function EventDetail() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventWithRsvps | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRsvp, setUserRsvp] = useState<RsvpStatus | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)

  useEffect(() => {
    if (eventCode) {
      loadEvent()
    }
  }, [eventCode])

  const loadEvent = async () => {
    try {
      setLoading(true)

      // For now, treat eventCode as eventId since we don't have event_code column yet
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`
          *,
          rsvps (
            id,
            status,
            user_id,
            users (
              email
            )
          )
        `)
        .eq('id', eventCode)
        .single()

      if (error) {
        console.error('Error loading event:', error)
        toast.error('Event not found')
        navigate('/')
        return
      }

      setEvent(eventData)

      // Check user's RSVP status
      if (user) {
        const userRsvpData = eventData.rsvps?.find(rsvp => rsvp.user_id === user.id)
        setUserRsvp(userRsvpData?.status || null)
      }
    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async (status: RsvpStatus) => {
    if (!user) {
      toast.error('Please log in to RSVP')
      navigate('/login')
      return
    }

    if (!event) return

    try {
      setRsvpLoading(true)

      const { error } = await supabase
        .from('rsvps')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          status,
        }, {
          onConflict: 'event_id,user_id'
        })

      if (error) {
        console.error('Error updating RSVP:', error)
        toast.error('Failed to update RSVP')
        return
      }

      setUserRsvp(status)
      toast.success(`RSVP updated to ${status}!`)

      // Reload event to get updated RSVP counts
      loadEvent()
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast.error('Failed to update RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/event/${eventCode}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy link')
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getDrinkEmoji = (drinkType?: string) => {
    const drinkEmojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥂',
      mixed: '🍹'
    }
    return drinkEmojis[drinkType || ''] || '🍻'
  }

  const getVibeEmoji = (vibe?: string) => {
    const vibeEmojis: Record<string, string> = {
      casual: '😎',
      party: '🎉',
      chill: '🧘',
      wild: '🤪',
      classy: '🎩'
    }
    return vibeEmojis[vibe || ''] || '✨'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">This event doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const { date, time } = formatDateTime(event.date_time)
  const goingCount = event.rsvps?.filter(rsvp => rsvp.status === 'going').length || 0
  const maybeCount = event.rsvps?.filter(rsvp => rsvp.status === 'maybe').length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Event
            </Button>
          </div>

          {/* Event Card */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-display font-bold text-foreground">
                    {getDrinkEmoji(event.drink_type)} {event.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Badge variant={event.is_public ? 'default' : 'secondary'}>
                  {event.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.drink_type && (
                  <div className="flex items-center gap-2">
                    <Wine className="w-5 h-5 text-primary" />
                    <span className="capitalize">{event.drink_type}</span>
                  </div>
                )}
                {event.vibe && (
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="capitalize">{event.vibe} vibe {getVibeEmoji(event.vibe)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{goingCount} going, {maybeCount} maybe</span>
                </div>
              </div>

              {/* Notes */}
              {event.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-primary" />
                    <span className="font-medium">Notes</span>
                  </div>
                  <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                    {event.notes}
                  </p>
                </div>
              )}

              {/* RSVP Buttons */}
              {user && (
                <div className="space-y-3">
                  <h3 className="font-medium">Will you be there?</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={userRsvp === 'going' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('going')}
                      disabled={rsvpLoading}
                      className="flex-1"
                    >
                      ✅ Going
                    </Button>
                    <Button
                      variant={userRsvp === 'maybe' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('maybe')}
                      disabled={rsvpLoading}
                      className="flex-1"
                    >
                      🤔 Maybe
                    </Button>
                    <Button
                      variant={userRsvp === 'not_going' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('not_going')}
                      disabled={rsvpLoading}
                      className="flex-1"
                    >
                      ❌ Can't Make It
                    </Button>
                  </div>
                </div>
              )}

              {!user && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground mb-3">
                    Log in to RSVP and see who's coming!
                  </p>
                  <Button onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                </div>
              )}

              {/* Attendees */}
              {event.rsvps && event.rsvps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Who's Coming</h3>
                  <div className="space-y-2">
                    {['going', 'maybe'].map(status => {
                      const attendees = event.rsvps?.filter(rsvp => rsvp.status === status) || []
                      if (attendees.length === 0) return null

                      return (
                        <div key={status} className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground capitalize">
                            {status === 'going' ? '✅ Going' : '🤔 Maybe'} ({attendees.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {attendees.map(rsvp => (
                              <div key={rsvp.id} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {rsvp.users?.email?.charAt(0).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {rsvp.users?.email?.split('@')[0] || 'Anonymous'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
