import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserSearchInvite } from '@/components/shared/UserSearchInvite'
import { MemberList } from '@/components/shared/MemberList'
import { InviteLinkGenerator } from '@/components/shared/InviteLinkGenerator'
import { updateCrew, getCrewMembers, inviteUserToCrew, createCrewInviteLink, promoteToCoHost, demoteCoHost, removeCrewMember, hasCrewManagementPermissions } from '@/lib/crewService'
import { notificationTriggers } from '@/lib/notificationService'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Crew, CrewMember, UserProfile } from '@/types'

interface EditCrewModalProps {
  isOpen: boolean
  onClose: () => void
  crew: Crew
  onCrewUpdated: () => void
}

export function EditCrewModal({ isOpen, onClose, crew, onCrewUpdated }: EditCrewModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [members, setMembers] = useState<CrewMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
  const [selectedCrews, setSelectedCrews] = useState<Crew[]>([])

  const [formData, setFormData] = useState<{
    name: string
    description: string
    vibe: Crew['vibe']
    visibility: 'public' | 'private'
  }>({
    name: '',
    description: '',
    vibe: 'casual',
    visibility: 'private'
  })

  // Initialize form data when crew changes
  useEffect(() => {
    if (crew) {
      setFormData({
        name: crew.name || '',
        description: crew.description || '',
        vibe: crew.vibe,
        visibility: crew.visibility || 'private'
      })
    }
  }, [crew])

  // Load crew members and check permissions when modal opens
  useEffect(() => {
    if (isOpen && crew && user) {
      loadCrewMembers()
      checkManagementPermissions()
    }
  }, [isOpen, crew, user])

  const loadCrewMembers = async () => {
    if (!crew) return
    try {
      setLoadingMembers(true)
      const crewMembers = await getCrewMembers(crew.id)
      setMembers(crewMembers)
    } catch (error: any) {
      console.error('Error loading crew members:', error)
      toast.error('Failed to load crew members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const checkManagementPermissions = async () => {
    if (!crew || !user) return
    try {
      const hasPermissions = await hasCrewManagementPermissions(crew.id, user.id)
      setCanManage(hasPermissions)
    } catch (error) {
      console.error('Error checking permissions:', error)
      setCanManage(false)
    }
  }

  // Handlers for UserSearchInvite component
  const handleUserSelect = (user: UserProfile) => {
    setSelectedUsers(prev => [...prev, user])
  }

  const handleCrewSelect = (selectedCrew: Crew) => {
    setSelectedCrews(prev => [...prev, selectedCrew])
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.user_id !== userId))
  }

  const handleRemoveCrew = (crewId: string) => {
    setSelectedCrews(prev => prev.filter(c => c.id !== crewId))
  }

  const handleSendInvitations = async () => {
    if (!crew) return

    try {
      // Invite selected users
      for (const user of selectedUsers) {
        await inviteUserToCrew(crew.id, user.user_id)
      }

      // Note: Crew invitations would need additional logic
      // For now, we'll focus on user invitations

      toast.success(`🍺 ${selectedUsers.length} invitation${selectedUsers.length !== 1 ? 's' : ''} sent!`)
      setSelectedUsers([])
      setSelectedCrews([])
      loadCrewMembers()
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send some invitations')
    }
  }

  const handleGenerateInviteLink = async (): Promise<string> => {
    if (!crew) throw new Error('No crew selected')
    return await createCrewInviteLink(crew.id)
  }

  const handlePromote = async (userId: string) => {
    if (!crew) return

    try {
      await promoteToCoHost(crew.id, userId)
      toast.success('🍺 Member promoted to co-host!')

      // Send notification to the promoted user
      await notificationTriggers.onCoHostPromotion(crew.id, crew.name, userId)

      loadCrewMembers()
    } catch (error) {
      console.error('Error promoting member:', error)
      toast.error('Failed to promote member')
    }
  }

  const handleDemote = async (userId: string) => {
    if (!crew) return
    await demoteCoHost(crew.id, userId)
    toast.success('🍺 Co-host demoted to member!')
    loadCrewMembers()
  }

  const handleRemove = async (userId: string) => {
    if (!crew) return
    await removeCrewMember(crew.id, userId)
    toast.success('🍺 Member removed from crew!')
    loadCrewMembers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Crew name is required')
      return
    }

    setIsLoading(true)
    try {
      await updateCrew(crew.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        vibe: formData.vibe,
        visibility: formData.visibility
      })
      toast.success('🍺 Crew updated successfully!')
      onCrewUpdated()
      onClose()
    } catch (error: any) {
      console.error('Error updating crew:', error)
      toast.error(error.message || 'Failed to update crew')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] sm:max-h-[80vh] bg-black border-gray-800 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Edit Crew</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your crew details, members, and invitations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 h-12 sm:h-10">
            <TabsTrigger
              value="details"
              className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black text-xs sm:text-sm px-2 sm:px-4"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black text-xs sm:text-sm px-2 sm:px-4"
            >
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger
              value="invite"
              className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black text-xs sm:text-sm px-2 sm:px-4"
            >
              Invite
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] sm:max-h-[50vh] overflow-y-auto px-1">
            <TabsContent value="details" className="space-y-6 mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crew Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Crew Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter crew name..."
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this crew about?"
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 resize-none"
              rows={3}
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          {/* Vibe */}
          <div className="space-y-2">
            <Label className="text-white">Vibe *</Label>
            <Select
              value={formData.vibe}
              onValueChange={(value: Crew['vibe']) => setFormData(prev => ({ ...prev, vibe: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select crew vibe" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="casual" className="text-white hover:bg-gray-800">🍺 Casual</SelectItem>
                <SelectItem value="party" className="text-white hover:bg-gray-800">🎉 Party</SelectItem>
                <SelectItem value="chill" className="text-white hover:bg-gray-800">😎 Chill</SelectItem>
                <SelectItem value="wild" className="text-white hover:bg-gray-800">🔥 Wild</SelectItem>
                <SelectItem value="classy" className="text-white hover:bg-gray-800">🥂 Classy</SelectItem>
                <SelectItem value="other" className="text-white hover:bg-gray-800">🤷 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-white">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, visibility: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="private" className="text-white hover:bg-gray-800">🔒 Private</SelectItem>
                <SelectItem value="public" className="text-white hover:bg-gray-800">🌍 Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.name.trim()}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Crew'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-6">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                  <span className="ml-2 text-gray-400">Loading members...</span>
                </div>
              ) : (
                <MemberList
                  members={members}
                  canManage={canManage}
                  currentUserId={user?.id}
                  onPromote={handlePromote}
                  onDemote={handleDemote}
                  onRemove={handleRemove}
                  isCreator={(userId) => crew.created_by === userId}
                />
              )}
            </TabsContent>

            {/* Invite Tab */}
            <TabsContent value="invite" className="space-y-6 mt-6">
              <UserSearchInvite
                onUserSelect={handleUserSelect}
                onCrewSelect={handleCrewSelect}
                selectedUsers={selectedUsers}
                selectedCrews={selectedCrews}
                onRemoveUser={handleRemoveUser}
                onRemoveCrew={handleRemoveCrew}
                existingAttendees={[]}
                loadingAttendees={false}
              />

              {/* Send Invitations Button */}
              {(selectedUsers.length > 0 || selectedCrews.length > 0) && (
                <div className="flex justify-end">
                  <Button onClick={handleSendInvitations} className="bg-primary hover:bg-primary/90">
                    Send {selectedUsers.length + selectedCrews.length} Invitation{selectedUsers.length + selectedCrews.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}

              <InviteLinkGenerator onGenerate={handleGenerateInviteLink} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
