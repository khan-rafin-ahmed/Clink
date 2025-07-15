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
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto">
            <TabsTrigger
              value="upcoming"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1C1817] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 min-h-[36px] flex-1"
            >
              <Calendar className="w-5 h-5" />
              <span>Upcoming</span>
              {showCounts && (
                <span className="px-2 py-0.5 text-xs bg-white/10 text-white rounded-full font-medium">
                  {upcomingEvents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1C1817] data-[state=active]:text-white data-[state=active]:shadow-sm gap-2 min-h-[36px] flex-1"
            >
              <Clock className="w-5 h-5" />
              <span>Past</span>
              {showCounts && (
                <span className="px-2 py-0.5 text-xs bg-white/10 text-white rounded-full font-medium">
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
