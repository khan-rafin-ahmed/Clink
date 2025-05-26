import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useAllSessions } from '@/hooks/useAllSessions'
import { QuickEventModal } from '@/components/QuickEventModal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, Globe, Lock, Users, Calendar, MapPin } from 'lucide-react'
import type { Event } from '@/types'

export function MyEvents() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Use the cached hook instead of manual data fetching
  const { sessions: events, loading, error } = useAllSessions('all', refreshTrigger)

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
      return
    }
  }, [user, authLoading, navigate])

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error('Failed to load events')
    }
  }, [error])

  const handleEventCreated = () => {
    // Trigger a refresh by updating the refresh trigger
    setRefreshTrigger(prev => prev + 1)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Sessions 🍻</h1>
          <p className="text-muted-foreground mt-1">Manage your drinking sessions</p>
        </div>
        <QuickEventModal onEventCreated={handleEventCreated} />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍺</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">No sessions yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ready to get this party started? Create your first drinking session and invite your crew!
            </p>
          </div>
          <QuickEventModal
            trigger={
              <Button size="lg" className="font-semibold">
                🍻 Create Your First Session
              </Button>
            }
            onEventCreated={handleEventCreated}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
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
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="text-primary hover:text-primary/80"
                  >
                    View
                  </Button>
                </div>
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
                {event.rsvps && event.rsvps.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{event.rsvps.filter(r => r.status === 'going').length} going</span>
                  </div>
                )}
              </div>

              {event.notes && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {event.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
