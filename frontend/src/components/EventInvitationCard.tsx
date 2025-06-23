import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  respondToEventInvitation, 
  showInvitationResponseToast,
  type EventInvitation 
} from '@/lib/eventInvitationService'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  MessageSquare,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EventInvitationCardProps {
  invitation: EventInvitation
  onResponse?: (invitationId: string, response: 'accepted' | 'declined') => void
}

export function EventInvitationCard({ invitation, onResponse }: EventInvitationCardProps) {
  const [isResponding, setIsResponding] = useState(false)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [comment, setComment] = useState('')
  const [pendingResponse, setPendingResponse] = useState<'accepted' | 'declined' | null>(null)

  const handleResponse = async (response: 'accepted' | 'declined') => {
    if (isResponding) return

    // If user wants to add a comment, show comment box first
    if (!showCommentBox && !comment.trim()) {
      setPendingResponse(response)
      setShowCommentBox(true)
      return
    }

    setIsResponding(true)

    try {
      const result = await respondToEventInvitation(invitation.invitation_id, {
        response,
        comment: comment.trim() || undefined
      })

      if (result.success) {
        showInvitationResponseToast(response, comment.trim() || undefined)
        onResponse?.(invitation.invitation_id, response)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error)
      // Show error toast or handle error
    } finally {
      setIsResponding(false)
      setShowCommentBox(false)
      setComment('')
      setPendingResponse(null)
    }
  }

  const handleCommentSubmit = () => {
    if (pendingResponse) {
      handleResponse(pendingResponse)
    }
  }

  const handleSkipComment = () => {
    if (pendingResponse) {
      setComment('')
      handleResponse(pendingResponse)
    }
  }

  const formatEventDate = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const timeAgo = formatDistanceToNow(new Date(invitation.invitation_sent_at), { addSuffix: true })

  return (
    <Card className="glass-card border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍺</div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {invitation.event_title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-xs">
                    {invitation.inviter_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-[#B3B3B3]">
                  Invited by {invitation.inviter_name}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#B3B3B3]">
            <Calendar className="w-4 h-4" />
            <span>{formatEventDate(invitation.event_date_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#B3B3B3]">
            <MapPin className="w-4 h-4" />
            <span>{invitation.event_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#B3B3B3]">
            <Clock className="w-4 h-4" />
            <span>Invited {timeAgo}</span>
          </div>
        </div>

        {/* Comment Box */}
        {showCommentBox && (
          <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Add a message (optional)
              </span>
            </div>
            <Textarea
              placeholder={
                pendingResponse === 'accepted' 
                  ? "I'll be there! Looking forward to it..."
                  : "Sorry, can't make it this time..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="bg-white/5 border-white/20 text-white placeholder:text-[#B3B3B3]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={isResponding}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isResponding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${pendingResponse === 'accepted' ? 'Accept' : 'Decline'} with Message`
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSkipComment}
                disabled={isResponding}
                className="text-[#B3B3B3] hover:text-white"
              >
                Skip Message
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showCommentBox && (
          <div className="flex gap-3">
            <Button
              onClick={() => handleResponse('accepted')}
              disabled={isResponding}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isResponding && pendingResponse === 'accepted' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accept
            </Button>
            <Button
              onClick={() => handleResponse('declined')}
              disabled={isResponding}
              variant="outline"
              className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {isResponding && pendingResponse === 'declined' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
