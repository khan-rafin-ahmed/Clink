import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { updateEvent } from '@/lib/eventService'
import type { Event } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const formSchema = z.object({
  title: z.string().min(1, 'Session name is required'),
  date_time: z.date(),
  location: z.string().min(1, 'Location is required'),
  drink_type: z.string().min(1, 'Drink type is required'),
  vibe: z.string().min(1, 'Vibe is required'),
  notes: z.string().optional(),
  is_public: z.boolean(),
})

interface EditEventModalProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdated: () => void
}

export function EditEventModal({ event, open, onOpenChange, onEventUpdated }: EditEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      date_time: new Date(event.date_time),
      location: event.location,
      drink_type: event.drink_type || 'beer',
      vibe: event.vibe || 'casual',
      notes: event.notes || '',
      is_public: event.is_public,
    },
  })

  // Reset form when event changes
  useEffect(() => {
    form.reset({
      title: event.title,
      date_time: new Date(event.date_time),
      location: event.location,
      drink_type: event.drink_type || 'beer',
      vibe: event.vibe || 'casual',
      notes: event.notes || '',
      is_public: event.is_public,
    })
  }, [event, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const updateData = {
        title: values.title,
        date_time: values.date_time.toISOString(),
        location: values.location,
        drink_type: values.drink_type,
        vibe: values.vibe,
        notes: values.notes || null,
        is_public: values.is_public,
      }

      await updateEvent(event.id, updateData)
      toast.success('Session updated successfully! 🍺')
      onOpenChange(false)
      onEventUpdated()
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground">
            Edit Session 🍺
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Name</FormLabel>
                  <FormControl>
                    <Input placeholder="What's the occasion?" {...field} />
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
                  <FormLabel>Date & Time</FormLabel>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Where's the party?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="drink_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drink Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick your poison" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beer">🍺 Beer</SelectItem>
                        <SelectItem value="cocktails">🍸 Cocktails</SelectItem>
                        <SelectItem value="wine">🍷 Wine</SelectItem>
                        <SelectItem value="shots">🥃 Shots</SelectItem>
                        <SelectItem value="mixed">🍹 Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vibe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vibe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="What's the mood?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="casual">😎 Casual</SelectItem>
                        <SelectItem value="party">🎉 Party</SelectItem>
                        <SelectItem value="chill">😌 Chill</SelectItem>
                        <SelectItem value="wild">🤪 Wild</SelectItem>
                        <SelectItem value="classy">🥂 Classy</SelectItem>
                        <SelectItem value="other">🤷 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'public')} defaultValue={field.value ? 'public' : 'private'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">🌍 Public - Anyone can join</SelectItem>
                      <SelectItem value="private">🔒 Private - Invite only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions, dress code, or details..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Session'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
