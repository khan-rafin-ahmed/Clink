import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Users, Mail, Clock, CheckCircle, XCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile } from '@/types'

interface InvitationMember {
  user_id: string
  display_name: string
  nickname?: string
  avatar_url?: string
  username: string
  status: 'pending' | 'accepted' | 'declined' | 'going'
  invitation_type: 'direct' | 'crew'
  invited_at: string
  crew_name?: string
}

interface CurrentInvitationsProps {
  eventId: string
  onRemoveInvitation?: (userId: string) => void
  className?: string
}

export function CurrentInvitations({
  eventId,
  onRemoveInvitation,
  className
}: CurrentInvitationsProps) {
  const [invitations, setInvitations] = useState<InvitationMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) {
      loadCurrentInvitations()
    }
  }, [eventId])

  const loadCurrentInvitations = async () => {
    try {
      setLoading(true)

      // Get direct invitations from event_members
      const { data: directInvites, error: directError } = await supabase
        .from('event_members')
        .select(`
          user_id,
          status,
          invitation_type,
          created_at,
          user_profiles!inner(
            display_name,
            nickname,
            avatar_url,
            username
          )
        `)
        .eq('event_id', eventId)
        .eq('invitation_type', 'direct')

      if (directError) throw directError

      // Get RSVP data for additional status info
      const { data: rsvps, error: rsvpError } = await supabase
        .from('rsvps')
        .select(`
          user_id,
          status,
          created_at,
          user_profiles!inner(
            display_name,
            nickname,
            avatar_url,
            username
          )
        `)
        .eq('event_id', eventId)

      if (rsvpError) throw rsvpError

      // Get crew invitations
      const { data: crewInvites, error: crewError } = await supabase
        .from('event_members')
        .select(`
          user_id,
          status,
          invitation_type,
          created_at,
          crew_id,
          user_profiles!inner(
            display_name,
            nickname,
            avatar_url,
            username
          ),
          crews!inner(name)
        `)
        .eq('event_id', eventId)
        .eq('invitation_type', 'crew')

      if (crewError) throw crewError

      // Combine and format all invitations
      const allInvitations: InvitationMember[] = []

      // Add direct invitations
      directInvites?.forEach(invite => {
        const profile = invite.user_profiles as any
        allInvitations.push({
          user_id: invite.user_id,
          display_name: profile.display_name,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
          username: profile.username,
          status: invite.status as any,
          invitation_type: 'direct',
          invited_at: invite.created_at
        })
      })

      // Add crew invitations
      crewInvites?.forEach(invite => {
        const profile = invite.user_profiles as any
        const crew = invite.crews as any
        allInvitations.push({
          user_id: invite.user_id,
          display_name: profile.display_name,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
          username: profile.username,
          status: invite.status as any,
          invitation_type: 'crew',
          invited_at: invite.created_at,
          crew_name: crew.name
        })
      })

      // Add RSVP data (for users who joined without explicit invitation)
      rsvps?.forEach(rsvp => {
        const profile = rsvp.user_profiles as any
        const existingInvite = allInvitations.find(inv => inv.user_id === rsvp.user_id)
        
        if (!existingInvite) {
          allInvitations.push({
            user_id: rsvp.user_id,
            display_name: profile.display_name,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            username: profile.username,
            status: rsvp.status as any,
            invitation_type: 'direct',
            invited_at: rsvp.created_at
          })
        } else {
          // Update status if RSVP is more recent
          if (rsvp.status === 'going') {
            existingInvite.status = 'going'
          }
        }
      })

      // Sort by invitation date (newest first)
      allInvitations.sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime())

      setInvitations(allInvitations)
    } catch (error) {
      console.error('Error loading current invitations:', error)
      toast.error('Failed to load current invitations')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'going':
      case 'accepted':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Joined
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const handleRemoveInvitation = async (userId: string) => {
    if (!onRemoveInvitation) return

    try {
      await onRemoveInvitation(userId)
      // Reload invitations to reflect changes
      await loadCurrentInvitations()
      toast.success('Invitation removed')
    } catch (error) {
      console.error('Error removing invitation:', error)
      toast.error('Failed to remove invitation')
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Current Invitations</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">
          Current Invitations ({invitations.length})
        </h3>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-8 bg-glass border border-white/10 rounded-xl">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No invitations sent yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {invitations.map((invitation) => (
            <div
              key={invitation.user_id}
              className="flex items-center justify-between p-3 bg-glass border border-white/10 rounded-xl"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={invitation.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm">
                    {invitation.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {invitation.display_name}
                    </p>
                    {invitation.nickname && (
                      <p className="text-xs text-yellow-400 italic truncate">
                        aka {invitation.nickname}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400 truncate">
                      @{invitation.username}
                    </p>
                    
                    {invitation.invitation_type === 'crew' && invitation.crew_name && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">
                          via {invitation.crew_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Invited {new Date(invitation.invited_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(invitation.status)}
                
                {onRemoveInvitation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInvitation(invitation.user_id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
