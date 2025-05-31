import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { getUserProfile, getFollowCounts } from '@/lib/userService'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
// import { FollowButton } from '@/components/FollowButton' // Removed - using Crew System now
import { getInnerCircleCount } from '@/lib/followService'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { ProfilePageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'

// Helper functions for drink display
function getDrinkEmoji(drinkType: string): string {
  const drinkEmojis: Record<string, string> = {
    beer: '🍺',
    wine: '🍷',
    cocktails: '🍸',
    whiskey: '🥃',
    vodka: '🍸',
    rum: '🍹',
    tequila: '🥃',
    gin: '🍸',
    champagne: '🥂',
    sake: '🍶',
    other: '🍻'
  }
  return drinkEmojis[drinkType] || '🍻'
}

function getDrinkLabel(drinkType: string): string {
  const drinkLabels: Record<string, string> = {
    beer: 'Beer',
    wine: 'Wine',
    cocktails: 'Cocktails',
    whiskey: 'Whiskey',
    vodka: 'Vodka',
    rum: 'Rum',
    tequila: 'Tequila',
    gin: 'Gin',
    champagne: 'Champagne',
    sake: 'Sake',
    other: 'Other'
  }
  return drinkLabels[drinkType] || 'Other'
}

// Data loading function (outside component for stability)
const loadProfileData = async (_user: any, userId: string) => {
  try {
    const [profileData, countsData, innerCircleCountData] = await Promise.all([
      getUserProfile(userId),
      getFollowCounts(userId),
      getInnerCircleCount(userId)
    ])

    return {
      profile: profileData,
      followCounts: countsData,
      innerCircleCount: innerCircleCountData
    }
  } catch (error) {
    throw error
  }
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const { goBackSmart } = useSmartNavigation()

  // STRONGEST GUARD: Validate userId from URL params
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Invalid Profile URL</h2>
          <Button onClick={goBackSmart}>Back</Button>
        </div>
      </div>
    )
  }

  // Create stable fetch function
  const fetchProfileData = useCallback(async (user: any) => {
    return loadProfileData(user, userId)
  }, [userId])

  // Use strengthened auth-dependent data hook
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch
  } = useAuthDependentData(fetchProfileData, {
    requireAuth: false, // Profile viewing doesn't require auth
    onError: () => toast.error('Failed to load profile')
  })

  // Show loading skeleton while auth or data is loading
  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  // Show error fallback if there's an error
  if (isError) {
    return (
      <ErrorFallback
        error={String(error || 'Unknown error')}
        onRetry={refetch}
        title="Failed to Load Profile"
        description="There was a problem loading this profile. Please try again."
      />
    )
  }

  // Show not found if no profile data
  if (!profileData?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h2>
          <Button onClick={goBackSmart}>Back</Button>
        </div>
      </div>
    )
  }

  const { profile, followCounts, innerCircleCount } = profileData
  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-card rounded-xl p-8 border border-border">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
              {profile.display_name?.charAt(0)?.toUpperCase() || '🍻'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {profile.display_name || 'Anonymous User'}
            </h1>
            {profile.bio && (
              <p className="text-muted-foreground mb-4">{profile.bio}</p>
            )}

            {profile.favorite_drink && profile.favorite_drink !== 'none' && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                  {getDrinkEmoji(profile.favorite_drink)} Favorite: {getDrinkLabel(profile.favorite_drink)}
                </span>
              </div>
            )}

            {/* Follow Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{followCounts.followers}</div>
                <div className="text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{followCounts.following}</div>
                <div className="text-muted-foreground">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{innerCircleCount}</div>
                <div className="text-muted-foreground">Inner Circle</div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Crew System Active */}
          {!isOwnProfile && userId && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" disabled>
                Crew System Active
              </Button>
            </div>
          )}
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">🍺</div>
            <div className="text-sm text-muted-foreground">Sessions Created</div>
            <div className="text-lg font-semibold">Coming Soon</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">🎉</div>
            <div className="text-sm text-muted-foreground">Sessions Attended</div>
            <div className="text-lg font-semibold">Coming Soon</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">⭐</div>
            <div className="text-sm text-muted-foreground">Member Since</div>
            <div className="text-lg font-semibold">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Activity feed coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
