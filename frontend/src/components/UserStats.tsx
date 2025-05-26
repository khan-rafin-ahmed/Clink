import { useAuth } from '@/lib/auth-context'
import { useUserStats } from '@/hooks/useUserStats'

interface UserStatsProps {
  className?: string
  refreshTrigger?: number
}

export function UserStats({ className, refreshTrigger }: UserStatsProps) {
  const { user } = useAuth()
  const { stats, loading, error } = useUserStats(refreshTrigger)

  if (!user) return null

  const renderStatValue = (value: number, isLoading: boolean, hasError: boolean) => {
    if (hasError) return '—'
    if (isLoading) return '...'
    return value.toString()
  }

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.totalEvents, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">Sessions Created</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>

      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.upcomingEvents, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">Upcoming</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>

      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.totalRSVPs, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">RSVPs</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>
    </div>
  )
}
