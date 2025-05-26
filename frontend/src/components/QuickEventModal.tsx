import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { createEventWithShareableLink } from '@/lib/eventService'
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Copy, ExternalLink } from 'lucide-react'

interface QuickEventModalProps {
  onEventCreated?: () => void
  trigger?: React.ReactNode
}

export function QuickEventModal({ onEventCreated, trigger }: QuickEventModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [createdEvent, setCreatedEvent] = useState<{ share_url: string; event_code: string } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    time: 'now',
    drinkType: 'beer',
    vibe: 'casual',
    notes: '',
    customTime: '',
    isPublic: true,
    invitedUsers: [] as string[]
  })

  const drinkTypes = [
    { value: 'beer', label: 'Beer', emoji: '🍺' },
    { value: 'wine', label: 'Wine', emoji: '🍷' },
    { value: 'whiskey', label: 'Whiskey', emoji: '🥃' },
    { value: 'cocktails', label: 'Cocktails', emoji: '🍸' },
    { value: 'shots', label: 'Shots', emoji: '🥂' },
    { value: 'mixed', label: 'Mixed', emoji: '🍹' }
  ]

  const vibes = [
    { value: 'casual', label: 'Casual Hang', emoji: '😎' },
    { value: 'party', label: 'Party Mode', emoji: '🎉' },
    { value: 'shots', label: 'Shots Night', emoji: '🥃' },
    { value: 'chill', label: 'Chill Vibes', emoji: '🌙' },
    { value: 'wild', label: 'Wild Night', emoji: '🔥' },
    { value: 'classy', label: 'Classy Evening', emoji: '🥂' }
  ]

  const timeOptions = [
    { value: 'now', label: 'Right Now!', emoji: '🚀' },
    { value: 'tonight', label: 'Later Tonight', emoji: '🌙' },
    { value: 'custom', label: 'Custom Time', emoji: '⏰' }
  ]

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Only allow submission on step 3
    if (step !== 3) {
      return
    }

    if (!user) {
      toast.error('Please sign in to create an event')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate event time
      let eventDateTime = new Date()
      if (formData.time === 'tonight') {
        eventDateTime.setHours(20, 0, 0, 0) // 8 PM tonight
      } else if (formData.time === 'custom' && formData.customTime) {
        eventDateTime = new Date(formData.customTime)
      }

      console.log('Creating event:', formData)

      // Create event using the enhanced service
      const eventData = {
        title: formData.title,
        location: formData.location,
        date_time: eventDateTime.toISOString(),
        drink_type: formData.drinkType,
        vibe: formData.vibe,
        notes: formData.notes || undefined,
        is_public: formData.isPublic
      }

      console.log('Creating event with data:', eventData)

      const result = await createEventWithShareableLink(eventData)

      console.log('✅ Event created successfully:', result)

      // Store the created event data for the success step
      setCreatedEvent({
        share_url: result.share_url,
        event_code: result.event_code
      })

      // Move to success step (step 4)
      setStep(4)

      // Call the callback
      onEventCreated?.()
    } catch (error: any) {
      console.error('Error creating event:', error)
      toast.error(error.message || 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.location.trim()
      case 2:
        return formData.time && formData.drinkType
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const resetModal = () => {
    setFormData({
      title: '',
      location: '',
      time: 'now',
      drinkType: 'beer',
      vibe: 'casual',
      notes: '',
      customTime: '',
      isPublic: true,
      invitedUsers: []
    })
    setStep(1)
    setCreatedEvent(null)
  }

  const handleCopyLink = async () => {
    if (createdEvent?.share_url) {
      try {
        await navigator.clipboard.writeText(createdEvent.share_url)
        toast.success('📋 Share link copied to clipboard!')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        toast.error('Failed to copy link')
      }
    }
  }

  const handleCloseModal = () => {
    setOpen(false)
    // Reset after a short delay to avoid visual glitch
    setTimeout(resetModal, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (step < 3 && isStepValid()) {
        nextStep()
      } else if (step === 3) {
        handleSubmit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="font-heading font-bold">
            🍺 Start a Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground">
            {step === 4 ? '🎉 Session Created!' : 'Create Your Session'}
          </DialogTitle>
          {step < 4 && (
            <div className="flex space-x-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">What's the occasion?</Label>
                <Input
                  id="title"
                  placeholder="Beer O'Clock, Wine Wednesday, etc."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium">Where's the party?</Label>
                <Input
                  id="location"
                  placeholder="My place, The Local Bar, etc."
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Time & Drinks */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">When?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time: option.value }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
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
                  <Input
                    type="datetime-local"
                    value={formData.customTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, customTime: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">What are we drinking?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {drinkTypes.map(drink => (
                    <button
                      key={drink.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, drinkType: drink.value }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.drinkType === drink.value
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
                      className={`p-3 rounded-lg border text-center transition-colors ${
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

              <div>
                <Label className="text-sm font-medium">Who can see this session?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      formData.isPublic
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
                    onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      !formData.isPublic
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

          {/* Step 4: Success */}
          {step === 4 && createdEvent && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="text-6xl">🍻</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    Your session is live!
                  </h3>
                  <p className="text-muted-foreground">
                    Share this link with your friends to let them know about your session.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-2">Event Code</div>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {createdEvent.event_code}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-2">Share Link</div>
                  <div className="text-sm font-mono break-all text-foreground">
                    {createdEvent.share_url}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyLink}
                    className="flex-1"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={() => window.open(createdEvent.share_url, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Event
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && step < 4 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="px-6"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex-1 font-semibold"
              >
                Next
              </Button>
            ) : step === 3 ? (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  '🍻 Let\'s Do This!'
                )}
              </Button>
            ) : step === 4 ? (
              <Button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 font-semibold"
              >
                Done
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
