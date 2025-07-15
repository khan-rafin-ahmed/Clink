import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  showLogo?: boolean
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text = 'Loading...', 
  showLogo = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const logoSizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      {showLogo && (
        <div className="relative">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className={cn(logoSizeClasses[size], 'mb-2 float-slow drop-shadow-lg')}
          />
          {/* Glass glow effect around logo */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-50 animate-pulse" />
        </div>
      )}

      {/* Enhanced glass spinner */}
      <div className="relative">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary drop-shadow-lg')} />
        {/* Glass ring effect */}
        <div className={cn(
          sizeClasses[size],
          'absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse'
        )} />
        {/* Outer glow */}
        <div className={cn(
          sizeClasses[size],
          'absolute inset-0 rounded-full bg-primary/10 blur-md animate-pulse'
        )} />
      </div>

      {text && (
        <p className="text-muted-foreground text-sm glass-effect px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
          {text}
        </p>
      )}
    </div>
  )
}

// Full screen loading component with liquid glass effects
export function FullScreenLoader({ text = 'Loading...', showLogo = true }: { text?: string; showLogo?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated glass background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* Floating glass elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 glass-effect rounded-full opacity-20" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 glass-effect rounded-full opacity-15" />
      <div className="absolute top-1/3 right-1/3 w-16 h-16 glass-effect rounded-full opacity-25" />

      {/* Main loader */}
      <div className="relative z-10 glass-card p-8 rounded-2xl border border-white/10">
        <LoadingSpinner size="lg" text={text} showLogo={showLogo} />
      </div>
    </div>
  )
}
