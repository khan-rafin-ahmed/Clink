/**
 * Progress Tracker for Profile Page Fixes
 * Monitors the effectiveness of location display and stats calculation fixes
 */

interface ProgressMetrics {
  timestamp: number
  userId: string
  fixType: 'location' | 'stats' | 'general'
  details: Record<string, any>
  success: boolean
  error?: string
}

class ProgressTracker {
  private metrics: ProgressMetrics[] = []
  private readonly MAX_METRICS = 100 // Keep only last 100 metrics

  /**
   * Track location display fix
   */
  trackLocationFix(eventId: string, hasLocation: boolean, displayText: string) {
    const metric: ProgressMetrics = {
      timestamp: Date.now(),
      userId: 'system',
      fixType: 'location',
      details: {
        eventId,
        hasLocation,
        displayText,
        isPlaceholder: !hasLocation,
        expectedPlaceholder: 'Anywhere on Earth'
      },
      success: !hasLocation ? displayText === 'Anywhere on Earth' : true
    }

    this.addMetric(metric)
    
    // Log for debugging
    console.log(`[LOCATION TRACKER] Event ${eventId}:`, {
      hasLocation,
      displayText,
      success: metric.success
    })
  }

  /**
   * Track stats calculation fix
   */
  trackStatsCalculation(userId: string, statsBreakdown: {
    totalEvents: number
    upcomingEvents: number
    totalRSVPs: number
    breakdown: {
      createdEvents: number
      rsvpEvents: number
      invitedEvents: number
      crewEvents: number
    }
  }) {
    const metric: ProgressMetrics = {
      timestamp: Date.now(),
      userId,
      fixType: 'stats',
      details: {
        ...statsBreakdown,
        allCategoriesIncluded: (
          statsBreakdown.breakdown.createdEvents >= 0 &&
          statsBreakdown.breakdown.rsvpEvents >= 0 &&
          statsBreakdown.breakdown.invitedEvents >= 0 &&
          statsBreakdown.breakdown.crewEvents >= 0
        )
      },
      success: statsBreakdown.totalEvents >= statsBreakdown.breakdown.createdEvents
    }

    this.addMetric(metric)
    
    // Log for debugging
    console.log(`[STATS TRACKER] User ${userId}:`, {
      totalCalculated: statsBreakdown.totalEvents,
      breakdown: statsBreakdown.breakdown,
      success: metric.success
    })
  }

  /**
   * Track general fix effectiveness
   */
  trackGeneralFix(userId: string, fixType: string, details: Record<string, any>, success: boolean, error?: string) {
    const metric: ProgressMetrics = {
      timestamp: Date.now(),
      userId,
      fixType: 'general',
      details: {
        specificFixType: fixType,
        ...details
      },
      success,
      error
    }

    this.addMetric(metric)
    
    // Log for debugging
    console.log(`[GENERAL TRACKER] ${fixType} for user ${userId}:`, {
      details,
      success,
      error
    })
  }

  /**
   * Get approval analysis report
   */
  getApprovalAnalysis(): {
    locationFixes: {
      total: number
      successful: number
      successRate: number
      recentFailures: ProgressMetrics[]
    }
    statsFixes: {
      total: number
      successful: number
      successRate: number
      averageEventsPerUser: number
      recentFailures: ProgressMetrics[]
    }
    overall: {
      totalFixes: number
      successRate: number
      lastHourActivity: number
    }
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)

    const locationMetrics = this.metrics.filter(m => m.fixType === 'location')
    const statsMetrics = this.metrics.filter(m => m.fixType === 'stats')
    const recentActivity = this.metrics.filter(m => m.timestamp >= oneHourAgo)

    return {
      locationFixes: {
        total: locationMetrics.length,
        successful: locationMetrics.filter(m => m.success).length,
        successRate: locationMetrics.length > 0 ? 
          (locationMetrics.filter(m => m.success).length / locationMetrics.length) * 100 : 0,
        recentFailures: locationMetrics.filter(m => !m.success).slice(-5)
      },
      statsFixes: {
        total: statsMetrics.length,
        successful: statsMetrics.filter(m => m.success).length,
        successRate: statsMetrics.length > 0 ? 
          (statsMetrics.filter(m => m.success).length / statsMetrics.length) * 100 : 0,
        averageEventsPerUser: statsMetrics.length > 0 ?
          statsMetrics.reduce((sum, m) => sum + (m.details.totalEvents || 0), 0) / statsMetrics.length : 0,
        recentFailures: statsMetrics.filter(m => !m.success).slice(-5)
      },
      overall: {
        totalFixes: this.metrics.length,
        successRate: this.metrics.length > 0 ? 
          (this.metrics.filter(m => m.success).length / this.metrics.length) * 100 : 0,
        lastHourActivity: recentActivity.length
      }
    }
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: ProgressMetrics) {
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics() {
    this.metrics = []
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return [...this.metrics]
  }
}

// Singleton instance
export const progressTracker = new ProgressTracker()

// Helper function to get approval analysis
export function getApprovalAnalysis() {
  return progressTracker.getApprovalAnalysis()
}
