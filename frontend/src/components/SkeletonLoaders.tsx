import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Enhanced skeleton component with shimmer effect
export function SkeletonBox({ className = '', shimmer = true, ...props }: {
  className?: string
  shimmer?: boolean
  [key: string]: any
}) {
  return (
    <Skeleton
      className={cn(
        'bg-muted',
        shimmer ? 'shimmer' : 'animate-pulse',
        className
      )}
      {...props}
    />
  )
}

// Enhanced Event card skeleton for Discover page
export function EventCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Card className="interactive-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
              <SkeletonBox className="h-3 w-20" />
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-3 w-8" />
                <SkeletonBox className="h-6 w-12 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isFeatured = variant === 'featured'

  return (
    <Card className={cn(
      "interactive-card overflow-hidden",
      isFeatured && "ring-2 ring-primary/20"
    )}>
      {/* Hero Image Skeleton */}
      <div className={cn(
        "relative",
        isFeatured ? "h-48 sm:h-56" : "h-40 sm:h-48"
      )}>
        <SkeletonBox className="w-full h-full" />

        {/* Top badges skeleton */}
        <div className="absolute top-3 left-3 flex gap-2">
          <SkeletonBox className="h-6 w-16 rounded-full" />
          {isFeatured && <SkeletonBox className="h-6 w-20 rounded-full" />}
        </div>

        {/* Share button skeleton */}
        <SkeletonBox className="absolute top-3 right-3 h-8 w-8 rounded-md" />

        {/* Bottom overlay skeleton */}
        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          <SkeletonBox className={cn(
            "w-3/4",
            isFeatured ? "h-6" : "h-5"
          )} />
          <SkeletonBox className="h-4 w-32" />
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Location skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-4 w-4 rounded-full" />
          <SkeletonBox className="h-4 w-40" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-2/3" />
        </div>

        {/* Vibe and stats skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-6 w-16 rounded-full" />
            <SkeletonBox className="h-4 w-20" />
          </div>
          <SkeletonBox className="h-4 w-8" />
        </div>

        {/* Host info skeleton */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <SkeletonBox className="h-8 w-8 rounded-full" />
          <SkeletonBox className="h-4 w-24" />
        </div>

        {/* Action buttons skeleton */}
        <div className="space-y-2">
          <SkeletonBox className="h-10 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// Events grid skeleton
export function EventsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-8 space-y-4">
      <SkeletonBox className="h-10 w-64 mx-auto" />
      <SkeletonBox className="h-6 w-96 mx-auto" />
    </div>
  )
}

// Filter controls skeleton
export function FilterControlsSkeleton() {
  return (
    <div className="space-y-6 mb-8">
      {/* Search and filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonBox className="h-10 flex-1" />
        <SkeletonBox className="h-10 w-32" />
        <SkeletonBox className="h-10 w-32" />
        <SkeletonBox className="h-10 w-32" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-5 w-24" />
      </div>
    </div>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="bg-card rounded-xl p-8 border border-border">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        <SkeletonBox className="w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <SkeletonBox className="h-8 w-48" />
          <SkeletonBox className="h-4 w-64" />
          <div className="flex gap-4">
            <SkeletonBox className="h-6 w-20" />
            <SkeletonBox className="h-6 w-20" />
            <SkeletonBox className="h-6 w-20" />
          </div>
        </div>
        <SkeletonBox className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}

// Full profile page skeleton
export function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-card rounded-xl p-8 border border-border">
        {/* Profile Header Skeleton */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          {/* Avatar Skeleton */}
          <SkeletonBox className="w-24 h-24 rounded-full" />

          <div className="flex-1 space-y-4">
            {/* Name Skeleton */}
            <SkeletonBox className="h-8 w-48" />

            {/* Bio Skeleton */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-3/4" />
            </div>

            {/* Favorite Drink Skeleton */}
            <SkeletonBox className="h-6 w-32 rounded-full" />

            {/* Stats Skeleton */}
            <div className="flex items-center space-x-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <SkeletonBox className="h-8 w-12 mb-1" />
                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-4">
              <SkeletonBox className="h-8 w-8 mx-auto mb-2" />
              <SkeletonBox className="h-4 w-full mb-2" />
              <SkeletonBox className="h-6 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div>
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="text-center py-8">
            <SkeletonBox className="w-12 h-12 mx-auto mb-4" />
            <SkeletonBox className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Session card skeleton
export function SessionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <SkeletonBox className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-4 w-4" />
              <SkeletonBox className="h-4 w-32" />
            </div>
          </div>
          <SkeletonBox className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-4" />
            <SkeletonBox className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-4" />
            <SkeletonBox className="h-4 w-20" />
          </div>
          <SkeletonBox className="h-3 w-full" />
          <div className="flex justify-between items-center pt-2">
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Full page loading skeleton
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeaderSkeleton />
        <FilterControlsSkeleton />
        <EventsGridSkeleton />
      </div>
    </div>
  )
}

// Error fallback component
export function ErrorFallback({
  error,
  onRetry,
  title = "Something went wrong",
  description = "We encountered an error while loading this page."
}: {
  error?: string
  onRetry?: () => void
  title?: string
  description?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>

          {error && (
            <details className="text-left bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
              <summary className="cursor-pointer text-sm font-medium text-destructive mb-2">
                Error Details
              </summary>
              <pre className="text-xs text-destructive whitespace-pre-wrap overflow-auto">
                {error}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
