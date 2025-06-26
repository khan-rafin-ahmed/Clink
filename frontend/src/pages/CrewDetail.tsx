import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getCrewById,
  getCrewMembers,
  inviteUserToCrew,
  inviteUserWithFallback,
  bulkInviteUsersToCrew,
  createCrewInviteLink,
  searchUsersForInvite,
  getCrewPendingRequests,
  deleteCrew,
  hasCrewManagementPermissions,
  removePendingCrewInvitation,
} from '@/lib/crewService'
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import { ClickableUserAvatar } from '@/components/ClickableUserAvatar'
import { EditCrewModal } from '@/components/EditCrewModal'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { generateUsernameFromDisplayName } from '@/lib/utils'
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
  Clock,
  Trash2,
  Edit,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Crew, CrewMember } from '@/types'

export function CrewDetail() {
  const { crewId } = useParams<{ crewId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [crew, setCrew] = useState<Crew | null>(null)
  const [members, setMembers] = useState<CrewMember[]>([])
  const [pendingRequests, setPendingRequests] = useState<CrewMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [inviteIdentifier, setInviteIdentifier] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [inviteResult, setInviteResult] = useState<{ success: boolean; shareLink?: string; message: string } | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [canManageCrew, setCanManageCrew] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      const [crewData, membersData, pendingData] = await Promise.all([
        getCrewById(crewId),
        getCrewMembers(crewId),
        getCrewPendingRequests(crewId)
      ])

      if (!crewData) {
        toast.error('Crew not found')
        navigate('/profile')
        return
      }

      setCrew(crewData)
      setMembers(membersData)
      setPendingRequests(pendingData)

      // Check management permissions
      if (user && crewId) {
        try {
          const hasPermissions = await hasCrewManagementPermissions(crewId, user.id)
          setCanManageCrew(hasPermissions)
        } catch (error) {
          console.error('Error checking permissions:', error)
          setCanManageCrew(false)
        }
      }
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
        const results = await searchUsersForInvite(query, crewId || undefined)
        setSearchResults(results)
        setLastSearchQuery(query)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [lastSearchQuery, crewId])

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

  const handleDeleteCrew = async () => {
    if (!crewId) return

    try {
      await deleteCrew(crewId)
      toast.success('🗑️ Crew deleted successfully!')
      navigate('/profile')
    } catch (error: any) {
      console.error('Error deleting crew:', error)
      toast.error(error.message || 'Failed to delete crew')
    }
  }

  const handleRemovePendingInvitation = async (userId: string, displayName: string) => {
    if (!crewId) return

    try {
      await removePendingCrewInvitation(crewId, userId)
      toast.success(`🗑️ Removed pending invitation for ${displayName}`)
      // Refresh crew data to update pending requests
      loadCrewData()
    } catch (error: any) {
      console.error('Error removing pending invitation:', error)
      toast.error(error.message || 'Failed to remove invitation')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_50%)] opacity-20"></div>

        <div className="relative flex h-screen items-center justify-center">
          <div className="text-center space-y-6 fade-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-white animate-pulse">
              <Users className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-lg text-muted-foreground font-medium">Loading crew...</p>
            </div>
          </div>
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

  const VibeIcon = ({ vibe }: { vibe: Crew['vibe'] }) => {
    const icons: Record<Crew['vibe'], typeof Users> = {
      casual: Users,
      party: PartyPopper,
      chill: Coffee,
      wild: Flame,
      classy: Crown,
      other: Star
    }
    const Icon = icons[vibe]
    return <Icon className="w-4 h-4" />
  }



  const isCreator = crew.is_creator

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_70%)] opacity-10"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center gap-4 fade-in">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/profile')}
            className="group backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Button>
        </div>

        {/* Enhanced Top Section - Crew Info */}
        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-3 sm:space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <VibeIcon vibe={crew.vibe} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl sm:text-2xl font-display text-white">{crew.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="capitalize bg-white/10 text-white border-white/20">
                        <VibeIcon vibe={crew.vibe} />
                        <span className="ml-1">{crew.vibe}</span>
                      </Badge>
                      <Badge variant={crew.visibility === 'public' ? 'default' : 'outline'} className="bg-white/8 text-white border-white/15">
                        {crew.visibility === 'public' ? (
                          <><Globe className="w-3 h-3 mr-1 text-[#CFCFCF]" />Public</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1 text-[#CFCFCF]" />Private</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-[#B3B3B3] flex-wrap">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#CFCFCF]" />
                    <span>{crew.member_count || 0} members</span>
                  </div>
                  {pendingRequests.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#CFCFCF]" />
                      <span>{pendingRequests.length} pending</span>
                    </div>
                  )}
                </div>

                {crew.description && (
                  <p className="text-[#B3B3B3] mt-2 leading-relaxed">{crew.description}</p>
                )}
              </div>

              {(isCreator || canManageCrew) && (
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {canManageCrew && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      className="bg-yellow-600/10 text-yellow-400 hover:bg-yellow-600/20 hover:text-yellow-300 border-yellow-600/30"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Crew
                    </Button>
                  )}

                  {isCreator && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateInviteLink}
                        className="bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white border-white/20"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}

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
                      <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Members
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-bold">Invite Members</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                          Search for users to invite to your crew
                        </p>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Search Input */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              placeholder="Search by username..."
                              value={inviteIdentifier}
                              onChange={(e) => {
                                setInviteIdentifier(e.target.value)
                                handleSearchUsers(e.target.value)
                              }}
                              className="pr-10"
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && !isSearching && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Found {searchResults.length} user{searchResults.length > 1 ? 's' : ''}</h4>
                              {selectedUsers.size > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                  {selectedUsers.size} selected
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {searchResults.map((result) => {
                                const isSelected = selectedUsers.has(result.user_id)
                                return (
                                  <div
                                    key={result.user_id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                                      isSelected
                                        ? 'bg-white/20 border-white/40 shadow-sm'
                                        : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => handleToggleUserSelection(result.user_id)}
                                  >
                                    <Avatar className="w-10 h-10">
                                      <AvatarImage src={result.avatar_url || undefined} />
                                      <AvatarFallback className="bg-white/10 text-white font-bold">
                                        {result.display_name?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                      <p className={`font-medium text-sm ${isSelected ? 'text-white' : ''}`}>{result.display_name}</p>
                                      <p className={`text-xs ${isSelected ? 'text-[#B3B3B3]' : 'text-muted-foreground'}`}>Click to select</p>
                                    </div>

                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-white border-white text-black'
                                        : 'border-muted-foreground/30'
                                    }`}>
                                      {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* No Results */}
                        {inviteIdentifier.trim() && searchResults.length === 0 && !isSearching && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No available users found with that username</p>
                            <p className="text-xs mt-1">Users already in this crew won't appear in results</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          {selectedUsers.size > 0 ? (
                            <>
                              <Button
                                onClick={handleInviteSelectedUsers}
                                disabled={isInviting}
                                className="flex-1 bg-white text-black hover:bg-white/90 font-bold h-11"
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
                                className="h-11"
                              >
                                Clear
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleInviteUser()}
                              disabled={isInviting || !inviteIdentifier.trim()}
                              className="flex-1 h-11"
                              variant="outline"
                            >
                              {isInviting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <UserPlus className="w-4 h-4 mr-2" />
                              )}
                              Quick Invite
                            </Button>
                          )}
                        </div>

                        {/* User Not Found - Share Options */}
                        {inviteResult && !inviteResult.success && (
                          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/20">
                            <div className="text-center space-y-2">
                              <p className="text-sm font-medium text-white">
                                ❌ We didn't find anyone with that username.
                              </p>
                              <p className="text-sm font-bold text-white">
                                Wanna bring them to the party?
                              </p>
                              <p className="text-xs text-[#B3B3B3]">
                                Share this invite link to Thirstee 👉
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleCopyShareLink}
                                variant="outline"
                                className="flex-1 border-white/30 text-white hover:bg-white/10"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </Button>
                              <Button
                                onClick={handleNativeShare}
                                className="flex-1 bg-white text-black hover:bg-white/90 font-bold"
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
                                className="text-[#B3B3B3] hover:text-white hover:bg-white/10"
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
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <Card className="glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-[#CFCFCF]" />
                Pending Invites ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid gap-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <ClickableUserAvatar
                        userId={request.user_id}
                        displayName={request.user?.display_name}
                        avatarUrl={request.user?.avatar_url}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {request.user?.display_name || 'Anonymous'}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-white/10 text-[#B3B3B3] border-white/20">
                            <Clock className="w-3 h-3 mr-1 text-[#CFCFCF]" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-[#B3B3B3]">
                          Invited {new Date(request.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Profile View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          const username = request.user?.display_name
                            ? generateUsernameFromDisplayName(request.user.display_name)
                            : request.user_id.slice(-8)
                          navigate(`/profile/${username}`)
                        }}
                        className="text-xs border-white/20 text-[#B3B3B3] hover:text-white hover:bg-white/10 hover:border-white/40 transition-colors"
                      >
                        View
                      </Button>

                      {/* Remove Invitation Button - Only for crew creator */}
                      {isCreator && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemovePendingInvitation(request.user_id, request.user?.display_name || 'Anonymous')
                          }}
                          className="text-xs border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Section */}
        <Card className="glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-[#CFCFCF]" />
              Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {members.length === 0 ? (
              <p className="text-center text-[#B3B3B3] py-8">No members yet</p>
            ) : (
              <div className="grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <ClickableUserAvatar
                        userId={member.user_id}
                        displayName={member.user?.display_name}
                        avatarUrl={member.user?.avatar_url}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">
                            {member.user?.display_name || 'Anonymous'}
                          </span>
                          {member.user_id === crew.created_by && (
                            <Badge variant="secondary" className="text-xs bg-white/10 text-white border-white/20">
                              <Crown className="w-3 h-3 mr-1 text-[#CFCFCF]" />
                              Host
                            </Badge>
                          )}
                        </div>
                        {member.user?.nickname && (
                          <p className="text-sm text-yellow-400 italic">
                            aka {member.user.nickname} 🍻
                          </p>
                        )}
                        <p className="text-sm text-[#B3B3B3]">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Profile View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        const username = member.user?.display_name
                          ? generateUsernameFromDisplayName(member.user.display_name)
                          : member.user_id.slice(-8)
                        navigate(`/profile/${username}`)
                      }}
                      className="ml-2 text-xs border-white/20 text-[#B3B3B3] hover:text-white hover:bg-white/10 hover:border-white/40 transition-colors"
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {crew && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteCrew}
          title="Delete Crew?"
          description="Are you sure you want to delete this crew? All members will be removed and this action cannot be undone."
          itemName={crew.name}
          itemType="crew"
        />
      )}

      {/* Edit Crew Modal */}
      {crew && (
        <EditCrewModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          crew={crew}
          onCrewUpdated={() => {
            loadCrewData()
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}
