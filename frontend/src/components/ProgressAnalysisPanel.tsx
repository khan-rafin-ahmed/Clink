import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { progressTracker, getApprovalAnalysis } from '@/lib/progressTracker'
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Users, 
  Activity,
  RefreshCw
} from 'lucide-react'

interface AnalysisData {
  locationFixes: {
    total: number
    successful: number
    successRate: number
    recentFailures: any[]
  }
  statsFixes: {
    total: number
    successful: number
    successRate: number
    averageEventsPerUser: number
    recentFailures: any[]
  }
  overall: {
    totalFixes: number
    successRate: number
    lastHourActivity: number
  }
}

export function ProgressAnalysisPanel() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refreshAnalysis = () => {
    const data = progressTracker.getApprovalAnalysis()
    setAnalysis(data)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    refreshAnalysis()
    
    // Auto-refresh every 30 seconds when visible
    const interval = setInterval(() => {
      if (isVisible) {
        refreshAnalysis()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
        >
          <Activity className="w-4 h-4 mr-2" />
          Progress Analysis
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 bg-background/95 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading analysis...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500'
    if (rate >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 90) return 'default'
    if (rate >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Profile Fixes Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={refreshAnalysis}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {analysis.overall.totalFixes}
              </div>
              <div className="text-xs text-muted-foreground">Total Fixes</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${getSuccessRateColor(analysis.overall.successRate)}`}>
                {analysis.overall.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Location Fixes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Location Display Fixes</span>
              <Badge variant={getSuccessRateBadge(analysis.locationFixes.successRate)} size="sm">
                {analysis.locationFixes.successRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{analysis.locationFixes.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-500 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {analysis.locationFixes.successful}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-500 flex items-center justify-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {analysis.locationFixes.total - analysis.locationFixes.successful}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>

          {/* Stats Fixes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">Profile Stats Fixes</span>
              <Badge variant={getSuccessRateBadge(analysis.statsFixes.successRate)} size="sm">
                {analysis.statsFixes.successRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{analysis.statsFixes.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-500 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {analysis.statsFixes.successful}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="font-medium">
                  {analysis.statsFixes.averageEventsPerUser.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Events</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Recent Activity</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last hour:</span>
                <span className="font-medium">{analysis.overall.lastHourActivity} fixes</span>
              </div>
            </div>
          </div>

          {/* Recent Failures */}
          {(analysis.locationFixes.recentFailures.length > 0 || analysis.statsFixes.recentFailures.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="font-medium">Recent Issues</span>
              </div>
              <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                {analysis.locationFixes.recentFailures.slice(0, 3).map((failure, i) => (
                  <div key={i} className="text-red-500">
                    Location: Event {failure.details.eventId}
                  </div>
                ))}
                {analysis.statsFixes.recentFailures.slice(0, 3).map((failure, i) => (
                  <div key={i} className="text-red-500">
                    Stats: User {failure.userId.slice(-4)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
