import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BadgeService } from '@/lib/badgeService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BadgeDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDebug = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Test all badge service methods
      const allUserBadges = await BadgeService.getAllUserBadges(user.id)
      const starterBadges = await BadgeService.getStarterBadges()
      
      setDebugInfo({
        userId: user.id,
        userEmail: user.email,
        allUserBadges: allUserBadges,
        allUserBadgesCount: allUserBadges.length,
        starterBadges: starterBadges,
        starterBadgesCount: starterBadges.length,
        filteredBadges: allUserBadges.filter(ub => ub.badge),
        filteredBadgesCount: allUserBadges.filter(ub => ub.badge).length
      })
    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      runDebug()
    }
  }, [user?.id])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Badge System Debug</CardTitle>
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Debug Info'}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
