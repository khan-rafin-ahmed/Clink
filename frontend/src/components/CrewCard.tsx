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
import { cn } from '@/lib/utils'
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
      <Card className="glass-card glass-border-ring group h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 glass-shimmer">
                <VibeIcon className="w-5 h-5 text-accent-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 truncate">
                  <span className="truncate">{crew.name}</span>
                  {crew.is_creator && (
                    <div className="relative flex-shrink-0">
                      <Crown className="w-4 h-4 text-amber-500 float" />
                      <div className="absolute inset-0 w-4 h-4 text-amber-500 opacity-50 blur-sm">
                        <Crown className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <div className="glass-pill px-2 py-1 text-xs flex items-center gap-1 font-medium border-accent-primary/30 text-accent-primary">
                    <VibeIcon className="w-3 h-3" />
                    {crew.vibe} {vibeEmojis[crew.vibe]}
                  </div>
                  <div className={cn(
                    "glass-pill px-2 py-1 text-xs flex items-center gap-1 font-medium",
                    crew.visibility === 'public'
                      ? "border-accent-secondary/30 text-accent-secondary"
                      : "border-white/30 text-foreground"
                  )}>
                    {crew.visibility === 'public' ? (
                      <><Globe className="w-3 h-3" />Public</>
                    ) : (
                      <><Lock className="w-3 h-3" />Private</>
                    )}
                  </div>
                  <div className={cn(
                    "glass-pill px-2 py-1 text-xs flex items-center gap-1 font-medium",
                    crew.is_creator
                      ? "border-amber-500/30 text-amber-500"
                      : "border-blue-400/30 text-blue-400"
                  )}>
                    {crew.is_creator ? '👑 Host' : '🎟️ Member'}
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words">
                {crew.description}
              </p>
            </div>
          ) : (
            /* Placeholder for empty description to maintain visual balance */
            <div className="mb-4 flex-shrink-0">
              <p className="text-sm text-muted-foreground/60 italic leading-relaxed">
                No description provided yet...
              </p>
            </div>
          )}

          {/* Spacer to push bottom content down */}
          <div className="flex-1"></div>

          {/* Consolidated Bottom Section - Avatar Stack, Member Count, and Action Button on Same Line */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {members.length > 0 ? (
                <AvatarStack members={members} max={5} size="sm" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Loading...</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {crew.member_count || 0} member{(crew.member_count || 0) !== 1 ? 's' : ''}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/crew/${crew.id}`)}
              className="text-xs border-accent-primary/30 hover:border-accent-primary/50 hover:bg-accent-primary/10 px-3 py-1.5 h-auto"
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
                        <Crown className="w-4 h-4 inline ml-2 text-amber-500" />
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
