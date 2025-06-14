import { useState, useEffect, ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventTabs } from '@/components/EventTabs'
import { EventTimeline } from '@/components/EventTimeline'
import type { Crew, Event } from '@/types'

interface ActivityTabsProps {
  crews: Crew[]
  crewsContent: ReactNode
  upcomingEvents: Event[]
  pastEvents: Event[]
  onEventEdit?: (event: Event) => void
  onEventDelete?: (event: Event) => void
  className?: string
  storageKey?: string
}

export function ActivityTabs({
  crews,
  crewsContent,
  upcomingEvents,
  pastEvents,
  onEventEdit,
  onEventDelete,
  className,
  storageKey = 'activityTabs_selectedTab'
}: ActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('sessions')

  // Load saved tab from localStorage on mount, but default to 'sessions'
  useEffect(() => {
    const savedTab = localStorage.getItem(storageKey)
    if (savedTab && (savedTab === 'crews' || savedTab === 'sessions')) {
      setActiveTab(savedTab)
    } else {
      // Default to 'sessions' to show events first
      setActiveTab('sessions')
      localStorage.setItem(storageKey, 'sessions')
    }
  }, [storageKey])

  // Save tab selection to localStorage
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(storageKey, value)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Main Activity Tabs */}
        <div className="flex justify-center">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              value="sessions"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {upcomingEvents.length + pastEvents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="crews"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Crews
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent-secondary/10 text-accent-secondary rounded-full">
                {crews.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sessions Tab Content with Timeline Layout */}
        <TabsContent value="sessions" className="mt-6 space-y-0">
          <div className="animate-in fade-in-50 duration-200">
            <EventTabs
              upcomingEvents={upcomingEvents}
              pastEvents={pastEvents}
              upcomingContent={
                <EventTimeline
                  events={upcomingEvents}
                  onEdit={onEventEdit}
                  onDelete={onEventDelete}
                  showEditActions={true}
                  emptyStateTitle="No Upcoming Sessions"
                  emptyStateDescription="Your upcoming drinking sessions will appear here. Create your first session to get started!"
                />
              }
              pastContent={
                <EventTimeline
                  events={pastEvents}
                  onEdit={onEventEdit}
                  onDelete={onEventDelete}
                  showEditActions={true}
                  emptyStateTitle="No Past Sessions"
                  emptyStateDescription="Your completed drinking sessions will appear here after they're finished."
                />
              }
              storageKey={`${storageKey}_eventTabs`}
              showCounts={true}
            />
          </div>
        </TabsContent>

        {/* Crews Tab Content */}
        <TabsContent value="crews" className="mt-6 space-y-0">
          <div className="animate-in fade-in-50 duration-200">
            {crewsContent}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
