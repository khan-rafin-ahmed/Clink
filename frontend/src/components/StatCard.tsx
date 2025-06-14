import { cn } from '@/lib/utils'

interface StatCardProps {
  count?: number | string
  label: string
  icon?: string
  className?: string
  loading?: boolean
  error?: boolean
}

export function StatCard({
  count,
  label,
  icon,
  className,
  loading = false,
  error = false
}: StatCardProps) {
  return (
    <div className={cn(
      "glass-card relative overflow-hidden group text-center p-4 sm:p-6",
      className
    )}>
      <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100"></div>
      <div className="relative z-10">
        {icon ? (
          <>
            <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
            <div className="text-sm text-foreground font-medium truncate">{label}</div>
          </>
        ) : (
          <>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold mb-1",
              error ? 'text-muted-foreground' : 'text-primary'
            )}>
              {loading ? '...' : (error ? '—' : count)}
            </div>
            <div className="text-sm text-muted-foreground font-medium">{label}</div>
            {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
          </>
        )}
      </div>
    </div>
  )
}
