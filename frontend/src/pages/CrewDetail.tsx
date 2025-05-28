import { useState, useEffect, useCallback, useRef } from 'react'
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
  inviteUserToCrew,
  inviteUserWithFallback,
  bulkInviteUsersToCrew,
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
  Share2,
  Copy,
  ExternalLink,
  Check,
  X
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
  const [shareLink, setShareLink] = useState('')
  const [inviteResult, setInviteResult] = useState<{ success: boolean; shareLink?: string; message: string } | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

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

  const handleSearchUsers = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      setLastSearchQuery('')
      return
    }

    // Don't search if query hasn't changed
    if (query === lastSearchQuery) {
      return
    }

    setIsSearching(true)

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsersForInvite(query)
        setSearchResults(results)
        setLastSearchQuery(query)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [lastSearchQuery])

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleInviteSelectedUsers = async () => {
    if (!crewId || selectedUsers.size === 0) return

    setIsInviting(true)
    try {
      await bulkInviteUsersToCrew(crewId, Array.from(selectedUsers))
      toast.success(`🍻 ${selectedUsers.size} invite${selectedUsers.size > 1 ? 's' : ''} sent!`)
      setSelectedUsers(new Set())
      setSearchResults([])
      setInviteIdentifier('')
      setShowInviteModal(false)
      loadCrewData() // Refresh data
    } catch (error: any) {
      console.error('Error inviting users:', error)
      toast.error(error.message || 'Failed to send invites')
    } finally {
      setIsInviting(false)
    }
  }

  const handleInviteUser = async (userId?: string) => {
    if (!crewId) return

    setIsInviting(true)
    setInviteResult(null)

    try {
      if (userId) {
        // Invite by user ID from search results (direct invite)
        await inviteUserToCrew(crewId, userId)
        toast.success('🍻 Invite sent!')
        setInviteIdentifier('')
        setSearchResults([])
        setShowInviteModal(false)
        loadCrewData() // Refresh data
      } else {
        // Invite by identifier with fallback to share link
        if (!inviteIdentifier.trim()) {
          toast.error('Please enter a username')
          return
        }

        const result = await inviteUserWithFallback(crewId, inviteIdentifier)
        setInviteResult(result)

        if (result.success) {
          toast.success('🍻 Invite sent!')
          setInviteIdentifier('')
          setSearchResults([])
          setShowInviteModal(false)
          loadCrewData() // Refresh data
        } else {
          // User not found, show share options
          setShareLink(result.shareLink || '')
        }
      }
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

  const handleCopyShareLink = async () => {
    if (!shareLink) return

    try {
      await navigator.clipboard.writeText(shareLink)
      toast.success('📋 Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (!shareLink || !crew) return

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Join ${crew.name} crew on Thirstee`,
          text: `Hey! I'm inviting you to join my crew "${crew.name}". Come join us!`,
          url: shareLink,
        })
      } catch (error) {
        console.error('Failed to share:', error)
        // Fallback to copy
        handleCopyShareLink()
      }
    } else {
      // Fallback to copy link
      handleCopyShareLink()
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

                  <Dialog open={showInviteModal} onOpenChange={(open) => {
                    setShowInviteModal(open)
                    if (!open) {
                      // Reset state when modal closes
                      setInviteIdentifier('')
                      setSearchResults([])
                      setSelectedUsers(new Set())
                      setInviteResult(null)
                      setShareLink('')
                      setLastSearchQuery('')
                    }
                  }}>
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
                          <Label htmlFor="invite-input">Username</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="invite-input"
                              placeholder="Enter username..."
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

                          {/* Bulk Invite Button */}
                          {selectedUsers.size > 0 && (
                            <div className="flex gap-2">
                              <Button
                                onClick={handleInviteSelectedUsers}
                                disabled={isInviting}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                              >
                                {isInviting ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <UserPlus className="w-4 h-4 mr-2" />
                                )}
                                Invite {selectedUsers.size} User{selectedUsers.size > 1 ? 's' : ''}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedUsers(new Set())}
                                disabled={isInviting}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
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
                            <div className="flex items-center justify-between">
                              <Label className="text-sm text-muted-foreground">Search Results:</Label>
                              {selectedUsers.size > 0 && (
                                <span className="text-xs text-primary font-medium">
                                  {selectedUsers.size} selected
                                </span>
                              )}
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {searchResults.map((result) => {
                                const isSelected = selectedUsers.has(result.user_id)
                                return (
                                  <div
                                    key={result.user_id}
                                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-muted'
                                    }`}
                                    onClick={() => handleToggleUserSelection(result.user_id)}
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
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3" />}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* User Not Found - Share Options */}
                        {inviteResult && !inviteResult.success && (
                          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <div className="text-center space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                ❌ We didn't find anyone with that username.
                              </p>
                              <p className="text-sm font-bold">
                                Wanna bring them to the party?
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Share this invite link to Thirstee 👉
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleCopyShareLink}
                                variant="outline"
                                className="flex-1"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </Button>
                              <Button
                                onClick={handleNativeShare}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>

                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setInviteResult(null)
                                  setInviteIdentifier('')
                                  setShareLink('')
                                  setSelectedUsers(new Set())
                                  setSearchResults([])
                                  setLastSearchQuery('')
                                }}
                              >
                                Try Another Username
                              </Button>
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
