import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Event = {
  id: string
  title: string
  location: string
  date_time: string
  drink_type: string
  vibe: string
  notes: string | null
  created_by: string
  created_at: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  async function loadEvents() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (event: Event) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      setEvents(events.filter(e => e.id !== event.id))
      toast.success('Session deleted!')
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete session')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getVibeEmoji = (vibe: string) => {
    const vibeMap: Record<string, string> = {
      casual: '😎',
      party: '🎉',
      shots: '🥃',
      chill: '🌙',
      wild: '🔥',
      classy: '🥂'
    }
    return vibeMap[vibe] || '🍻'
  }

  const getDrinkEmoji = (drinkType: string) => {
    const drinkMap: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥂',
      mixed: '🍹'
    }
    return drinkMap[drinkType] || '🍻'
  }

  if (!user) {
    navigate('/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Sessions 🍻</h1>
          <p className="text-muted-foreground mt-1">Time to raise some hell with your crew!</p>
        </div>
        <QuickEventModal onEventCreated={loadEvents} />
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
            onEventCreated={loadEvents}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <div key={event.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getDrinkEmoji(event.drink_type)}</span>
                  <span className="text-lg">{getVibeEmoji(event.vibe)}</span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(event)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                {event.title}
              </h3>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>{formatDate(event.date_time)}</span>
                </div>
                {event.notes && (
                  <div className="flex items-start space-x-2 mt-3">
                    <span>📝</span>
                    <span className="text-xs">{event.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}