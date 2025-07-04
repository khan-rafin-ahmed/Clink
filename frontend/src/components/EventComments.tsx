import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClickableUserAvatar } from './ClickableUserAvatar'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  getEventComments,
  addEventComment,
  addCommentReaction,
  removeCommentReaction
} from '@/lib/eventMediaService'
import type { EventComment, EventCommentReaction } from '@/types'

interface EventCommentsProps {
  eventId: string
  canComment: boolean
  canModerate?: boolean
}

const REACTION_EMOJIS: EventCommentReaction['reaction'][] = ['🍻', '🙌', '🤘', '🥴', '😂', '❤️', '🔥']

export function EventComments({ eventId, canComment }: EventCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<EventComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [eventId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const eventComments = await getEventComments(eventId)
      setComments(eventComments)
    } catch (error: any) {
      console.error('Error loading comments:', error)
      if (!error.message?.includes('attended')) {
        toast.error('Failed to load comments')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      setSubmitting(true)
      const comment = await addEventComment(eventId, newComment.trim())
      setComments(prev => [...prev, comment])
      setNewComment('')
      toast.success('Comment added! 💬')
    } catch (error: any) {
      console.error('Error adding comment:', error)
      toast.error(error.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (commentId: string, reaction: EventCommentReaction['reaction']) => {
    if (!user) return

    try {
      // Check if user already reacted with this emoji
      const comment = comments.find(c => c.id === commentId)
      const existingReaction = comment?.reactions?.find(
        r => r.user_id === user.id && r.reaction === reaction
      )

      if (existingReaction) {
        // Remove reaction
        await removeCommentReaction(commentId, reaction)
        setComments(prev => prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                reactions: c.reactions?.filter(r =>
                  !(r.user_id === user.id && r.reaction === reaction)
                )
              }
            : c
        ))
      } else {
        // Add reaction
        await addCommentReaction(commentId, reaction)
        setComments(prev => prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                reactions: [
                  ...(c.reactions || []),
                  {
                    id: `temp-${Date.now()}`,
                    comment_id: commentId,
                    user_id: user.id,
                    reaction,
                    created_at: new Date().toISOString()
                  }
                ]
              }
            : c
        ))
      }
    } catch (error: any) {
      console.error('Error handling reaction:', error)
      toast.error('Failed to update reaction')
    }
  }

  const getReactionCounts = (reactions: EventCommentReaction[] = []) => {
    const counts: Record<string, number> = {}
    reactions.forEach(r => {
      counts[r.reaction] = (counts[r.reaction] || 0) + 1
    })
    return counts
  }

  const hasUserReacted = (reactions: EventCommentReaction[] = [], reaction: string): boolean => {
    if (!user) return false
    return reactions.some(r => r.user_id === user.id && r.reaction === reaction)
  }

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          Comments
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-white" />
        Comments ({comments.length})
      </h2>

      <div className="space-y-6">
        {/* Add Comment Form */}
        {canComment && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Share your thoughts about this event..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500 characters
              </span>
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">
              {canComment ? 'Start the conversation!' : 'No comments yet'}
            </h3>
            <p className="text-[#B3B3B3]">
              {canComment
                ? 'Share your thoughts about this legendary session! 🍻'
                : 'Check back later for comments from attendees.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Comment Header */}
                <div className="flex items-start gap-3">
                  <ClickableUserAvatar
                    userId={comment.user_id}
                    displayName={comment.user?.display_name}
                    avatarUrl={comment.user?.avatar_url}
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.user?.display_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Reactions */}
                <div className="ml-11 space-y-2">
                  {/* Reaction Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {REACTION_EMOJIS.map((emoji) => {
                      const reactionCounts = getReactionCounts(comment.reactions)
                      const count = reactionCounts[emoji] || 0
                      const hasReacted = hasUserReacted(comment.reactions, emoji)

                      return (
                        <Button
                          key={emoji}
                          variant={hasReacted ? "default" : "ghost"}
                          size="sm"
                          className={`h-8 px-2 text-sm ${hasReacted ? 'bg-primary/20' : ''}`}
                          onClick={() => handleReaction(comment.id, emoji)}
                          disabled={!user}
                        >
                          {emoji} {count > 0 && count}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
