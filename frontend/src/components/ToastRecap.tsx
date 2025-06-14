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
    <Card className="bg-gradient-card border border-accent-secondary/20 hover:border-accent-secondary/30 backdrop-blur-md shadow-gold transition-all duration-300">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          {/* Main Recap Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-3xl">
              {getVibeEmoji(event.vibe)}
              <span className="text-5xl">🍻</span>
              {getVibeEmoji(event.vibe)}
            </div>

            <h3 className="text-2xl font-display font-bold text-foreground">
              Toast Recap 🎉
            </h3>

            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              {getRecapMessage()}
            </p>
          </div>

          {/* Event Details */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Badge variant="secondary" className="flex items-center gap-1 bg-bg-glass border-border/30 hover:bg-bg-glass-hover transition-colors">
              <Calendar className="h-3 w-3" />
              {new Date(event.date_time).toLocaleDateString()}
            </Badge>

            <Badge variant="secondary" className="flex items-center gap-1 bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
              <Users className="h-3 w-3" />
              {attendeeCount} legend{attendeeCount !== 1 ? 's' : ''}
            </Badge>

            {photoCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20 hover:bg-accent-secondary/20 transition-colors">
                <Camera className="h-3 w-3" />
                {photoCount} photo{photoCount !== 1 ? 's' : ''}
              </Badge>
            )}

            {commentCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20 hover:bg-accent-secondary/20 transition-colors">
                <MessageCircle className="h-3 w-3" />
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Stats Summary */}
          <p className="text-sm text-muted-foreground italic font-medium">
            {getEventStats()}
          </p>

          {/* Fun Quote */}
          <div className="pt-3 border-t border-accent-secondary/20">
            <p className="text-sm text-accent-primary font-bold">
              "What happens at Thirstee events, gets shared on Thirstee events." 🤘
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
