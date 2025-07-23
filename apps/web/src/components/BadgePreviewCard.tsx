// BadgePreviewCard Component
// Profile section integration for badge display

import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeIcon } from './BadgeIcon'
import { cn } from '@/lib/utils'
import type { UserBadge, Badge } from '@/types/badge'

interface BadgePreviewCardProps {
  userBadges: UserBadge[]
  starterBadges?: Badge[]
  maxDisplay?: number
  showViewAll?: boolean
  username: string
  isOwnProfile?: boolean
  className?: string
}

export function BadgePreviewCard({
  userBadges,
  starterBadges = [],
  maxDisplay = 6,
  showViewAll = true,
  username,
  isOwnProfile = false,
  className
}: BadgePreviewCardProps) {
  // Get badges to display (up to maxDisplay)
  const earnedBadges = userBadges.filter(ub => ub.badge)
  const visibleBadges = earnedBadges.slice(0, maxDisplay)

  // If no earned badges, show starter badges as locked
  const showStarterBadges = earnedBadges.length === 0 && starterBadges.length > 0
  const starterBadgesToShow = showStarterBadges ? starterBadges.slice(0, maxDisplay) : []

  // Don't render if no badges to show at all
  if (visibleBadges.length === 0 && starterBadgesToShow.length === 0) {
    return null
  }

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            🏅 Badges
            <span className="text-sm font-normal text-muted-foreground">
              ({showStarterBadges ? '0' : earnedBadges.length})
            </span>
          </CardTitle>
          
          {showViewAll && (
            <Link to={`/profile/${username}/badges`}>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Badge Grid - Fixed 6-column responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {showStarterBadges ? (
            // Show starter badges as locked
            starterBadgesToShow.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <BadgeIcon
                  badge={badge}
                  size="sm"
                  isLocked={true}
                  showTooltip={true}
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-white/60 truncate max-w-full">
                    {badge.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {badge.color_tier}
                  </p>
                </div>
              </div>
            ))
          ) : (
            // Show earned badges
            visibleBadges.map((userBadge) => {
              if (!userBadge.badge) return null

              return (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <BadgeIcon
                    badge={userBadge.badge}
                    size="sm"
                    showTooltip={true}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-white truncate max-w-full">
                      {userBadge.badge.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userBadge.badge.color_tier}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Call to Action for Own Profile with no badges */}
        {isOwnProfile && showStarterBadges && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground text-center">
              Start participating in events to earn your first badges! 🎯
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
