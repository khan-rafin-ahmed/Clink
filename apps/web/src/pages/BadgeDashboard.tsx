// Badge Dashboard Page
// Full page badge management interface

import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ArrowLeft, Filter } from 'lucide-react'
import { BadgeCard } from '@/components/BadgeCard'
import { BadgeService } from '@/lib/badgeService'
import { getUserProfileByUsername } from '@/lib/userService'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { toast } from 'sonner'

import type { Badge as BadgeType, UserBadge, BadgeCategory } from '@/types/badge'
import type { UserProfile } from '@/types'

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  event_participation: 'Event Participation',
  hosting_crew: 'Hosting & Crew',
  social_activity: 'Social Activity',
  streaks_time: 'Streaks & Time',
  weekly_sinners: 'Weekly Sinners',
  drink_devotees: 'Drink Devotees'
}

export function BadgeDashboard() {
  const { username } = useParams<{ username: string }>()
  const { user, loading: authLoading } = useAuth()
  const { goBackSmart } = useSmartNavigation()
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [allBadges, setAllBadges] = useState<BadgeType[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [profileError, setProfileError] = useState(false)

  // Check if user can access this page
  const isOwnProfile = !username || (userProfile?.user_id === user?.id)
  const isPublicView = username && !isOwnProfile

  useEffect(() => {
    if (!username) return

    const loadProfile = async () => {
      try {
        const profile = await getUserProfileByUsername(username)
        if (!profile) {
          setProfileError(true)
        } else {
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setProfileError(true)
      }
    }

    loadProfile()
  }, [username])

  useEffect(() => {
    const loadBadgeData = async () => {
      try {
        const targetUserId = userProfile?.user_id || user?.id
        if (!targetUserId) return

        setLoading(true)
        const [badges, userBadgeData] = await Promise.all([
          BadgeService.getAllBadges(),
          BadgeService.getUserBadges(targetUserId)
        ])

        setAllBadges(badges)
        setUserBadges(userBadgeData)
      } catch (error) {
        console.error('Error loading badge data:', error)
        toast.error('Failed to load badges')
      } finally {
        setLoading(false)
      }
    }

    if (userProfile || user?.id) {
      loadBadgeData()
    }
  }, [userProfile, user?.id])

  const handleToggleVisibility = async (badgeId: string, visible: boolean) => {
    try {
      const targetUserId = userProfile?.user_id || user?.id
      if (!targetUserId) return

      await BadgeService.updateBadgeVisibility(targetUserId, badgeId, visible)
      
      // Update local state
      setUserBadges(prev => 
        prev.map(ub => 
          ub.badge_id === badgeId 
            ? { ...ub, is_visible_on_profile: visible }
            : ub
        )
      )

      toast.success(visible ? 'Badge shown on profile' : 'Badge hidden from profile')
    } catch (error) {
      console.error('Error updating badge visibility:', error)
      toast.error('Failed to update badge visibility')
    }
  }

  const handleResetToDefault = async () => {
    try {
      const targetUserId = userProfile?.user_id || user?.id
      if (!targetUserId) return

      await BadgeService.resetBadgesToDefault(targetUserId)
      
      // Reload user badges
      const updatedUserBadges = await BadgeService.getUserBadges(targetUserId)
      setUserBadges(updatedUserBadges)

      toast.success('Badges reset to show 4 most recent')
    } catch (error) {
      console.error('Error resetting badges:', error)
      toast.error('Failed to reset badges')
    }
  }

  // Create earned badge lookup
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (profileError) {
    return <Navigate to="/404" replace />
  }

  // Allow both profile owner and public access
  // No redirect needed - both cases are handled

  const categories = Object.keys(CATEGORY_LABELS) as BadgeCategory[]
  const earnedCount = userBadges.length
  const totalCount = allBadges.length
  const visibleCount = userBadges.filter(ub => ub.is_visible_on_profile).length
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0

  // Filter badges based on selected category and view type
  let filteredBadges = selectedCategory === 'all'
    ? allBadges
    : allBadges.filter(badge => badge.category === selectedCategory)

  // For public view, only show earned badges
  if (isPublicView) {
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))
    filteredBadges = filteredBadges.filter(badge => earnedBadgeIds.has(badge.id))
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goBackSmart}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isPublicView ? `${userProfile?.display_name || userProfile?.username || 'User'}'s Badges` : 'Your Badges'}
              </h1>
              <p className="text-muted-foreground">
                {isPublicView
                  ? `${earnedCount} badges earned • ${completionPercentage}% completion`
                  : `${earnedCount} of ${totalCount} earned • ${visibleCount} visible on profile`
                }
              </p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{earnedCount}</div>
              <div className="text-sm text-muted-foreground">Earned</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{visibleCount}</div>
              <div className="text-sm text-muted-foreground">Visible</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{Math.round((earnedCount / totalCount) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <Card className="glass-card mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBadges.map(badge => {
            const userBadge = userBadges.find(ub => ub.badge_id === badge.id)
            const isEarned = earnedBadgeIds.has(badge.id)

            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                userBadge={userBadge}
                variant="dashboard"
                expandable={true}
                showVisibilityToggle={isOwnProfile && isEarned}
                onToggleVisibility={isOwnProfile ? handleToggleVisibility : undefined}
              />
            )
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isPublicView
                ? "No badges earned in this category yet."
                : "No badges found in this category."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
