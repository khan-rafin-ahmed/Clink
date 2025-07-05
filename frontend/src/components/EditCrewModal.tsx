import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserSearchInvite } from '@/components/shared/UserSearchInvite'
import { MemberList } from '@/components/shared/MemberList'
import { InviteLinkGenerator } from '@/components/shared/InviteLinkGenerator'
import { updateCrew, getCrewMembers, inviteUserToCrew, createCrewInviteLink, promoteToCoHost, demoteCoHost, removeCrewMember, hasCrewManagementPermissions } from '@/lib/crewService'
import { notificationTriggers } from '@/lib/notificationService'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Loader2, Globe, Lock } from 'lucide-react'
import type { Crew, CrewMember, UserProfile } from '@/types'

interface EditCrewModalProps {
  isOpen: boolean
  onClose: () => void
  crew: Crew
  onCrewUpdated: () => void
}

export function EditCrewModal({ isOpen, onClose, crew, onCrewUpdated }: EditCrewModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
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
      setStep(1) // Reset to first step
      setSelectedUsers([]) // Reset selections
      setSelectedCrews([])
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
      toast.success('👑 Member promoted to co-host!')

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
    try {
      await demoteCoHost(crew.id, userId)
      toast.success('👑 Co-host demoted to member!')

      // Send notification to the demoted user
      await notificationTriggers.onCoHostDemotion(crew.id, crew.name, userId)

      loadCrewMembers()
    } catch (error) {
      console.error('Error demoting co-host:', error)
      toast.error('Failed to demote co-host')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!crew) return
    await removeCrewMember(crew.id, userId)
    toast.success('🍺 Member removed from crew!')
    loadCrewMembers()
  }



  // Navigation functions
  const nextStep = () => {
    if (step < 2) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0
      case 2:
        return true // Invitations are optional
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (step !== 2) return

    if (!formData.name.trim()) {
      toast.error('Crew name is required')
      return
    }

    setIsSubmitting(true)
    try {
      // Update crew details
      await updateCrew(crew.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        vibe: formData.vibe,
        visibility: formData.visibility
      })

      // Send invitations if any users/crews selected
      let invitationCount = 0
      if (selectedUsers.length > 0) {
        for (const user of selectedUsers) {
          await inviteUserToCrew(crew.id, user.user_id)
          invitationCount++
        }
      }

      if (invitationCount > 0) {
        toast.success(`🍺 Crew updated and ${invitationCount} invitation${invitationCount > 1 ? 's' : ''} sent!`)
      } else {
        toast.success('🍺 Crew updated successfully!')
      }

      onCrewUpdated()
      onClose()
    } catch (error: any) {
      console.error('Error updating crew:', error)
      toast.error(error.message || 'Failed to update crew')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0 glass-modal border-white/20">
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-display font-bold text-foreground text-shadow">
            Edit Your Crew 🍺
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your crew details, members, and invitations. Step {step} of 2.
          </DialogDescription>
          <div className="flex space-x-2 mt-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full ${
                  i <= step
                    ? 'bg-gradient-primary shadow-white'
                    : 'bg-white/20 glass-effect'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="space-y-6 mt-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Crew Details */}
              <div className="space-y-4">
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
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    maxLength={50}
                    disabled={isSubmitting}
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
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400 resize-none"
                    rows={3}
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Vibe */}
                <div className="space-y-2">
                  <Label className="text-white">Vibe *</Label>
                  <Select
                    value={formData.vibe}
                    onValueChange={(value: Crew['vibe']) => setFormData(prev => ({ ...prev, vibe: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select crew vibe" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#08090A] border-white/10">
                      <SelectItem value="casual" className="text-white hover:bg-white/10">🍺 Casual</SelectItem>
                      <SelectItem value="party" className="text-white hover:bg-white/10">🎉 Party</SelectItem>
                      <SelectItem value="chill" className="text-white hover:bg-white/10">😎 Chill</SelectItem>
                      <SelectItem value="wild" className="text-white hover:bg-white/10">🔥 Wild</SelectItem>
                      <SelectItem value="classy" className="text-white hover:bg-white/10">🥂 Classy</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-white/10">🤷 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                  <Label className="text-white">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, visibility: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#08090A] border-white/10">
                      <SelectItem value="private" className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Private
                        </div>
                      </SelectItem>
                      <SelectItem value="public" className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Members Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Crew Members</h3>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="ml-2 text-muted-foreground">Loading members...</span>
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
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
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
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="px-6 order-2 sm:order-1"
            >
              Back
            </Button>
          )}

          {step < 2 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex-1 font-semibold order-1 sm:order-2"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 font-semibold order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Crew 🍺'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
