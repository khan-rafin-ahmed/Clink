import { useState } from 'react'
import { UserAvatar } from './UserAvatar'
// import { FollowButton } from './FollowButton' // Removed - using Crew System now
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { getUserProfile } from '@/lib/userService'
import { getInnerCircleCount } from '@/lib/followService'
import { Calendar, Users, Crown } from 'lucide-react'
import type { UserProfile } from '@/types'

interface UserHoverCardProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
  children: React.ReactNode
  isHost?: boolean
  className?: string
}

export function UserHoverCard({
  userId,
  displayName,
  avatarUrl,
  children,
  isHost = false,
  className = ''
}: UserHoverCardProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [innerCircleCount, setInnerCircleCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Don't show hover card for own profile
  if (user?.id === userId) {
    return <>{children}</>
  }

  const loadUserData = async () => {
    if (isLoading || profile) return

    setIsLoading(true)
    try {
      const [userProfile, circleCount] = await Promise.all([
        getUserProfile(userId),
        getInnerCircleCount(userId)
      ])

      setProfile(userProfile)
      setInnerCircleCount(circleCount)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !profile) {
      loadUserData()
    }
  }

  const getDisplayName = () => {
    return profile?.display_name || displayName || 'Anonymous'
  }

  const getFavoriteDrink = () => {
    if (!profile?.favorite_drink) return null

    const drinkEmojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      cocktail: '🍸',
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      tequila: '🥃',
      other: '🍻'
    }

    const drinkLabels: Record<string, string> = {
      beer: 'Beer',
      wine: 'Wine',
      cocktail: 'Cocktails',
      whiskey: 'Whiskey',
      vodka: 'Vodka',
      rum: 'Rum',
      gin: 'Gin',
      tequila: 'Tequila',
      other: 'Mixed Drinks'
    }

    return {
      emoji: drinkEmojis[profile.favorite_drink] || '🍻',
      label: drinkLabels[profile.favorite_drink] || 'Drinks'
    }
  }

  const favoriteDrink = getFavoriteDrink()

  return (
    <HoverCard open={isOpen} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        <div className={`cursor-pointer relative inline-block ${className}`}>
          {children}
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-80" side="bottom" align="center">
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <UserAvatar
                  userId={userId}
                  displayName={getDisplayName()}
                  avatarUrl={profile?.avatar_url || avatarUrl}
                  size="lg"
                />
                {isHost && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                    <Crown className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground truncate">
                    {getDisplayName()}
                  </h4>
                  {isHost && (
                    <Badge variant="secondary" className="text-xs">
                      Host
                    </Badge>
                  )}
                </div>

                {/* Favorite Drink */}
                {favoriteDrink && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <span>{favoriteDrink.emoji}</span>
                    <span>Loves {favoriteDrink.label}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{innerCircleCount} Inner Circle</span>
                  </div>
                  {profile?.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Since {new Date(profile.created_at).getFullYear()}</span>
                    </div>
                  )}
                </div>

                {/* Crew System - Follow button removed */}
                {user && (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    Crew System Active
                  </Button>
                )}

                {!user && (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    Sign in to Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && !profile && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  )
}
