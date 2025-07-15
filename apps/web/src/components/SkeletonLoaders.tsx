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

// Profile redirect skeleton - matches the actual profile layout
export function ProfileRedirectSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base animate-in fade-in-50 duration-300">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Two-Column Hero Section Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

          {/* Left Column - Profile Info Card Skeleton */}
          <div className="glass-modal rounded-3xl p-6 lg:p-8 relative overflow-hidden transition-all duration-300" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
            {/* Glass shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-50 pointer-events-none rounded-3xl" />

            <div className="relative z-10 space-y-6">
              {/* Avatar Section */}
              <div className="text-center">
                <SkeletonBox className="w-24 h-24 lg:w-32 lg:h-32 rounded-full mx-auto border-4 border-transparent shadow-glass-lg" />
                {/* Glowing ring effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-2xl scale-110 mx-auto" style={{ width: '8rem', height: '8rem', left: '50%', transform: 'translateX(-50%)' }}></div>
              </div>

              {/* User Information */}
              <div className="text-center space-y-3">
                <SkeletonBox className="h-8 w-48 mx-auto" />
                <SkeletonBox className="h-5 w-32 mx-auto" />
                <div className="inline-block">
                  <SkeletonBox className="h-6 w-40 rounded-xl" />
                </div>
                <div className="rounded-xl p-4" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                  <SkeletonBox className="h-4 w-64 mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Action Cards Skeleton */}
          <div className="glass-modal rounded-3xl p-6 lg:p-8 border border-white/15 relative overflow-hidden transition-all duration-300">
            {/* Glass shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-50 pointer-events-none rounded-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="text-center space-y-3">
                <SkeletonBox className="h-8 w-56 mx-auto" />
                <SkeletonBox className="h-5 w-48 mx-auto" />
              </div>

              <div className="space-y-4">
                <SkeletonBox className="h-12 w-full rounded-md" />
                <SkeletonBox className="h-12 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs Skeleton */}
        <div className="space-y-6">
          {/* Tab Headers */}
          <div className="flex space-x-1 bg-muted/20 p-1 rounded-lg w-fit">
            <SkeletonBox className="h-10 w-24 rounded-md" />
            <SkeletonBox className="h-10 w-20 rounded-md" />
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            <SkeletonBox className="h-32 w-full rounded-xl" />
            <SkeletonBox className="h-32 w-full rounded-xl" />
            <SkeletonBox className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Event Detail page skeleton
export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Hero Section Skeleton */}
        <div className="glass-card rounded-xl p-6 mb-6 shadow-sm">
          {/* Status badges */}
          <div className="flex items-center gap-2 mb-4">
            <SkeletonBox className="h-6 w-16 rounded-full" />
            <SkeletonBox className="h-6 w-20 rounded-full" />
          </div>

          {/* Title and Date */}
          <div className="px-4 py-1 space-y-1">
            <SkeletonBox className="h-7 w-3/4 lg:h-8 lg:w-2/3" />
            <SkeletonBox className="h-4 w-1/2" />
            <SkeletonBox className="h-4 w-1/3" />
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

          {/* Mobile Layout - Stack vertically */}
          <div className="lg:hidden space-y-4">
            {/* Mobile CTA */}
            <div className="glass-card rounded-xl p-4 shadow-sm">
              <SkeletonBox className="h-12 w-full rounded-md" />
            </div>

            {/* Mobile Content */}
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="rounded-xl overflow-hidden">
                <SkeletonBox className="w-full aspect-[16/9]" />
              </div>

              {/* Event Info */}
              <div className="glass-card rounded-xl p-4 shadow-sm space-y-3">
                <SkeletonBox className="h-5 w-24" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <SkeletonBox className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <SkeletonBox className="h-4 w-40" />
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <SkeletonBox className="h-4 w-20" />
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="glass-card rounded-xl p-4 shadow-sm">
                <SkeletonBox className="h-5 w-32 mb-3" />
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonBox key={i} className="h-10 w-10 rounded-full border-2 border-background" />
                    ))}
                  </div>
                  <SkeletonBox className="h-4 w-20" />
                </div>
              </div>

              {/* Description */}
              <div className="glass-card rounded-xl p-4 shadow-sm space-y-3">
                <SkeletonBox className="h-5 w-28" />
                <div className="space-y-2">
                  <SkeletonBox className="h-4 w-full" />
                  <SkeletonBox className="h-4 w-5/6" />
                  <SkeletonBox className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Left Column - Primary Content */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">
            {/* Title & Date */}
            <div className="space-y-3">
              <SkeletonBox className="h-9 w-4/5" />
              <SkeletonBox className="h-5 w-2/3" />
            </div>

            {/* Cover Image */}
            <div className="rounded-xl overflow-hidden shadow-xl">
              <SkeletonBox className="w-full aspect-[16/9]" />
            </div>

            {/* Description */}
            <div className="glass-card rounded-xl p-6 shadow-sm space-y-4">
              <SkeletonBox className="h-6 w-32" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-11/12" />
                <SkeletonBox className="h-4 w-4/5" />
                <SkeletonBox className="h-4 w-3/4" />
              </div>
            </div>

            {/* Attendees */}
            <div className="glass-card rounded-xl p-6 shadow-sm space-y-4">
              <SkeletonBox className="h-6 w-40" />
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBox key={i} className="h-12 w-12 rounded-full border-2 border-background" />
                  ))}
                </div>
                <SkeletonBox className="h-4 w-24" />
              </div>
            </div>

            {/* Host Info */}
            <div className="glass-card rounded-xl p-6 shadow-sm space-y-4">
              <SkeletonBox className="h-6 w-28" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <SkeletonBox className="h-4 w-32" />
                    <SkeletonBox className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Right Column - Actions & Meta */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-6 space-y-4">
              {/* Share Button */}
              <div className="glass-card rounded-xl p-4 shadow-sm">
                <SkeletonBox className="h-10 w-full rounded-md" />
              </div>

              {/* CTA Button */}
              <div className="glass-card rounded-xl p-4 shadow-sm">
                <SkeletonBox className="h-12 w-full rounded-md" />
              </div>

              {/* Event Info */}
              <div className="glass-card rounded-xl p-4 shadow-sm space-y-4">
                <SkeletonBox className="h-5 w-24" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <SkeletonBox className="h-4 w-28" />
                      <SkeletonBox className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <SkeletonBox className="h-4 w-36" />
                      <SkeletonBox className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-4 w-4 rounded-full" />
                    <SkeletonBox className="h-4 w-20" />
                  </div>
                </div>
              </div>

              {/* Additional Info Cards */}
              <div className="glass-card rounded-xl p-4 shadow-sm space-y-3">
                <SkeletonBox className="h-5 w-32" />
                <div className="space-y-2">
                  <SkeletonBox className="h-4 w-full" />
                  <SkeletonBox className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Discover page skeleton with view mode support
export function DiscoverPageSkeleton({ viewMode = 'list' }: { viewMode?: 'list' | 'grid' }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8 space-y-4">
          <SkeletonBox className="h-10 w-64 mx-auto" />
          <SkeletonBox className="h-6 w-96 mx-auto" />
        </div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          {/* Search Input with Filter */}
          <div className="flex gap-4">
            <SkeletonBox className="h-14 flex-1 rounded-xl" />
            <SkeletonBox className="h-14 w-14 rounded-xl" />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <SkeletonBox className="h-8 w-16 rounded-full" />
            <SkeletonBox className="h-8 w-20 rounded-full" />
            <SkeletonBox className="h-8 w-18 rounded-full" />
            <SkeletonBox className="h-8 w-24 rounded-full" />
          </div>

          {/* Stats Row with View Toggle */}
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-1">
                <SkeletonBox className="h-8 w-8 rounded-md" />
                <SkeletonBox className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Display - Conditional based on view mode */}
        {viewMode === 'list' ? (
          // Timeline View Skeleton - Already within max-w-4xl container
          <div>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[120px] lg:left-[140px] top-0 bottom-0 w-[1px] hidden sm:block bg-white/10"></div>

              {/* Timeline Content */}
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, dateIndex) => (
                  <div key={dateIndex} className="relative">
                    {/* Mobile Date Header */}
                    <div className="sm:hidden mb-4">
                      <SkeletonBox className="h-6 w-24 mb-2" />
                      <SkeletonBox className="h-4 w-32" />
                    </div>

                    {/* Desktop Date Block Header */}
                    <div className="hidden sm:flex items-center mb-6">
                      {/* Date Labels - Left Side */}
                      <div className="w-[100px] lg:w-[120px] flex-shrink-0 text-right pr-4 space-y-1">
                        <SkeletonBox className="h-4 w-16 ml-auto" />
                        <SkeletonBox className="h-3 w-12 ml-auto" />
                      </div>

                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <SkeletonBox className="w-3 h-3 rounded-full" />
                      </div>

                      <div className="w-6 flex-shrink-0"></div>
                    </div>

                    {/* Events Container */}
                    <div className="sm:pl-[146px] lg:pl-[166px]">
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, eventIndex) => (
                          <div key={eventIndex} className="glass-card rounded-xl p-4 shadow-sm">
                            <div className="flex gap-4">
                              {/* Event Image */}
                              <div className="flex-shrink-0">
                                <SkeletonBox className="w-[96px] h-[96px] rounded-xl" />
                              </div>

                              {/* Event Content */}
                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Title and Time */}
                                <div className="space-y-2">
                                  <SkeletonBox className="h-5 w-3/4" />
                                  <SkeletonBox className="h-4 w-1/2" />
                                </div>

                                {/* Location and Details */}
                                <div className="space-y-1">
                                  <SkeletonBox className="h-4 w-2/3" />
                                  <SkeletonBox className="h-4 w-1/3" />
                                </div>

                                {/* Attendees */}
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                      <SkeletonBox key={i} className="h-6 w-6 rounded-full border-2 border-background" />
                                    ))}
                                  </div>
                                  <SkeletonBox className="h-4 w-16" />
                                </div>
                              </div>

                              {/* Action Menu */}
                              <div className="flex-shrink-0">
                                <SkeletonBox className="h-8 w-8 rounded-md" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Grid View Skeleton - Already within max-w-4xl container
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} variant="default" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// User Profile page skeleton
export function UserProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Back Button - Only for non-own profiles */}
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-9 w-20 rounded-md" />
          </div>

          {/* Two-Column Hero Section - 50:50 Layout matching UserProfile */}
          <div>
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Left Column - Profile Info Card (50% width) */}
              <div className="flex">
                <div className="glass-modal rounded-3xl p-6 lg:p-8 border border-white/15 relative overflow-hidden w-full">
                  {/* Glass shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-50 pointer-events-none rounded-3xl" />

              <div className="relative z-10 space-y-6">
                {/* Avatar Section */}
                <div className="text-center">
                  <SkeletonBox className="w-24 h-24 lg:w-32 lg:h-32 rounded-full mx-auto border-4 border-transparent shadow-glass-lg" />
                </div>

                {/* Profile Info */}
                <div className="text-center space-y-3">
                  <SkeletonBox className="h-8 w-48 mx-auto" />
                  <SkeletonBox className="h-4 w-32 mx-auto rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-3/4 mx-auto" />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <SkeletonBox className="h-6 w-8 mx-auto mb-1" />
                      <SkeletonBox className="h-3 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
                </div>
              </div>

              {/* Right Column - Action Cards (50% width) */}
              <div className="flex">
                <div className="glass-modal rounded-3xl p-6 lg:p-8 border border-white/15 relative overflow-hidden w-full">
                  {/* Glass shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-50 pointer-events-none rounded-3xl" />

                  <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-3">
                      <SkeletonBox className="h-8 w-56 mx-auto" />
                      <SkeletonBox className="h-5 w-48 mx-auto" />
                    </div>

                    <div className="space-y-4">
                      <SkeletonBox className="h-12 w-full rounded-md" />
                      <SkeletonBox className="h-12 w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Activity Tabs */}
          <div className="space-y-6">
            {/* Tab Headers */}
            <div className="flex space-x-1 bg-muted/20 p-1 rounded-lg w-fit">
              <SkeletonBox className="h-10 w-24 rounded-md" />
              <SkeletonBox className="h-10 w-20 rounded-md" />
              <SkeletonBox className="h-10 w-16 rounded-md" />
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              <SkeletonBox className="h-32 w-full rounded-xl" />
              <SkeletonBox className="h-32 w-full rounded-xl" />
              <SkeletonBox className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Crew Detail page skeleton
export function CrewDetailPageSkeleton() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background - Matching CrewDetail */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)] opacity-10"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-12 w-32 rounded-md" />
          </div>

          {/* Crew Info Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-3 sm:space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-12 h-12 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBox className="h-7 w-48" />
                    <div className="flex items-center gap-2">
                      <SkeletonBox className="h-6 w-20 rounded-full" />
                      <SkeletonBox className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <SkeletonBox className="h-4 w-full" />
                  <SkeletonBox className="h-4 w-3/4" />
                </div>

                {/* Member Count */}
                <SkeletonBox className="h-4 w-24" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <SkeletonBox className="h-9 w-9 rounded-md" />
                <SkeletonBox className="h-9 w-9 rounded-md" />
                <SkeletonBox className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="glass-card rounded-xl p-4 sm:p-6">
            <SkeletonBox className="h-6 w-40 mb-4" />
            <div className="grid gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 flex-1">
                    <SkeletonBox className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <SkeletonBox className="h-4 w-32" />
                      <SkeletonBox className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SkeletonBox className="h-8 w-16 rounded-md" />
                    <SkeletonBox className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="glass-card rounded-xl p-4 sm:p-6">
            <SkeletonBox className="h-6 w-32 mb-4" />
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 flex-1">
                    <SkeletonBox className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <SkeletonBox className="h-4 w-32" />
                      <SkeletonBox className="h-3 w-20" />
                    </div>
                  </div>
                  <SkeletonBox className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full page loading skeleton (generic fallback)
export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
