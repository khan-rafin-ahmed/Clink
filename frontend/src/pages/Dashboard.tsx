import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { EventTabs } from '@/components/EventTabs'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Edit, Trash2, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { filterEventsByDate } from '@/lib/eventUtils'

type Event = {
  id: string
  title: string
  location: string
  date_time: string
  drink_type: string
  vibe: string
  notes: string | null
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const navigate = useNavigate()

  // Filter events by date
  const { upcoming: upcomingEvents, past: pastEvents } = filterEventsByDate(events)

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

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
  }

  const handleDelete = (event: Event) => {
    setDeletingEvent(event)
  }

  const handleEventUpdated = () => {
    loadEvents()
    setEditingEvent(null)
  }

  const handleEventDeleted = () => {
    loadEvents()
    setDeletingEvent(null)
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

  // Render event cards
  const renderEventCards = (eventList: Event[]) => {
    if (eventList.length === 0) {
      return (
        <div className="text-center py-16 bg-gradient-card rounded-2xl border border-border hover:border-border-hover transition-all duration-300">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-3">No Sessions Found</h3>
          <p className="text-base text-muted-foreground mb-6 px-4 max-w-md mx-auto leading-relaxed">
            Time to create some hell-raising sessions!
          </p>
          <QuickEventModal
            trigger={
              <Button size="lg" className="group hover-glow">
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                🍺 Create Your First Session
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            }
            onEventCreated={loadEvents}
          />
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventList.map(event => (
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
                  onClick={() => handleEdit(event)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(event)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
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
    )
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_70%)] opacity-10"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Consistent Width Container - Matching Profile Page Layout */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">My Sessions 🍻</h1>
          <p className="text-[#B3B3B3] mt-1">Time to raise some hell with your crew!</p>
        </div>
        <QuickEventModal onEventCreated={loadEvents} />
      </div>

      {events.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-16 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl sm:text-4xl">🍺</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">No sessions yet</h2>
            <p className="text-[#B3B3B3] max-w-md mx-auto leading-relaxed">
              Ready to get this party started? Create your first drinking session and invite your crew!
            </p>
          </div>
          <QuickEventModal
            trigger={
              <Button size="lg" className="font-semibold bg-white text-black hover:bg-white/90">
                🍻 Create Your First Session
              </Button>
            }
            onEventCreated={loadEvents}
          />
        </div>
      ) : (
        <EventTabs
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          upcomingContent={renderEventCards(upcomingEvents)}
          pastContent={renderEventCards(pastEvents)}
          storageKey="dashboard_eventTabs"
          className="mt-8"
        />
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Dialog */}
      {deletingEvent && (
        <DeleteEventDialog
          event={deletingEvent}
          open={!!deletingEvent}
          onOpenChange={(open) => !open && setDeletingEvent(null)}
          onEventDeleted={handleEventDeleted}
        />
      )}
      </div>
    </div>
  )
}