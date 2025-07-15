import { Star, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventRatingBadgeProps {
  averageRating: number
  reviewCount: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showInfo?: boolean
}

export function EventRatingBadge({
  averageRating,
  reviewCount,
  className,
  size = 'md',
  showInfo = true
}: EventRatingBadgeProps) {
  // Don't render if no ratings
  if (reviewCount === 0 || averageRating === 0) {
    return null
  }

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      rating: 'text-sm font-semibold',
      stars: 'h-3 w-3',
      count: 'text-xs',
      info: 'h-3 w-3'
    },
    md: {
      container: 'gap-2',
      rating: 'text-base font-bold',
      stars: 'h-4 w-4',
      count: 'text-sm',
      info: 'h-4 w-4'
    },
    lg: {
      container: 'gap-3',
      rating: 'text-lg font-bold',
      stars: 'h-5 w-5',
      count: 'text-base',
      info: 'h-5 w-5'
    }
  }

  const classes = sizeClasses[size]

  // Generate star display
  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(averageRating)
    const hasHalfStar = averageRating % 1 >= 0.5

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          data-testid="star-icon"
          className={cn(classes.stars, 'fill-amber-400 text-amber-400')}
        />
      )
    }

    // Half star
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <div key="half" className="relative">
          <Star data-testid="star-icon" className={cn(classes.stars, 'text-gray-300 dark:text-gray-600')} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star data-testid="star-icon" className={cn(classes.stars, 'fill-amber-400 text-amber-400')} />
          </div>
        </div>
      )
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(averageRating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          data-testid="star-icon"
          className={cn(classes.stars, 'text-gray-300 dark:text-gray-600')}
        />
      )
    }

    return stars
  }

  return (
    <div className={cn(
      'inline-flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 shadow-sm',
      classes.container,
      className
    )}>
      {/* Average Rating Number */}
      <span className={cn(classes.rating, 'text-gray-900 dark:text-white tabular-nums')}>
        {averageRating.toFixed(1)}
      </span>

      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>

      {/* Review Count */}
      <span className={cn(classes.count, 'text-gray-600 dark:text-gray-400 font-medium')}>
        ({reviewCount})
      </span>

      {/* Info Icon */}
      {showInfo && (
        <Info
          data-testid="info-icon"
          className={cn(
            classes.info,
            'text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
          )}
        />
      )}
    </div>
  )
}
