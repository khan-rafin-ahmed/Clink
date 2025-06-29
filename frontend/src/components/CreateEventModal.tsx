import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserSearchInvite } from '@/components/shared/UserSearchInvite'
import { createEvent } from '@/lib/eventService'
import { bulkInviteUsers } from '@/lib/memberService'
import { sendEventInvitationsToCrew } from '@/lib/eventInvitationService'
import type { CreateEventDto, UserProfile, Crew } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date_time: z.date(),
  end_time: z.date(),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
}).refine((data) => data.end_time > data.date_time, {
  message: "End time must be after start time",
  path: ["end_time"],
})

interface CreateEventModalProps {
  onEventCreated: () => void
}

export function CreateEventModal({ onEventCreated }: CreateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const { user } = useAuth()

  // Invitation state
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
  const [selectedCrews, setSelectedCrews] = useState<Crew[]>([])

  const handleUserSelect = (user: UserProfile) => {
    if (!selectedUsers.some(selected => selected.user_id === user.user_id)) {
      setSelectedUsers(prev => [...prev, user])
    }
  }

  const handleCrewSelect = (crew: Crew) => {
    if (!selectedCrews.some(selected => selected.id === crew.id)) {
      setSelectedCrews(prev => [...prev, crew])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.user_id !== userId))
  }

  const handleRemoveCrew = (crewId: string) => {
    setSelectedCrews(prev => prev.filter(crew => crew.id !== crewId))
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      date_time: new Date(),
      end_time: new Date(Date.now() + 3 * 60 * 60 * 1000), // Default to 3 hours later
      location: '',
      notes: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      if (!user) {
        toast.error('You must be logged in to create an event.')
        setIsSubmitting(false)
        return
      }

      const eventData: CreateEventDto = {
        title: values.title,
        date_time: values.date_time.toISOString(),
        end_time: values.end_time.toISOString(),
        location: values.location,
        notes: values.notes || null,
        is_public: true,
        created_by: user.id
      }

      const newEvent = await createEvent(eventData)

      // Send invitations if any users or crews are selected
      let invitationCount = 0

      // Invite individual users
      if (selectedUsers.length > 0) {
        try {
          await bulkInviteUsers(newEvent.id, selectedUsers.map(u => u.user_id), user.id)
          invitationCount += selectedUsers.length
        } catch (error) {
          console.error('Error inviting users:', error)
          toast.error('Failed to invite some users')
        }
      }

      // Invite crews
      if (selectedCrews.length > 0) {
        try {
          for (const crew of selectedCrews) {
            const result = await sendEventInvitationsToCrew(newEvent.id, crew.id, user.id)
            invitationCount += result.invitedCount
          }
        } catch (error) {
          console.error('Error inviting crews:', error)
          toast.error('Failed to invite some crews')
        }
      }

      if (invitationCount > 0) {
        toast.success(`🍺 Event created and ${invitationCount} invitation${invitationCount > 1 ? 's' : ''} sent!`)
      } else {
        toast.success('Event created successfully!')
      }

      form.reset()
      setSelectedUsers([])
      setSelectedCrews([])
      setStep(1)
      setOpen(false)
      onEventCreated()
    } catch (error) {
      toast.error('Failed to create event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 2) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return form.formState.isValid
      case 2:
        return true // Invitations are optional
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a new drinking event and invite your friends.
          </DialogDescription>
          <div className="flex space-x-2 mt-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Event Details */}
        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="date_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date and Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP p')
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':')
                            const newDate = new Date(field.value)
                            newDate.setHours(parseInt(hours))
                            newDate.setMinutes(parseInt(minutes))
                            field.onChange(newDate)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP p')
                          ) : (
                            <span>Pick end date and time</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Input
                          type="time"
                          value={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':')
                            const newDate = new Date(field.value)
                            newDate.setHours(parseInt(hours))
                            newDate.setMinutes(parseInt(minutes))
                            field.onChange(newDate)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Event location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about the event"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </form>
          </Form>
        )}

        {/* Step 2: Invitations */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Invite People (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Invite individual users and crews to your event. You can skip this step and invite people later.
              </p>
            </div>

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
          </div>
        )}

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

          {step === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6 order-2 sm:order-1"
            >
              Cancel
            </Button>
          )}

          {step < 2 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex-1 font-semibold order-1 sm:order-2"
            >
              Next: Invite People
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              className="flex-1 font-semibold order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                'Create Event 🍺'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}