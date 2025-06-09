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

  // Load saved tab from localStorage on mount, but always default to 'upcoming'
  useEffect(() => {
    const savedTab = localStorage.getItem(storageKey)
    if (savedTab && (savedTab === 'upcoming' || savedTab === 'past')) {
      setActiveTab(savedTab)
    } else {
      // Always default to 'upcoming' if no saved preference
      setActiveTab('upcoming')
      localStorage.setItem(storageKey, 'upcoming')
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
        {/* Compact centered tabs instead of full-width */}
        <div className="flex justify-center">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              value="upcoming"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Upcoming</span>
              {showCounts && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  {upcomingEvents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
            >
              <Clock className="h-4 w-4" />
              <span>Past</span>
              {showCounts && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-muted-foreground/10 text-muted-foreground rounded-full">
                  {pastEvents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

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
