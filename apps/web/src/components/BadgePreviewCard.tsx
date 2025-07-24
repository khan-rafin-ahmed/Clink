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
  totalBadgeCount?: number
  starterBadges?: Badge[]
  maxDisplay?: number
  showViewAll?: boolean
  username: string
  isOwnProfile?: boolean
  className?: string
}

export function BadgePreviewCard({
  userBadges,
  totalBadgeCount,
  starterBadges = [],
  maxDisplay = 4,
  showViewAll = true,
  username,
  isOwnProfile = false,
  className
}: BadgePreviewCardProps) {
  // Get badges to display (up to maxDisplay)
  const earnedBadges = userBadges.filter(ub => ub.badge)
  const visibleBadges = earnedBadges.slice(0, maxDisplay)

  // Use totalBadgeCount if provided, otherwise fall back to earnedBadges.length
  const actualTotalCount = totalBadgeCount !== undefined ? totalBadgeCount : earnedBadges.length

  // If no earned badges, show starter badges as locked
  const showStarterBadges = actualTotalCount === 0 && starterBadges.length > 0
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
            🏅 {showStarterBadges ? '0 Badges Earned' : `${actualTotalCount} Badge${actualTotalCount === 1 ? '' : 's'} Earned`}
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
        {/* Badge Grid - Responsive grid with individual badge cards, 4 badges max */}
        <div className="badges-preview grid grid-cols-2 md:grid-cols-4 gap-4">
          {showStarterBadges ? (
            // Show starter badges as locked
            starterBadgesToShow.map((badge) => (
              <div
                key={badge.id}
                className="badge-item flex flex-col items-center min-h-[100px] py-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <BadgeIcon
                  badge={badge}
                  size="sm"
                  isLocked={true}
                  showTooltip={true}
                  className="w-8 h-8"
                />
                <span className="mt-2 text-sm font-semibold text-white/60 text-center">
                  {badge.name}
                </span>
                <span className="mt-1 text-xs text-muted-foreground text-center leading-tight">
                  {badge.description}
                </span>
              </div>
            ))
          ) : (
            // Show earned badges
            visibleBadges.map((userBadge) => {
              if (!userBadge.badge) return null

              return (
                <div
                  key={userBadge.id}
                  className="badge-item flex flex-col items-center min-h-[100px] py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <BadgeIcon
                    badge={userBadge.badge}
                    size="sm"
                    showTooltip={true}
                    className="w-8 h-8"
                  />
                  <span className="mt-2 text-sm font-semibold text-white text-center">
                    {userBadge.badge.name}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground text-center leading-tight">
                    {userBadge.badge.description}
                  </span>
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
