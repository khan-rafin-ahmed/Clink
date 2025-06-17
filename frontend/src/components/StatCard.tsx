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
      "glass-card relative overflow-hidden group text-center p-4 sm:p-6 bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-lg cursor-pointer",
      className
    )} style={{
      border: '1px solid hsla(0,0%,100%,.06)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100"></div>
      <div className="relative z-10">
        {icon ? (
          <>
            <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
            <div className={cn(
              "text-sm font-medium truncate",
              className?.includes('text-[#999999]') ? 'text-[#999999]' : 'text-foreground'
            )}>{label}</div>
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
