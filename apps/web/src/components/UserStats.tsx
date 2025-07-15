import { useAuth } from '@/lib/auth-context'
import { useUserStats } from '@/hooks/useUserStats'
import { useState, useEffect, useRef } from 'react'
import { getUserProfile } from '@/lib/userService'
import type { UserProfile } from '@/types'

interface UserStatsProps {
  className?: string
  refreshTrigger?: number
  userId?: string // Optional userId to view other users' stats
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000, delay: number = 0) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const current = Math.floor(easeOutQuart * end)

        if (current !== countRef.current) {
          countRef.current = current
          setCount(current)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, delay)

    return () => clearTimeout(timer)
  }, [end, duration, delay])

  return count
}

export function UserStats({ className, refreshTrigger, userId }: UserStatsProps) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const { stats, loading, error } = useUserStats(refreshTrigger, targetUserId)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Animated counters with staggered delays
  const animatedTotalEvents = useAnimatedCounter(stats.totalEvents, 1200, hasAnimated ? 0 : 200)
  const animatedTotalRSVPs = useAnimatedCounter(stats.totalRSVPs, 1200, hasAnimated ? 0 : 400)
  const animatedUpcomingEvents = useAnimatedCounter(stats.upcomingEvents, 1200, hasAnimated ? 0 : 600)

  useEffect(() => {
    if (targetUserId) {
      getUserProfile(targetUserId).then(setUserProfile).catch(console.error)
    }
  }, [targetUserId])

  useEffect(() => {
    if (!loading && !error) {
      setHasAnimated(true)
    }
  }, [loading, error])

  if (!targetUserId) return null

  // Get emoji for favorite drink
  const getDrinkEmoji = (drink: string | null | undefined) => {
    if (!drink) return null

    const drinkEmojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥃',
      mixed: '🍹',
      other: '🥤'
    }

    return drinkEmojis[drink.toLowerCase()] || '🥤'
  }



  const favoriteDrink = userProfile?.favorite_drink
  const drinkEmoji = getDrinkEmoji(favoriteDrink)
  const showDrinkStat = favoriteDrink && drinkEmoji

  // Simple loading state
  if (loading) {
    return (
      <div className={`grid ${showDrinkStat ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-4 sm:gap-6 ${className}`}>
        {Array.from({ length: showDrinkStat ? 4 : 3 }).map((_, i) => (
          <div key={i} className="glass-card relative overflow-hidden">
            <div className="p-4 sm:p-6 text-center">
              <div className="h-8 sm:h-10 w-16 mx-auto mb-2 bg-white/10 animate-pulse rounded" />
              <div className="h-4 w-20 mx-auto bg-white/10 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${showDrinkStat ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-4 sm:gap-6 ${className}`}>
      {/* Total Sessions - Glass Card with Shimmer */}
      <div className="glass-card hover-lift-3d glow-on-hover relative overflow-hidden group">
        <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 p-4 sm:p-6 text-center">
          <div className={`text-2xl sm:text-3xl font-bold count-up ${error ? 'text-muted-foreground' : 'text-primary'}`}>
            {error ? '—' : animatedTotalEvents}
          </div>
          <div className="text-sm text-muted-foreground font-medium">Sessions</div>
          {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
        </div>
      </div>

      {/* Total RSVPs - Glass Card with Gold Glow */}
      <div className="glass-card hover-lift-3d glow-gold-hover relative overflow-hidden group">
        <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 p-4 sm:p-6 text-center">
          <div className={`text-2xl sm:text-3xl font-bold count-up ${error ? 'text-muted-foreground' : 'text-accent-secondary'}`}>
            {error ? '—' : animatedTotalRSVPs}
          </div>
          <div className="text-sm text-muted-foreground font-medium">RSVPs</div>
          {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
        </div>
      </div>

      {/* Upcoming Events - Glass Card with Pulse */}
      <div className="glass-card hover-lift-3d glow-on-hover relative overflow-hidden group">
        <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 p-4 sm:p-6 text-center">
          <div className={`text-2xl sm:text-3xl font-bold count-up ${error ? 'text-muted-foreground' : 'text-primary'}`}>
            {error ? '—' : animatedUpcomingEvents}
          </div>
          <div className="text-sm text-muted-foreground font-medium">Upcoming</div>
          {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
        </div>
      </div>

      {/* Favorite Drink - Special Glass Card */}
      {showDrinkStat && (
        <div className="glass-card hover-lift-3d glow-pink-hover relative overflow-hidden group">
          <div className="glass-shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary float">
              {drinkEmoji}
            </div>
            <div className="text-sm text-muted-foreground font-medium capitalize mt-2">
              {favoriteDrink}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
