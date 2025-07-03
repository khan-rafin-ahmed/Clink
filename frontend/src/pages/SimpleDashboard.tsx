import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { UserStats } from '@/components/UserStats'
import { getUserProfile } from '@/lib/userService'
import { useEffect, useState } from 'react'
import type { UserProfile } from '@/types'

export function SimpleDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [statsRefresh, setStatsRefresh] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(setUserProfile).catch(() => {
        // Silently handle profile loading errors
      })
    }
  }, [user])

  const handleEventCreated = () => {
    // Trigger stats refresh when an event is created
    setStatsRefresh(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Helper function to get drink emoji for display names (returns empty if no drink)
  const getDrinkEmojiForDisplay = (drink: string | null | undefined): string => {
    if (!drink || drink === 'none') {
      return '' // Return empty string for display names when no drink is set
    }

    const drinkMap: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      cocktails: '🍸',
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      tequila: '🥃',
      champagne: '🥂',
      sake: '🍶',
      other: '🍻'
    }

    return drinkMap[drink.toLowerCase()] || '🍻'
  }

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'Champion'
  const emoji = getDrinkEmojiForDisplay(userProfile?.favorite_drink)
  const displayNameWithDrink = emoji ? `${displayName} ${emoji}` : displayName

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-bold text-foreground">
              Welcome back, {displayNameWithDrink}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to raise some hell? Let's get this party started!
            </p>
            <div className="bg-primary/10 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong>Signed in as:</strong> {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(user.created_at || '').toLocaleDateString() || 'today'}
              </p>
            </div>
          </div>

          {/* User Stats */}
          <UserStats className="max-w-2xl mx-auto" refreshTrigger={statsRefresh} />

          {/* Quick Actions */}
          <div className="space-y-6">
            <QuickEventModal
              trigger={
                <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                  🍺 Create Your First Session
                </Button>
              }
              onEventCreated={handleEventCreated}
            />

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-card rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold mb-2">60-Second Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Create drinking sessions in under a minute
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share via WhatsApp, SMS, or any app
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🍻</div>
                <h3 className="text-lg font-semibold mb-2">One-Tap RSVP</h3>
                <p className="text-sm text-muted-foreground">
                  Friends can join with just one click
                </p>
              </div>
            </div>
          </div>

          {/* Stone Cold Quote */}
          <div className="pt-8">
            <p className="text-lg text-muted-foreground italic">
              "And that's the bottom line, 'cause Stone Cold said so!" 🥃
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
