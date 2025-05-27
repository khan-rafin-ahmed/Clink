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
        <img 
          src="/thirstee-logo.svg" 
          alt="Thirstee" 
          className={cn(logoSizeClasses[size], 'mb-2')}
        />
      )}
      
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      
      {text && (
        <p className="text-muted-foreground text-sm">{text}</p>
      )}
    </div>
  )
}

// Full screen loading component
export function FullScreenLoader({ text = 'Loading...', showLogo = true }: { text?: string; showLogo?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} showLogo={showLogo} />
    </div>
  )
}
