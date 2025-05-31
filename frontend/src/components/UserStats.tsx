import { useAuth } from '@/lib/auth-context'
import { useUserStats } from '@/hooks/useUserStats'
import { useState, useEffect } from 'react'
import { getUserProfile } from '@/lib/userService'
import type { UserProfile } from '@/types'

interface UserStatsProps {
  className?: string
  refreshTrigger?: number
  userId?: string // Optional userId to view other users' stats
}

export function UserStats({ className, refreshTrigger, userId }: UserStatsProps) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const { stats, loading, error } = useUserStats(refreshTrigger, targetUserId)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (targetUserId) {
      getUserProfile(targetUserId).then(setUserProfile).catch(console.error)
    }
  }, [targetUserId])

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

  const renderStatValue = (value: number, isLoading: boolean, hasError: boolean) => {
    if (hasError) return '—'
    if (isLoading) return '...'
    return value.toString()
  }

  const favoriteDrink = userProfile?.favorite_drink
  const drinkEmoji = getDrinkEmoji(favoriteDrink)
  const showDrinkStat = favoriteDrink && drinkEmoji

  return (
    <div className={`grid ${showDrinkStat ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-4 ${className}`}>
      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.totalEvents, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">Sessions</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>

      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.totalRSVPs, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">RSVPs</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>

      <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
        <div className={`text-2xl font-bold ${error ? 'text-muted-foreground' : 'text-primary'}`}>
          {renderStatValue(stats.upcomingEvents, loading, !!error)}
        </div>
        <div className="text-sm text-muted-foreground">Upcoming</div>
        {error && <div className="text-xs text-destructive mt-1">Failed to load</div>}
      </div>

      {showDrinkStat && (
        <div className="bg-card rounded-lg p-4 text-center border border-border hover:border-primary/20 transition-colors">
          <div className="text-2xl font-bold text-primary">
            {drinkEmoji}
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {favoriteDrink}
          </div>
        </div>
      )}
    </div>
  )
}
