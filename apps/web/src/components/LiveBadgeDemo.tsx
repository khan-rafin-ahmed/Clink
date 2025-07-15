import { LiveBadge } from './LiveBadge'

export function LiveBadgeDemo() {
  const now = new Date()
  
  // Create test events with different timing statuses
  const liveEvent = {
    // Event started 1 hour ago and ends in 2 hours
    dateTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    durationType: 'specific_time'
  }
  
  const futureEvent = {
    // Event starts in 2 hours
    dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    durationType: 'specific_time'
  }
  
  const pastEvent = {
    // Event ended 1 hour ago
    dateTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    durationType: 'specific_time'
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-white">LiveBadge Demo</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">Live Event (should show LIVE badge)</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Started 1 hour ago, ends in 2 hours</span>
            <LiveBadge 
              dateTime={liveEvent.dateTime}
              endTime={liveEvent.endTime}
              durationType={liveEvent.durationType}
            />
          </div>
        </div>
        
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">Future Event (no badge)</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Starts in 2 hours</span>
            <LiveBadge 
              dateTime={futureEvent.dateTime}
              endTime={futureEvent.endTime}
              durationType={futureEvent.durationType}
            />
          </div>
        </div>
        
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">Past Event (no badge)</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Ended 1 hour ago</span>
            <LiveBadge 
              dateTime={pastEvent.dateTime}
              endTime={pastEvent.endTime}
              durationType={pastEvent.durationType}
            />
          </div>
        </div>
        
        <div className="p-4 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">All Night Event (should show LIVE badge if started today)</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Started 1 hour ago, all night event</span>
            <LiveBadge 
              dateTime={new Date(now.getTime() - 60 * 60 * 1000).toISOString()}
              durationType="all_night"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-card rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-2">Badge Styling Test</h3>
        <div className="flex items-center gap-4">
          <LiveBadge 
            dateTime={liveEvent.dateTime}
            endTime={liveEvent.endTime}
            durationType={liveEvent.durationType}
          />
          <span className="text-sm text-muted-foreground">
            Orange glow with pulse animation
          </span>
        </div>
      </div>
    </div>
  )
}
