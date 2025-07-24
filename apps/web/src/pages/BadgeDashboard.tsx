// Badge Dashboard Page
// Full page badge management interface

import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { ArrowLeft, Menu, X, Trophy, Calendar, Users, MessageCircle, Zap, Flame, Beer } from 'lucide-react'
import { BadgeCard } from '@/components/BadgeCard'
import { BadgeService } from '@/lib/badgeService'
import { getUserProfileByUsername } from '@/lib/userService'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { toast } from 'sonner'

import type { Badge as BadgeType, UserBadge, BadgeCategory } from '@/types/badge'
import type { UserProfile } from '@/types'



// Sidebar category configuration
const SIDEBAR_CATEGORIES = [
  { key: 'all' as const, label: 'All Categories', icon: Trophy },
  { key: 'event_participation' as const, label: 'Event Participation', icon: Calendar },
  { key: 'hosting_crew' as const, label: 'Hosting & Crew', icon: Users },
  { key: 'social_activity' as const, label: 'Social Activity', icon: MessageCircle },
  { key: 'streaks_time' as const, label: 'Streaks & Time', icon: Zap },
  { key: 'weekly_sinners' as const, label: 'Weekly Sinners', icon: Flame },
  { key: 'drink_devotees' as const, label: 'Drink Devotees', icon: Beer }
]

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

          {/* Mobile Sidebar Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden p-2 h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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

        {/* Main Layout - Sidebar + Content */}
        <div className="flex gap-6 relative">
          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="glass-card backdrop-blur-md rounded-xl h-full lg:h-auto lg:sticky lg:top-8 p-4">
              <div className="flex items-center justify-between mb-6 lg:mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Categories
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-1 h-6 w-6"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {SIDEBAR_CATEGORIES.map(category => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.key}
                      onClick={() => {
                        setSelectedCategory(category.key)
                        setSidebarOpen(false) // Close sidebar on mobile after selection
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                        ${selectedCategory === category.key
                          ? 'bg-[#00FFA3] text-black shadow-lg font-medium'
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/40 hover:border-white/60'
                        }
                      `}
                    >
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Badge Grid */}
            <div className="grid grid-cols-1 gap-6">
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
      </div>
    </div>
  )
}
