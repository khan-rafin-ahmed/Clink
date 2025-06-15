import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarStack } from '@/components/AvatarStack'
import { leaveCrew, getCrewMembers, createCrewInviteLink } from '@/lib/crewService'
import type { Crew, CrewMember } from '@/types'
import { EditCrewModal } from '@/components/EditCrewModal'
import { toast } from 'sonner'

import {
  Users,
  Crown,
  Globe,
  Lock,
  Coffee,
  PartyPopper,
  Flame,
  Star,
  MoreVertical,
  UserMinus,
  Share2,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CrewCardProps {
  crew: Crew
  onCrewUpdated?: () => void
}

export function CrewCard({ crew, onCrewUpdated }: CrewCardProps) {
  const navigate = useNavigate()
  const [showMembers, setShowMembers] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [members, setMembers] = useState<CrewMember[]>([])

  // Fetch crew members for avatar stack
  useEffect(() => {
    const fetchMembers = async () => {
      if (!crew.id) return

      try {
        const crewMembers = await getCrewMembers(crew.id)
        setMembers(crewMembers)
      } catch (error) {
        console.error('Error fetching crew members:', error)
      }
    }

    fetchMembers()
  }, [crew.id])

  const vibeIcons = {
    casual: Coffee,
    party: PartyPopper,
    chill: Coffee,
    wild: Flame,
    classy: Crown,
    other: Star
  }

  const vibeEmojis = {
    casual: '😎',
    party: '🎉',
    chill: '🧘',
    wild: '🔥',
    classy: '🥂',
    other: '⭐'
  }

  const VibeIcon = vibeIcons[crew.vibe] || Star

  const handleLeaveCrew = async () => {
    if (!confirm('Are you sure you want to leave this crew? You\'ll need to be re-invited to join again.')) {
      return
    }

    try {
      await leaveCrew(crew.id)
      toast.success('Left crew successfully')
      onCrewUpdated?.()
    } catch (error: any) {
      console.error('Error leaving crew:', error)
      toast.error(error.message || 'Failed to leave crew')
    }
  }

  const handleViewMembers = async () => {
    try {
      const crewMembers = await getCrewMembers(crew.id)
      setMembers(crewMembers)
      setShowMembers(true)
    } catch (error) {
      console.error('Error fetching crew members:', error)
      toast.error('Failed to fetch crew members')
    }
  }

  const handleShareCrew = async () => {
    try {
      const inviteLink = await createCrewInviteLink(crew.id, 7) // 7 days expiry
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invite link copied to clipboard! 🔗')
    } catch (error: any) {
      console.error('Error creating invite link:', error)
      toast.error('Failed to create invite link')
    }
  }

  return (
    <>
      <Card
        className="glass-border-ring group h-full flex flex-col cursor-pointer"
        tabIndex={0}
        role="button"
        aria-label={`View ${crew.name} crew details`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/crew/${crew.id}`)
          }
        }}
        onClick={() => navigate(`/crew/${crew.id}`)}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 glass-shimmer">
                <VibeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg text-white flex items-center gap-2 truncate" style={{ fontWeight: 600 }}>
                  <span className="truncate">{crew.name}</span>
                  {crew.is_creator && (
                    <div className="relative flex-shrink-0">
                      <Crown className="w-4 h-4 text-white float" />
                      <div className="absolute inset-0 w-4 h-4 text-white opacity-50 blur-sm">
                        <Crown className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <div className="glass-pill px-2 py-1 text-xs flex items-center gap-1 font-medium" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                    <VibeIcon className="w-3 h-3 text-[#CFCFCF]" />
                    <span className="text-white font-medium">{crew.vibe}</span>
                    <span className="text-[#CFCFCF]">{vibeEmojis[crew.vibe]}</span>
                  </div>
                  <div className="glass-pill px-2 py-1 text-xs flex items-center gap-1 bg-white/8 rounded-full" style={{
                    border: '1px solid hsla(0,0%,100%,.06)',
                    fontWeight: 500,
                    fontSize: '13px'
                  }}>
                    {crew.visibility === 'public' ? (
                      <><Globe className="w-3 h-3 text-[#CFCFCF]" /><span className="text-white">Public</span></>
                    ) : (
                      <><Lock className="w-3 h-3 text-[#CFCFCF]" /><span className="text-white">Private</span></>
                    )}
                  </div>
                  <div className="glass-pill px-2 py-1 text-xs flex items-center gap-1 bg-white/8 rounded-full" style={{
                    border: '1px solid hsla(0,0%,100%,.06)',
                    fontWeight: 500,
                    fontSize: '13px'
                  }}>
                    {crew.is_creator ? (
                      <><span className="text-[#CFCFCF]">👑</span><span className="text-white">Host</span></>
                    ) : (
                      <><span className="text-[#CFCFCF]">🎟️</span><span className="text-white">Member</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewMembers}>
                  <Users className="w-4 h-4 mr-2" />
                  View Members
                </DropdownMenuItem>
                {crew.is_creator && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Crew
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareCrew}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Create Invite Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!crew.is_creator && (
                  <DropdownMenuItem
                    onClick={handleLeaveCrew}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Leave Crew
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          {/* Description with improved typography - removed excess spacing */}
          {crew.description ? (
            <div className="mb-4 flex-shrink-0">
              <p className="text-sm leading-relaxed line-clamp-3 break-words" style={{ color: '#B3B3B3' }}>
                {crew.description}
              </p>
            </div>
          ) : (
            /* Placeholder for empty description to maintain visual balance */
            <div className="mb-4 flex-shrink-0">
              <p className="text-sm italic leading-relaxed" style={{ color: '#B3B3B3' }}>
                No description provided yet...
              </p>
            </div>
          )}

          {/* Spacer to push bottom content down */}
          <div className="flex-1"></div>

          {/* Consolidated Bottom Section - Avatar Stack, Member Count, and Action Button on Same Line */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: '24px' }}>
            <div className="flex items-center gap-3">
              {members.length > 0 ? (
                <AvatarStack members={members} max={5} size="sm" />
              ) : (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#B3B3B3' }}>
                  <Users className="w-4 h-4" />
                  <span>Loading...</span>
                </div>
              )}
              <p className="text-sm" style={{ color: '#B3B3B3' }}>
                {crew.member_count || 0} member{(crew.member_count || 0) !== 1 ? 's' : ''}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/crew/${crew.id}`)
              }}
              className="text-xs bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] px-3 py-1.5 h-auto"
              style={{ border: '1px solid hsla(0,0%,100%,.06)' }}
            >
              View Crew →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Dialog */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {crew.name} Members
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No members found</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {member.user?.display_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {member.user?.display_name || 'Unknown User'}
                      {member.user_id === crew.created_by && (
                        <Crown className="w-4 h-4 inline ml-2 text-white" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {crew.is_creator && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareCrew}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Invite More
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Crew Modal */}
      <EditCrewModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        crew={crew}
        onCrewUpdated={() => {
          onCrewUpdated?.()
          setShowEditModal(false)
        }}
      />
    </>
  )
}
