import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'

interface SimpleUserStatsProps {
  className?: string
}

export function SimpleUserStats({ className }: SimpleUserStatsProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRSVPs: 0
  })

  useEffect(() => {
    if (user) {
      // For now, just show placeholder stats
      // We'll implement real stats once the resource issue is resolved
      setStats({
        totalEvents: 0,
        upcomingEvents: 0,
        totalRSVPs: 0
      })
    }
  }, [user])

  if (!user) return null

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="bg-card rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-primary">
          {stats.totalEvents}
        </div>
        <div className="text-sm text-muted-foreground">Sessions Created</div>
      </div>

      <div className="bg-card rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-primary">
          {stats.upcomingEvents}
        </div>
        <div className="text-sm text-muted-foreground">Upcoming</div>
      </div>

      <div className="bg-card rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-primary">
          {stats.totalRSVPs}
        </div>
        <div className="text-sm text-muted-foreground">RSVPs</div>
      </div>
    </div>
  )
}
