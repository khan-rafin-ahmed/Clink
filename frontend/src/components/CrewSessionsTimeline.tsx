import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventTabs } from '@/components/EventTabs'
import { EventTimeline } from '@/components/EventTimeline'
import { Calendar, PartyPopper } from 'lucide-react'
import { getEventsByCrewId } from '@/lib/eventService'
import { filterEventsByDate } from '@/lib/eventUtils'
import type { Event } from '@/types'

interface CrewSessionsTimelineProps {
  crewId: string
  className?: string
}

export function CrewSessionsTimeline({ crewId, className }: CrewSessionsTimelineProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!crewId) return
    getEventsByCrewId(crewId)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [crewId])

  const { upcoming, past } = filterEventsByDate(events)

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!events.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PartyPopper className="w-12 h-12 text-[#CFCFCF] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Sessions Yet</h3>
            <p className="text-[#B3B3B3]">This crew hasn't hosted any sessions yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`glass-card ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          Sessions ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EventTabs
          upcomingEvents={upcoming}
          pastEvents={past}
          upcomingContent={<EventTimeline events={upcoming} showEditActions={false} />}
          pastContent={<EventTimeline events={past} showEditActions={false} />}
          storageKey={`crewSessions_${crewId}`}
        />
      </CardContent>
    </Card>
  )
}
