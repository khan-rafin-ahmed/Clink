import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Camera, MessageCircle, Calendar } from 'lucide-react'
import type { Event } from '@/types'

interface ToastRecapProps {
  event: Event
  attendeeCount: number
  photoCount: number
  commentCount: number
}

export function ToastRecap({ event, attendeeCount, photoCount, commentCount }: ToastRecapProps) {
  const getRecapMessage = () => {
    const messages = [
      `${attendeeCount} legends raised hell at this session. Here's the aftermath.`,
      `${attendeeCount} thirsty souls gathered for an epic night. Check out what went down.`,
      `${attendeeCount} party animals came together for this legendary session.`,
      `${attendeeCount} rebels showed up and made some memories. Here's the proof.`,
      `${attendeeCount} warriors answered the call. This is what happened next.`
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getVibeEmoji = (vibe?: string) => {
    switch (vibe) {
      case 'party': return '🎉'
      case 'wild': return '🤘'
      case 'chill': return '😎'
      case 'classy': return '🥂'
      case 'casual': return '🍺'
      default: return '🍻'
    }
  }

  const getEventStats = () => {
    const stats = []
    
    if (photoCount > 0) {
      stats.push(`${photoCount} epic photo${photoCount !== 1 ? 's' : ''}`)
    }
    
    if (commentCount > 0) {
      stats.push(`${commentCount} legendary comment${commentCount !== 1 ? 's' : ''}`)
    }
    
    if (stats.length === 0) {
      return 'The memories live on in our hearts.'
    }
    
    return stats.join(' and ') + ' captured for posterity.'
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          {/* Main Recap Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-2xl">
              {getVibeEmoji(event.vibe)}
              <span className="text-4xl">🍻</span>
              {getVibeEmoji(event.vibe)}
            </div>
            
            <h3 className="text-xl font-display font-bold text-foreground">
              Toast Recap
            </h3>
            
            <p className="text-lg text-muted-foreground font-medium">
              {getRecapMessage()}
            </p>
          </div>

          {/* Event Details */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(event.date_time).toLocaleDateString()}
            </Badge>
            
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}
            </Badge>
            
            {photoCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {photoCount} photo{photoCount !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {commentCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Stats Summary */}
          <p className="text-sm text-muted-foreground italic">
            {getEventStats()}
          </p>

          {/* Fun Quote */}
          <div className="pt-2 border-t border-primary/20">
            <p className="text-xs text-primary font-medium">
              "What happens at Thirstee events, gets shared on Thirstee events." 🤘
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
