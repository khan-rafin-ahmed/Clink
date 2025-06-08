import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              'relative transition-all duration-200 ease-out',
              !readonly && 'hover:scale-110 cursor-pointer active:scale-95',
              readonly && 'cursor-default',
              'rounded-sm p-0.5'
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-all duration-200 ease-out',
                star <= displayRating
                  ? 'fill-amber-500 text-amber-500 drop-shadow-sm'
                  : 'fill-none text-muted-foreground/40 hover:text-muted-foreground/60',
                !readonly && star <= displayRating && 'shadow-sm',
                !readonly && 'hover:drop-shadow-md'
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground/80 ml-2 tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Display component for showing average ratings
interface StarRatingDisplayProps {
  averageRating: number
  totalRatings: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

export function StarRatingDisplay({
  averageRating,
  totalRatings,
  size = 'md',
  showCount = true,
  className,
  variant = 'default'
}: StarRatingDisplayProps) {
  if (totalRatings === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground/60', className)}>
        <StarRating rating={0} readonly size={size} />
        <span className="text-sm font-medium">No ratings yet</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <StarRating rating={averageRating} readonly size={size} />
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {averageRating.toFixed(1)}
        </span>
        {showCount && (
          <span className="text-xs text-muted-foreground font-medium">
            ({totalRatings})
          </span>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} readonly size={size} />
          <span className="text-lg font-bold text-foreground tabular-nums">
            {averageRating.toFixed(1)}
          </span>
        </div>
        {showCount && (
          <p className="text-sm text-muted-foreground font-medium">
            Based on {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating rating={averageRating} readonly size={size} />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground tabular-nums">
          {averageRating.toFixed(1)}
        </span>
        {showCount && (
          <span className="text-sm text-muted-foreground font-medium">
            ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
          </span>
        )}
      </div>
    </div>
  )
}
