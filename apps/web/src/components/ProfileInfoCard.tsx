import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { BadgeIcon } from '@/components/BadgeIcon'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'
import type { UserBadge } from '@/types/badge'

interface ProfileInfoCardProps {
  userProfile: UserProfile | null
  displayName: string
  avatarFallback: string
  userBadges?: UserBadge[]
  className?: string
}

export function ProfileInfoCard({
  userProfile,
  displayName,
  avatarFallback,
  userBadges = [],
  className
}: ProfileInfoCardProps) {
  // Helper function to get drink emoji for display names (returns empty if no drink)
  const getDrinkEmojiForDisplay = (drink: string | null | undefined): string => {
    if (!drink || drink === 'none') {
      return '' // Return empty string for display names when no drink is set
    }

    const drinkMap: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      cocktails: '🍸',
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      tequila: '🥃',
      champagne: '🥂',
      sake: '🍶',
      other: '🍻'
    }

    return drinkMap[drink.toLowerCase()] || '🍻'
  }

  const emoji = getDrinkEmojiForDisplay(userProfile?.favorite_drink)
  const displayNameWithDrink = emoji ? `${displayName} ${emoji}` : displayName

  // Prepare top 4 badges sorted by most recent earned date
  const topBadges = userBadges
    .filter(ub => ub.badge) // Only include badges with badge data
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 4)
  return (
    <div className={cn(
      "glass-modal rounded-3xl p-6 lg:p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-xl",
      className
    )}
    style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
      {/* Glass shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-0 hover:opacity-100 pointer-events-none rounded-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Avatar Section */}
        <div className="text-center">
          <div className="relative group inline-block">
            <Avatar className="w-24 h-24 lg:w-32 lg:h-32 avatar-ring-glow border-4 border-transparent shadow-glass-lg hover-scale-bounce transition-all duration-500 mx-auto">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-white text-3xl lg:text-4xl font-bold backdrop-blur-sm">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            {/* Enhanced Glowing ring effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-2xl scale-110"></div>
            {/* Glass highlight */}

          </div>
        </div>

        {/* User Information */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground text-shadow">
            {displayNameWithDrink}
          </h1>

          {/* Badge Display - 4 most recent badges */}
          {topBadges.length > 0 && (
            <div className="badges-row flex items-center justify-center space-x-4 gap-2 mt-3">
              {topBadges.map(userBadge => (
                <div
                  key={userBadge.id}
                  className="badge-icon w-8 h-8 glass-card backdrop-blur-md rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 border border-white/10 relative group"
                  title={`${userBadge.badge!.name}: ${userBadge.badge!.description}`}
                >
                  <BadgeIcon
                    badge={userBadge.badge!}
                    size="sm"
                    className="w-5 h-5"
                  />

                  {/* Custom tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[10000] whitespace-nowrap">
                    <div className="text-center space-y-1">
                      <h4 className="font-semibold text-white text-sm">{userBadge.badge!.name}</h4>
                      <p className="text-xs text-muted-foreground">{userBadge.badge!.description}</p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1A1A1A]"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {userProfile?.nickname && (
            <p className="text-base lg:text-lg text-yellow-400 font-medium italic">
              aka {userProfile.nickname}
            </p>
          )}
          
          {userProfile?.tagline && (
            <div className="glass-pill inline-block px-4 py-2">
              <p className="text-sm lg:text-base text-primary font-medium italic">
                "{userProfile.tagline}"
              </p>
            </div>
          )}

          {userProfile?.bio && (
            <div className="glass-panel rounded-xl p-4 hover-lift" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
              <p className="text-base text-muted-foreground leading-relaxed max-w-[320px]">
                {userProfile.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
