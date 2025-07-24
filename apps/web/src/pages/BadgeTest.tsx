// Badge Test Page
// Simple test page to verify badge system functionality

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgeService } from '@/lib/badgeService'
import { BadgeIcon } from '@/components/BadgeIcon'
import { BadgeCard } from '@/components/BadgeCard'
import { toast } from 'sonner'
import type { Badge, UserBadge, BadgeProgress } from '@/types/badge'

export function BadgeTest() {
  const { user } = useAuth()
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([])
  const [loading, setLoading] = useState(false)

  const loadBadgeData = async () => {
    if (!user) {
      toast.error('Please sign in to test badges')
      return
    }

    try {
      setLoading(true)
      const [badges, userBadgeData, progressData] = await Promise.all([
        BadgeService.getAllBadges(),
        BadgeService.getUserBadges(user.id),
        BadgeService.getBadgeProgress(user.id)
      ])

      setAllBadges(badges)
      setUserBadges(userBadgeData)
      setBadgeProgress(progressData)
      toast.success(`Loaded ${badges.length} badges, you have ${userBadgeData.length}`)
    } catch (error) {
      console.error('Error loading badge data:', error)
      toast.error('Failed to load badge data')
    } finally {
      setLoading(false)
    }
  }

  const triggerBadgeCheck = async () => {
    if (!user) {
      toast.error('Please sign in to test badges')
      return
    }

    try {
      setLoading(true)
      const achievements = await BadgeService.checkAndAwardBadges(user.id)
      
      if (achievements.length > 0) {
        toast.success(`🏅 Earned ${achievements.length} new badges!`)
        // Reload user badges
        const updatedUserBadges = await BadgeService.getUserBadges(user.id)
        setUserBadges(updatedUserBadges)
      } else {
        toast.info('No new badges earned')
      }
    } catch (error) {
      console.error('Error checking badges:', error)
      toast.error('Failed to check badges')
    } finally {
      setLoading(false)
    }
  }

  const testEventJoin = async () => {
    if (!user) return
    
    try {
      await BadgeService.triggerAchievementCheck(user.id, 'event_join')
      toast.success('Event join trigger sent')
      // Reload badges after a short delay
      setTimeout(loadBadgeData, 1000)
    } catch (error) {
      toast.error('Failed to trigger event join')
    }
  }

  const testEventHost = async () => {
    if (!user) return
    
    try {
      await BadgeService.triggerAchievementCheck(user.id, 'event_host')
      toast.success('Event host trigger sent')
      setTimeout(loadBadgeData, 1000)
    } catch (error) {
      toast.error('Failed to trigger event host')
    }
  }

  const testCrewJoin = async () => {
    if (!user) return

    try {
      await BadgeService.triggerAchievementCheck(user.id, 'crew_join')
      toast.success('Crew join trigger sent')
      setTimeout(loadBadgeData, 1000)
    } catch (error) {
      toast.error('Failed to trigger crew join')
    }
  }

  const debugUserActivity = async () => {
    if (!user) {
      toast.error('Please sign in to debug')
      return
    }

    try {
      setLoading(true)
      toast.info('Analyzing your activity data...')

      const activityData = await BadgeService.debugUserActivity(user.id)

      console.log('=== USER ACTIVITY DEBUG ===', activityData)

      toast.success(`📊 Activity analysis complete! Check console for details. Events: ${activityData.totalEventsAttended}, Hosted: ${activityData.totalEventsHosted}, Crews: ${activityData.totalCrewsJoined}`)

    } catch (error) {
      console.error('Error debugging user activity:', error)
      toast.error('Failed to debug user activity')
    } finally {
      setLoading(false)
    }
  }

  const runComprehensiveBadgeCheck = async () => {
    if (!user) {
      toast.error('Please sign in to run this test')
      return
    }

    try {
      setLoading(true)
      toast.info('Running comprehensive badge check... This bypasses the incomplete database function.')

      // Use the comprehensive badge check method
      const achievements = await BadgeService.runComprehensiveBadgeCheck(user.id)

      if (achievements.length > 0) {
        toast.success(`🏅 Comprehensive check complete! Earned ${achievements.length} new badges: ${achievements.map(a => a.badge_name).join(', ')}`)
      } else {
        toast.info('Comprehensive check complete - no new badges earned')
      }

      // Reload current user's badges
      await loadBadgeData()

    } catch (error) {
      console.error('Error running comprehensive badge check:', error)
      toast.error('Failed to run comprehensive badge check')
    } finally {
      setLoading(false)
    }
  }

  const runBadgeCheckForAllUsers = async () => {
    if (!user) {
      toast.error('Please sign in to run this test')
      return
    }

    try {
      setLoading(true)
      toast.info('Running silent badge check for all users... This may take a moment. (No notifications will be sent)')

      // Use the new BadgeService method
      const result = await BadgeService.runBadgeCheckForAllUsers()

      toast.success(`✅ Silent badge check completed! Processed ${result.usersProcessed} users, awarded ${result.totalBadgesAwarded} total badges. No notifications sent.`)

      // Reload current user's badges
      await loadBadgeData()

    } catch (error) {
      console.error('Error running badge check for all users:', error)
      toast.error('Failed to run badge check for all users')
    } finally {
      setLoading(false)
    }
  }

  const createSampleProgressData = async () => {
    if (!user) {
      toast.error('Please sign in to create sample progress')
      return
    }

    try {
      setLoading(true)
      toast.info('Creating sample progress data...')

      await BadgeService.createSampleProgressData(user.id)
      toast.success('Created sample progress data for 3 badges')

      // Reload data to show progress bars
      await loadBadgeData()
    } catch (error) {
      console.error('Error creating sample progress:', error)
      if (error instanceof Error && error.message.includes('RLS policies')) {
        toast.error('Badge progress RLS policies need to be fixed. Please contact an admin.')
      } else {
        toast.error('Failed to create sample progress data')
      }
    } finally {
      setLoading(false)
    }
  }

  const cleanupProgressData = async () => {
    if (!user) {
      toast.error('Please sign in to cleanup progress')
      return
    }

    try {
      setLoading(true)
      toast.info('Cleaning up stale progress records...')

      await BadgeService.cleanupProgressForEarnedBadges(user.id)
      toast.success('Cleaned up progress records for earned badges')

      // Reload data to refresh display
      await loadBadgeData()
    } catch (error) {
      console.error('Error cleaning up progress:', error)
      toast.error('Failed to cleanup progress data')
    } finally {
      setLoading(false)
    }
  }

  const testVisibilityToggle = async () => {
    if (!user) {
      toast.error('Please sign in to test visibility toggle')
      return
    }

    try {
      setLoading(true)
      toast.info('Testing badge visibility toggle system...')

      // Set default visibility for current badges
      await BadgeService.setDefaultBadgeVisibility(user.id)

      // Reload data to show changes
      await loadBadgeData()

      toast.success('Badge visibility toggle system tested! Check your profile to see the top 4 badges by tier.')
    } catch (error) {
      console.error('Error testing visibility toggle:', error)
      toast.error('Failed to test visibility toggle system')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Card className="glass-card max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-white mb-4">Badge System Test</h1>
            <p className="text-muted-foreground mb-4">Please sign in to test the badge system</p>
            <Button onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🏅 Badge System Test</h1>
          <p className="text-muted-foreground">
            Test the badge system functionality and view your badges
          </p>
        </div>

        {/* Test Controls */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={loadBadgeData} 
                disabled={loading}
                variant="outline"
              >
                Load Badges
              </Button>
              <Button 
                onClick={triggerBadgeCheck} 
                disabled={loading}
                variant="default"
              >
                Check Badges
              </Button>
              <Button 
                onClick={testEventJoin} 
                disabled={loading}
                variant="secondary"
              >
                Test Event Join
              </Button>
              <Button 
                onClick={testEventHost} 
                disabled={loading}
                variant="secondary"
              >
                Test Event Host
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={testCrewJoin}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1 md:flex-none"
                >
                  Test Crew Join
                </Button>
                <Button
                  onClick={debugUserActivity}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  title="Debug your activity data (check console)"
                >
                  🔍 Debug Activity
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={runComprehensiveBadgeCheck}
                  disabled={loading}
                  variant="default"
                  className="flex-1 md:flex-none"
                  title="Comprehensive badge check that bypasses incomplete database function"
                >
                  🔧 Comprehensive Badge Check
                </Button>
                <Button
                  onClick={runBadgeCheckForAllUsers}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1 md:flex-none"
                  title="Awards badges to all users based on existing activity (NO notifications sent)"
                >
                  🚀 Award Badges to All Users (Silent)
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={createSampleProgressData}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1 md:flex-none"
                  title="Create sample progress data to test progress bars"
                >
                  📊 Create Sample Progress Data
                </Button>
                <Button
                  onClick={cleanupProgressData}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  title="Remove progress records for badges you've already earned"
                >
                  🧹 Cleanup Progress Data
                </Button>
                <Button
                  onClick={testVisibilityToggle}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1 md:flex-none"
                  title="Test badge visibility toggle system with 4-badge limit"
                >
                  👁️ Test Visibility Toggle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Stats */}
        {allBadges.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{allBadges.length}</div>
                <div className="text-sm text-muted-foreground">Total Badges</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{userBadges.length}</div>
                <div className="text-sm text-muted-foreground">Earned</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {userBadges.filter(ub => ub.is_visible_on_profile).length}
                </div>
                <div className="text-sm text-muted-foreground">Visible</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.round((userBadges.length / allBadges.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sample Badges */}
        {allBadges.length > 0 && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Sample Badge Icons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {allBadges.slice(0, 8).map(badge => {
                  const isEarned = userBadges.some(ub => ub.badge_id === badge.id)
                  return (
                    <div key={badge.id} className="text-center">
                      <BadgeIcon 
                        badge={badge}
                        size="lg"
                        isLocked={!isEarned}
                        showTooltip={true}
                      />
                      <p className="text-xs text-muted-foreground mt-2 max-w-[80px] truncate">
                        {badge.name}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Badges */}
        {userBadges.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Badges ({userBadges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userBadges.map(userBadge => {
                  if (!userBadge.badge) return null
                  return (
                    <BadgeCard
                      key={userBadge.id}
                      badge={userBadge.badge}
                      userBadge={userBadge}
                      variant="detailed"
                      expandable={true}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locked Badges with Progress */}
        {badgeProgress.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Progress Towards Badges ({badgeProgress.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badgeProgress.map(progress => {
                  if (!progress.badge) return null
                  return (
                    <BadgeCard
                      key={progress.id}
                      badge={progress.badge}
                      progress={progress}
                      variant="detailed"
                      expandable={true}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
