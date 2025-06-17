import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Bell, Check, X, AlertCircle, Info } from 'lucide-react'

/**
 * Test component for Notification Bell Badge and Toast System
 * This allows testing both the badge clipping fix and custom toast styling
 */
export function NotificationTest() {
  const [badgeCount, setBadgeCount] = useState(0)

  const testToastSuccess = () => {
    toast.success('🍻 Event joined successfully!', {
      description: 'You\'re all set for Beer Pong Night at The Rooftop Bar'
    })
  }

  const testToastError = () => {
    toast.error('❌ Failed to join event', {
      description: 'Something went wrong. Please try again.'
    })
  }

  const testToastWarning = () => {
    toast.warning('⚠️ Event starting soon', {
      description: 'Beer Pong Night starts in 15 minutes!'
    })
  }

  const testToastInfo = () => {
    toast('🔔 New event invitation', {
      description: 'John invited you to Rooftop Happy Hour',
      action: {
        label: 'View Event',
        onClick: () => toast.success('🎯 Navigating to event...')
      }
    })
  }

  const testToastCustom = () => {
    toast('🎉 Welcome to Thirstee!', {
      description: 'Ready to raise some hell? Let\'s find your first event.',
      duration: 8000
    })
  }

  const incrementBadge = () => {
    setBadgeCount(prev => prev + 1)
  }

  const resetBadge = () => {
    setBadgeCount(0)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification System Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Test the notification bell badge clipping fix and custom toast styling that matches Thirstee's design system.
            </p>

            {/* Badge Test Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Badge Test</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Bell className="w-5 h-5" />
                  </Button>
                  {badgeCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[#FF5E78] text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow min-w-[20px] flex items-center justify-center">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={incrementBadge} size="sm" variant="outline">
                    Add Notification ({badgeCount})
                  </Button>
                  <Button onClick={resetBadge} size="sm" variant="outline">
                    Clear Badge
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Badge Test Notes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Badge should never be clipped by parent containers</li>
                  <li>• Badge uses custom styling: bg-[#FF5E78] with proper padding</li>
                  <li>• Badge should be positioned at top-right of bell icon</li>
                  <li>• Badge should handle numbers 1-99 and show "99+" for higher counts</li>
                </ul>
              </div>
            </div>

            {/* Toast Test Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Toast Notification Test</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button onClick={testToastSuccess} variant="outline" className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Success Toast
                </Button>
                <Button onClick={testToastError} variant="outline" className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Error Toast
                </Button>
                <Button onClick={testToastWarning} variant="outline" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Warning Toast
                </Button>
                <Button onClick={testToastInfo} variant="outline" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Info Toast
                </Button>
                <Button onClick={testToastCustom} variant="outline" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Custom Toast
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Toast Test Notes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Background: #1A1A1A (dark glass)</li>
                  <li>• Success text: #00FFA3 (neon green)</li>
                  <li>• Error text: #FF5E78 (red)</li>
                  <li>• Warning text: #FFC442 (yellow)</li>
                  <li>• Border: 1px solid with 20% opacity of text color</li>
                  <li>• Padding: px-5 py-3, rounded-xl, shadow-lg</li>
                  <li>• Desktop: top-right, Mobile: bottom-center</li>
                  <li>• No backdrop blur for clean appearance</li>
                </ul>
              </div>
            </div>

            {/* Design System Info */}
            <div className="bg-gradient-to-r from-[#FF7747]/10 to-[#00FFA3]/10 p-4 rounded-lg border border-[#00FFA3]/20">
              <h4 className="font-semibold mb-2 text-[#00FFA3]">Thirstee Design System</h4>
              <p className="text-sm text-muted-foreground">
                These components follow Thirstee's masculine neon-inspired color palette with Deep Amber (#FF7747) primary, 
                warm gold (#FFD37E) secondary, and Apple Liquid Glass design with frosted panels and glassmorphism effects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
