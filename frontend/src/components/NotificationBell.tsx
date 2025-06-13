import { useState, useEffect } from 'react'
import { Bell, Check, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth-context'
import NotificationService, { type NotificationData } from '@/lib/notificationService'
import { respondToCrewInvitation } from '@/lib/crewService'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const notificationService = NotificationService.getInstance()

  // Load notifications when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [user?.id])

  // Load notifications when popover opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications()
    }
  }, [isOpen, user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const data = await notificationService.getUserNotifications(user.id)
      console.log('Loaded notifications:', data)

      // Debug crew invitation notifications specifically
      const crewInvitations = data.filter(n => n.type === 'crew_invitation')
      console.log('Crew invitation notifications:', crewInvitations)

      crewInvitations.forEach(notification => {
        console.log(`Notification ${notification.id}:`, {
          type: notification.type,
          read: notification.read,
          data: notification.data,
          hasCrewMemberId: !!notification.data?.crew_member_id,
          hasCrewId: !!notification.data?.crew_id,
          willShowButtons: notification.type === 'crew_invitation' && !notification.read && (notification.data?.crew_member_id || notification.data?.crew_id) && notification.id
        })
      })

      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user?.id) return
    
    try {
      const count = await notificationService.getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleCrewInvitationResponse = async (notificationId: string, crewMemberId: string | null, crewId: string | null, response: 'accepted' | 'declined') => {
    try {
      let memberIdToUse = crewMemberId

      // If crew_member_id is missing, try to find it using crew_id
      if (!memberIdToUse && crewId && user?.id) {
        console.log('Looking up crew_member_id for crew:', crewId, 'user:', user.id)
        const { data: member, error } = await supabase
          .from('crew_members')
          .select('id')
          .eq('crew_id', crewId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single()

        if (error) {
          console.error('Error finding crew member:', error)
        } else {
          console.log('Found crew member:', member)
        }

        memberIdToUse = member?.id || null
      }

      // If still no crew_member_id, try to find any pending invitation for this user
      if (!memberIdToUse && user?.id) {
        console.log('Trying to find any pending crew invitation for user:', user.id)
        const { data: member, error } = await supabase
          .from('crew_members')
          .select('id, crew_id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) {
          console.error('Error finding any pending crew member:', error)
        } else {
          console.log('Found pending crew member:', member)
        }

        memberIdToUse = member?.id || null
      }

      if (!memberIdToUse) {
        toast.error('Unable to process invitation - please try refreshing the page')
        return
      }

      console.log('Processing crew invitation response with member ID:', memberIdToUse)
      await respondToCrewInvitation(memberIdToUse, response)
      await markAsRead(notificationId)

      if (response === 'accepted') {
        toast.success('Joined the crew! 🍺')
      } else {
        toast.success('Crew invitation declined')
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error responding to crew invitation:', error)
      toast.error('Failed to respond to invitation')
    }
  }

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read && notification.id) {
      markAsRead(notification.id)
    }

    // Navigate to relevant page if data contains eventId or eventCode
    if (notification.data?.eventCode) {
      window.location.href = `/event/${notification.data.eventCode}`
    } else if (notification.data?.eventId) {
      window.location.href = `/event/${notification.data.eventId}`
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      event_rsvp: '🍺',
      event_reminder: '⏰',
      crew_invite_accepted: '🎯',
      crew_invitation: '🔔',
      event_update: '📝',
      event_cancelled: '❌'
    }
    return icons[type] || '🔔'
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">We'll let you know when something happens!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors",
                    !notification.read && "bg-primary/5 border-l-2 border-l-primary",
                    notification.type !== 'crew_invitation' && "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={notification.type !== 'crew_invitation' ? () => handleNotificationClick(notification) : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0">
                      {notification.type === 'crew_invitation' ? (
                        <Users className="w-4 h-4 text-primary mt-0.5" />
                      ) : (
                        getNotificationIcon(notification.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-foreground line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>

                      {/* Crew invitation actions */}
                      {notification.type === 'crew_invitation' && !notification.read && (notification.data?.crew_member_id || notification.data?.crew_id) && notification.id && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCrewInvitationResponse(
                                notification.id!,
                                notification.data?.crew_member_id || null,
                                notification.data?.crew_id || null,
                                'accepted'
                              )
                            }}
                            className="h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Join Crew
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCrewInvitationResponse(
                                notification.id!,
                                notification.data?.crew_member_id || null,
                                notification.data?.crew_id || null,
                                'declined'
                              )
                            }}
                            className="h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border p-2 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                loadNotifications()
                toast.success('Notifications refreshed')
              }}
            >
              Refresh notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
