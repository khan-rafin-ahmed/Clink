/**
 * Not Allowed Page
 * Displayed when users are under 18 or denied access
 */

import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { clearAgeVerification } from '@/lib/ageGate'

export function NotAllowed() {
  useEffect(() => {
    // Clear any existing age verification when this page loads
    clearAgeVerification()
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <div className="text-4xl">🚫</div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Access Denied
          </h1>
          
          <div className="space-y-3">
            <p className="text-lg text-muted-foreground">
              You must be 18+ to view this content.
            </p>
            
            <p className="text-base text-muted-foreground leading-relaxed">
              Thirstee is designed for adults attending drinking events. We take age verification seriously to ensure a safe and legal experience for all users.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={() => window.location.href = 'https://www.google.com'}
            className="w-full bg-gradient-primary hover:opacity-90 text-black font-semibold py-3"
          >
            Learn More About Responsible Drinking
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full border-border hover:bg-muted text-muted-foreground py-3"
          >
            Go Back
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground/70">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
