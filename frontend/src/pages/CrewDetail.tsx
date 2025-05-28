import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getCrewById,
  getCrewMembers,
  inviteUserByIdentifier,
  createCrewInviteLink,
  searchUsersForInvite,
  type Crew,
  type CrewMember
} from '@/lib/crewService'
import { toast } from 'sonner'
import {
  Users,
  Globe,
  Lock,
  Coffee,
  PartyPopper,
  Flame,
  Crown,
  Star,
  Loader2,
  ArrowLeft,
  UserPlus,
  Share2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CrewDetail() {
  const { crewId } = useParams<{ crewId: string }>()
  const navigate = useNavigate()
  const [crew, setCrew] = useState<Crew | null>(null)
  const [members, setMembers] = useState<CrewMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteIdentifier, setInviteIdentifier] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)

  const vibeIcons = {
    casual: Coffee,
    party: PartyPopper,
    chill: Coffee,
    wild: Flame,
    classy: Crown,
    other: Star
  }

  useEffect(() => {
    if (!crewId) {
      navigate('/profile')
      return
    }

    loadCrewData()
  }, [crewId])

  const loadCrewData = async () => {
    if (!crewId) return

    setIsLoading(true)
    try {
      const [crewData, membersData] = await Promise.all([
        getCrewById(crewId),
        getCrewMembers(crewId)
      ])

      if (!crewData) {
        toast.error('Crew not found')
        navigate('/profile')
        return
      }

      setCrew(crewData)
      setMembers(membersData)
    } catch (error: any) {
      console.error('Error loading crew data:', error)
      toast.error('Failed to load crew details')
      navigate('/profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsersForInvite(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInviteUser = async (userId?: string) => {
    if (!crewId) return

    setIsInviting(true)
    try {
      if (userId) {
        // Invite by user ID from search results
        await inviteUserByIdentifier(crewId, userId)
      } else {
        // Invite by identifier (username/email)
        if (!inviteIdentifier.trim()) {
          toast.error('Please enter a username or email')
          return
        }
        await inviteUserByIdentifier(crewId, inviteIdentifier)
      }

      toast.success('🍻 Invite sent!')
      setInviteIdentifier('')
      setSearchResults([])
      setShowInviteModal(false)
      loadCrewData() // Refresh data
    } catch (error: any) {
      console.error('Error inviting user:', error)
      toast.error(error.message || 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleCreateInviteLink = async () => {
    if (!crewId) return

    try {
      const inviteLink = await createCrewInviteLink(crewId, 7) // 7 days expiry
      await navigator.clipboard.writeText(inviteLink)
      toast.success('🔗 Invite link copied to clipboard!')
    } catch (error: any) {
      console.error('Error creating invite link:', error)
      toast.error('Failed to create invite link')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading crew...</span>
        </div>
      </div>
    )
  }

  if (!crew) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Crew Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">This crew doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate('/profile')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const VibeIcon = vibeIcons[crew.vibe] || Star
  const isCreator = crew.is_creator

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        {/* Top Section - Crew Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <VibeIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-display">{crew.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="capitalize">
                        <VibeIcon className="w-3 h-3 mr-1" />
                        {crew.vibe}
                      </Badge>
                      <Badge variant={crew.visibility === 'public' ? 'default' : 'outline'}>
                        {crew.visibility === 'public' ? (
                          <><Globe className="w-3 h-3 mr-1" />Public</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" />Private</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{crew.member_count || 0} members</span>
                  </div>
                </div>

                {crew.description && (
                  <p className="text-muted-foreground mt-2">{crew.description}</p>
                )}
              </div>

              {isCreator && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateInviteLink}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link
                  </Button>

                  <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Members</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-input">Username or Email</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="invite-input"
                              placeholder="Enter username or email..."
                              value={inviteIdentifier}
                              onChange={(e) => {
                                setInviteIdentifier(e.target.value)
                                handleSearchUsers(e.target.value)
                              }}
                            />
                            <Button
                              onClick={() => handleInviteUser()}
                              disabled={isInviting || !inviteIdentifier.trim()}
                            >
                              {isInviting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Invite'
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Search Results */}
                        {isSearching && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Searching...</span>
                          </div>
                        )}
                        {searchResults.length > 0 && !isSearching && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Search Results:</Label>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {searchResults.map((result) => (
                                <div
                                  key={result.user_id}
                                  className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted"
                                  onClick={() => handleInviteUser(result.user_id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={result.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {result.display_name?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{result.display_name}</span>
                                  </div>
                                  <Button size="sm" variant="ghost">
                                    <UserPlus className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No members yet</p>
            ) : (
              <div className="grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.user?.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.user?.display_name || 'Anonymous'}
                          </span>
                          {member.user_id === crew.created_by && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Host
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
