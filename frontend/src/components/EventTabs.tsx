import { useState, useEffect, ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventTabsProps {
  upcomingEvents: any[]
  pastEvents: any[]
  upcomingContent: ReactNode
  pastContent: ReactNode
  className?: string
  storageKey?: string
  showCounts?: boolean
}

export function EventTabs({
  upcomingEvents,
  pastEvents,
  upcomingContent,
  pastContent,
  className,
  storageKey = 'eventTabs_selectedTab',
  showCounts = true
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('upcoming')

  // Load saved tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem(storageKey)
    if (savedTab && (savedTab === 'upcoming' || savedTab === 'past')) {
      setActiveTab(savedTab)
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
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
          <TabsTrigger 
            value="upcoming" 
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Calendar className="h-4 w-4" />
            <span>Upcoming Events</span>
            {showCounts && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {upcomingEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Clock className="h-4 w-4" />
            <span>Past Events</span>
            {showCounts && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-muted-foreground/10 text-muted-foreground rounded-full">
                {pastEvents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="upcoming" 
          className="mt-6 space-y-4 animate-in fade-in-50 duration-200"
        >
          {upcomingContent}
        </TabsContent>

        <TabsContent 
          value="past" 
          className="mt-6 space-y-4 animate-in fade-in-50 duration-200"
        >
          {pastContent}
        </TabsContent>
      </Tabs>
    </div>
  )
}
