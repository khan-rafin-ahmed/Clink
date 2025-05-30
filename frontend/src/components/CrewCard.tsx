import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { leaveCrew, getCrewMembers, createCrewInviteLink, type Crew, type CrewMember } from '@/lib/crewService'
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
  Settings
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
  const [members, setMembers] = useState<CrewMember[]>([])

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
    } catch (error: any) {
      console.error('Error fetching crew members:', error)
      toast.error('Failed to load crew members')
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
      <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <VibeIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  {crew.name}
                  {crew.is_creator && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                    <VibeIcon className="w-3 h-3 mr-1" />
                    {crew.vibe} {vibeEmojis[crew.vibe]}
                  </Badge>
                  <Badge variant={crew.visibility === 'public' ? 'default' : 'outline'} className="text-xs whitespace-nowrap">
                    {crew.visibility === 'public' ? (
                      <><Globe className="w-3 h-3 mr-1" />Public</>
                    ) : (
                      <><Lock className="w-3 h-3 mr-1" />Private</>
                    )}
                  </Badge>
                  <Badge variant={crew.is_creator ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                    {crew.is_creator ? '👑 Host' : '🎟️ Member'}
                  </Badge>
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
                    <DropdownMenuItem onClick={handleShareCrew}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Create Invite Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/crew/${crew.id}`)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Crew
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

        <CardContent className="pt-0">
          {crew.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {crew.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{crew.member_count || 0} member{(crew.member_count || 0) !== 1 ? 's' : ''}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/crew/${crew.id}`)}
              className="text-xs"
            >
              View Crew
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
    </>
  )
}
