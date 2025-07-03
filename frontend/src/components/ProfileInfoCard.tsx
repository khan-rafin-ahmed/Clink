import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'

interface ProfileInfoCardProps {
  userProfile: UserProfile | null
  displayName: string
  avatarFallback: string
  className?: string
}

export function ProfileInfoCard({
  userProfile,
  displayName,
  avatarFallback,
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
