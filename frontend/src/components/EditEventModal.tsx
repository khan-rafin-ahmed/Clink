import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/UserAvatar'
import { LocationAutocomplete } from '@/components/LocationAutocomplete'
import { updateEvent } from '@/lib/eventService'
import { getUserCrews, getCrewMembers } from '@/lib/crewService'
import { bulkInviteCrewMembersToEvent } from '@/lib/memberService'
import { uploadEventCover } from '@/lib/fileUpload'
import { getDefaultCoverImage } from '@/lib/coverImageUtils'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Users, Check, Upload, X } from 'lucide-react'
import type { Event, LocationData, UserProfile } from '@/types'
import type { Crew, CrewMember } from '@/types'

interface EditEventModalProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdated: () => void
}

export function EditEventModal({ event, open, onOpenChange, onEventUpdated }: EditEventModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([])
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string>('')
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [loadingCrews, setLoadingCrews] = useState(false)

  // New invitation management state
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
  const [selectedCrews, setSelectedCrews] = useState<Crew[]>([])
  const [currentTab, setCurrentTab] = useState('details')

  // Convert event date to the format needed for datetime-local input
  const eventDate = new Date(event.date_time)
  const customTimeValue = eventDate.toISOString().slice(0, 16)

  const [formData, setFormData] = useState({
    title: event.title,
    place_nickname: (event as any).place_nickname || '',
    location: event.location,
    locationData: (event.latitude && event.longitude) ? {
      latitude: event.latitude,
      longitude: event.longitude,
      place_id: event.place_id || '',
      place_name: event.place_name || event.location,
      address: event.location
    } as LocationData : null,
    time: 'custom',
    drink_type: event.drink_type || 'beer',
    vibe: event.vibe || 'casual',
    notes: event.notes || '',
    start_time: customTimeValue,
    end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
    is_public: event.is_public,
    cover_image: null as File | null,
    cover_image_url: (event as any).cover_image_url || null
  })

  // Load user crews when modal opens
  useEffect(() => {
    if (open && user) {
      loadUserCrews()
    }
  }, [open, user])

  // Load crew members when crew is selected
  useEffect(() => {
    if (selectedCrew) {
      loadCrewMembers(selectedCrew)
    } else {
      setCrewMembers([])
      setSelectedInvitees([])
    }
  }, [selectedCrew])

  // Reset form when event changes
  useEffect(() => {
    const eventDate = new Date(event.date_time)
    const customTimeValue = eventDate.toISOString().slice(0, 16)

    setFormData({
      title: event.title,
      place_nickname: (event as any).place_nickname || '',
      location: event.location,
      locationData: (event.latitude && event.longitude) ? {
        latitude: event.latitude,
        longitude: event.longitude,
        place_id: event.place_id || '',
        place_name: event.place_name || event.location,
        address: event.location
      } as LocationData : null,
      time: 'custom',
      drink_type: event.drink_type || 'beer',
      vibe: event.vibe || 'casual',
      notes: event.notes || '',
      start_time: customTimeValue,
      end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
      is_public: event.is_public,
      cover_image: null,
      cover_image_url: (event as any).cover_image_url || null
    })
    setStep(1)
    // Reset crew selection when event changes
    setSelectedCrew('')
    setSelectedInvitees([])
    setCrewMembers([])
  }, [event])

  const loadUserCrews = async () => {
    if (!user?.id) return

    setLoadingCrews(true)
    try {
      const crews = await getUserCrews(user.id)
      setUserCrews(crews)
    } catch (error) {
      console.error('Error loading user crews:', error)
      toast.error('Failed to load crews')
    } finally {
      setLoadingCrews(false)
    }
  }

  const loadCrewMembers = async (crewId: string) => {
    try {
      const members = await getCrewMembers(crewId)
      // Filter out the current user from crew members
      const filteredMembers = members.filter(member => member.user_id !== user?.id)
      setCrewMembers(filteredMembers)
    } catch (error) {
      console.error('Error loading crew members:', error)
      toast.error('Failed to load crew members')
    }
  }

  const drinkTypes = [
    { value: 'beer', label: 'Beer', emoji: '🍺' },
    { value: 'wine', label: 'Wine', emoji: '🍷' },
    { value: 'whiskey', label: 'Whiskey', emoji: '🥃' },
    { value: 'cocktails', label: 'Cocktails', emoji: '🍸' },
    { value: 'shots', label: 'Shots', emoji: '🥂' },
    { value: 'mixed', label: 'Mixed', emoji: '🍹' }
  ]

  const timeOptions = [
    { value: 'now', label: 'Right Now', emoji: '🔥' },
    { value: 'custom', label: 'Pick Your Time', emoji: '⏰' }
  ]

  const vibes = [
    { value: 'casual', label: 'Casual Hang', emoji: '😎' },
    { value: 'party', label: 'Party Mode', emoji: '🎉' },
    { value: 'shots', label: 'Shots Night', emoji: '🥃' },
    { value: 'chill', label: 'Chill Vibes', emoji: '🌙' },
    { value: 'wild', label: 'Wild Night', emoji: '🔥' },
    { value: 'classy', label: 'Classy Evening', emoji: '🥂' }
  ]

  // Cover image handling
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cover image must be less than 5MB')
        return
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Cover image must be JPEG, PNG, or WebP')
        return
      }

      setFormData(prev => ({ ...prev, cover_image: file }))
    }
  }

  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image: null, cover_image_url: null }))
  }

  async function handleSubmit() {
    if (step !== 4) return

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Event title is required')
      return
    }

    // Validate time selection for custom events
    if (formData.time === 'custom') {
      if (!formData.start_time) {
        toast.error('Start time is required')
        return
      }
      if (!formData.end_time) {
        toast.error('End time is required')
        return
      }

      const startTime = new Date(formData.start_time)
      const endTime = new Date(formData.end_time)

      if (endTime <= startTime) {
        toast.error('End time must be after start time')
        return
      }
    }

    try {
      setIsSubmitting(true)

      // Upload cover image if provided
      let coverImageUrl = formData.cover_image_url
      if (formData.cover_image) {
        try {
          const uploadResult = await uploadEventCover(formData.cover_image, user!.id)
          coverImageUrl = uploadResult.url
        } catch (uploadError: any) {
          toast.error(`Failed to upload cover image: ${uploadError.message}`)
          // Continue with event update using existing cover
        }
      }

      // If no custom cover and vibe changed, update to new default
      if (!coverImageUrl && !formData.cover_image) {
        coverImageUrl = getDefaultCoverImage(formData.vibe)
      }

      // Calculate event time
      let eventDateTime = new Date()
      const now = new Date()

      if (formData.time === 'custom' && formData.start_time) {
        eventDateTime = new Date(formData.start_time)
      } else { // 'now' - Set to current time for immediate LIVE status
        eventDateTime = now
      }

      // Calculate end time
      let endDateTime: Date
      if (formData.time === 'custom' && formData.end_time) {
        endDateTime = new Date(formData.end_time)
      } else {
        // For 'now' events, default to 3 hours from start time
        endDateTime = new Date(eventDateTime.getTime() + (3 * 60 * 60 * 1000))
      }

      const updateData = {
        title: formData.title,
        place_nickname: formData.place_nickname || null,
        date_time: eventDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: formData.locationData?.place_name || formData.location,
        latitude: formData.locationData?.latitude || null,
        longitude: formData.locationData?.longitude || null,
        place_id: formData.locationData?.place_id || null,
        place_name: formData.locationData?.place_name || null,
        drink_type: formData.drink_type,
        vibe: formData.vibe,
        notes: formData.notes || null,
        is_public: formData.is_public,
        cover_image_url: coverImageUrl
      }

      console.log('Updating event with data:', updateData)
      await updateEvent(event.id, updateData)

      // Send invitations to selected crew members
      if (selectedInvitees.length > 0) {
        try {
          await bulkInviteCrewMembersToEvent(event.id, selectedInvitees, user!.id)
          toast.success(`🍺 Session updated and ${selectedInvitees.length} crew members invited!`)
        } catch (error) {
          console.error('Error inviting crew members:', error)
          toast.success('Session updated successfully! 🍺')
          toast.error('Failed to invite some crew members')
        }
      } else {
        toast.success('Session updated successfully! 🍺')
      }

      onOpenChange(false)
      onEventUpdated()
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0
      case 2:
        return formData.time && formData.drink_type
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (step < 5 && isStepValid()) {
        nextStep()
      } else if (step === 5) {
        handleSubmit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground">
            Edit Session 🍺
          </DialogTitle>
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">What's the session?</Label>
                <Input
                  id="title"
                  placeholder="Happy Hour Hangout, Stone Cold Sunday, etc."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="place_nickname" className="text-sm font-medium">Place Nickname <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="place_nickname"
                  placeholder="Swerve's House, The Rooftop Bar, etc."
                  value={formData.place_nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, place_nickname: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                />
              </div>

              <div>
                <LocationAutocomplete
                  label="Where's the party?"
                  placeholder="Search for bars, restaurants, venues..."
                  value={formData.locationData}
                  onChange={(locationData) => {
                    setFormData(prev => ({
                      ...prev,
                      locationData,
                      location: locationData?.place_name || ''
                    }))
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Time & Drinks */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">When's the party?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {timeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time: option.value }))}
                      className={`p-3 rounded-lg border text-center ${
                        formData.time === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{option.emoji}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
                {formData.time === 'custom' && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="mt-1"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="mt-1"
                        min={formData.start_time || new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">What's your poison?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {drinkTypes.map(drink => (
                    <button
                      key={drink.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, drink_type: drink.value }))}
                      className={`p-3 rounded-lg border text-center ${
                        formData.drink_type === drink.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{drink.emoji}</div>
                      <div className="text-xs font-medium">{drink.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vibe, Privacy & Notes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What's the vibe?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {vibes.map(vibe => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vibe: vibe.value }))}
                      className={`p-3 rounded-lg border text-center ${
                        formData.vibe === vibe.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{vibe.emoji}</div>
                      <div className="text-xs font-medium">{vibe.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label className="text-sm font-medium">Event Cover Image (optional)</Label>
                <div className="mt-2 space-y-3">
                  {/* Preview current cover */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-muted">
                    {formData.cover_image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(formData.cover_image)}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : formData.cover_image_url ? (
                      <div className="relative w-full h-full">
                        <img
                          src={formData.cover_image_url}
                          alt="Current cover"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="text-2xl opacity-60">
                            {vibes.find((v: any) => v.value === formData.vibe)?.emoji || '✨'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Default {formData.vibe} cover will be used
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                      <div className="w-full p-3 border border-border rounded-lg text-center cursor-pointer hover:border-primary/50">
                        <Upload className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">Upload Cover</div>
                        <div className="text-xs text-muted-foreground">Max 5MB</div>
                      </div>
                    </label>
                    {(formData.cover_image || formData.cover_image_url) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeCoverImage}
                        className="px-3"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Who can see this session?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                    className={`p-3 rounded-lg border text-center ${
                      formData.is_public
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg"><Globe className="w-5 h-5 mx-auto" /></div>
                    <div className="text-xs font-medium">Public</div>
                    <div className="text-xs text-muted-foreground">Everyone can see</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                    className={`p-3 rounded-lg border text-center ${
                      !formData.is_public
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg"><Lock className="w-5 h-5 mx-auto" /></div>
                    <div className="text-xs font-medium">Private</div>
                    <div className="text-xs text-muted-foreground">Invite only</div>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Special notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="BYOB, dress code, bring snacks, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 4: Invite Crew Members */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Invite Crew Members (Optional)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a crew to invite members to your session
                </p>
              </div>

              {/* Crew Selection */}
              <div>
                <Label className="text-sm font-medium">Select Crew</Label>
                {loadingCrews ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading crews...
                  </div>
                ) : userCrews.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No crews found</p>
                    <p className="text-xs">Create a crew first to invite members</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCrew('')}
                      className={`p-3 rounded-lg border text-left ${
                        selectedCrew === ''
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">No crew selected</div>
                      <div className="text-xs text-muted-foreground">Skip crew invitation</div>
                    </button>
                    {userCrews.map(crew => (
                      <button
                        key={crew.id}
                        type="button"
                        onClick={() => setSelectedCrew(crew.id)}
                        className={`p-3 rounded-lg border text-left ${
                          selectedCrew === crew.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">{crew.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {crew.member_count} members • {crew.visibility}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Crew Members Selection */}
              {selectedCrew && crewMembers.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">
                    Select Members to Invite ({selectedInvitees.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedInvitees.length === crewMembers.length) {
                          setSelectedInvitees([])
                        } else {
                          setSelectedInvitees(crewMembers.map(m => m.user_id))
                        }
                      }}
                      className="p-2 rounded-lg border border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    >
                      <div className="text-sm font-medium">
                        {selectedInvitees.length === crewMembers.length ? 'Deselect All' : 'Select All'}
                      </div>
                    </button>
                    {crewMembers.map(member => (
                      <button
                        key={member.user_id}
                        type="button"
                        onClick={() => {
                          setSelectedInvitees(prev =>
                            prev.includes(member.user_id)
                              ? prev.filter(id => id !== member.user_id)
                              : [...prev, member.user_id]
                          )
                        }}
                        className={`p-3 rounded-lg border text-left ${
                          selectedInvitees.includes(member.user_id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            userId={member.user_id}
                            displayName={member.user?.display_name}
                            avatarUrl={member.user?.avatar_url}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {member.user?.display_name || 'Anonymous User'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.user_id === userCrews.find(c => c.id === selectedCrew)?.created_by ? '👑 Host' : '🎟️ Member'}
                            </div>
                          </div>
                          {selectedInvitees.includes(member.user_id) && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedCrew && crewMembers.length === 0 && (
                <div className="text-center p-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No other members in this crew</p>
                  <p className="text-xs">You're the only member</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Enhanced Invitation Management */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Manage Invitations</h3>
                <p className="text-sm text-muted-foreground">
                  View current invitations and add new members to your session
                </p>
              </div>

              {/* Current Invitations Display */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">Current Invitations</h4>
                </div>

                <div className="bg-glass border border-white/10 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Current invitations will be displayed here
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    (Feature coming soon - comprehensive invitation management)
                  </p>
                </div>
              </div>

              {/* Add New Invitations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">Add New Invitations</h4>
                </div>

                <div className="bg-glass border border-white/10 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    User search and crew selection will be available here
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    (Feature coming soon - individual user and crew invitations)
                  </p>
                </div>
              </div>

              {/* Invitation Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-medium text-primary">Invitation Summary</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your existing invitations will be preserved when updating the event.
                  New invitations will be sent only to newly added members.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
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

            {step < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex-1 font-semibold order-1 sm:order-2"
              >
                {step === 4 ? 'Review Invitations' : 'Next'}
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
                  'Update Session 🍺'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
