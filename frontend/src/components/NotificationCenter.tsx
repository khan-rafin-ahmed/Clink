import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification
} from '@/lib/followService'
import { respondToCrewInvitation } from '@/lib/crewService'
import { respondToEventInvitation } from '@/lib/eventService'
import { toast } from 'sonner'
import { Bell, Check, X, Users, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Poll for new notifications every 2 minutes to reduce HTTP requests
    const interval = setInterval(() => {
      loadUnreadCount()
      if (isOpen) {
        loadNotifications() // Refresh notifications when panel is open
      }
    }, 120000) // Changed from 30s to 2 minutes

    return () => clearInterval(interval)
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true)
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark notifications as read')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCrewInvitationResponse = async (notificationId: string, crewMemberId: string, response: 'accepted' | 'declined') => {
    try {
      await respondToCrewInvitation(crewMemberId, response)
      await handleMarkAsRead(notificationId)

      if (response === 'accepted') {
        toast.success('Joined the crew! 🍺')
      } else {
        toast.success('Crew invitation declined')
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error responding to crew invitation:', error)
      toast.error('Failed to respond to invitation')
    }
  }

  const handleEventInvitationResponse = async (notificationId: string, eventMemberId: string, response: 'accepted' | 'declined') => {
    try {
      await respondToEventInvitation(eventMemberId, response)
      await handleMarkAsRead(notificationId)

      if (response === 'accepted') {
        toast.success('Event invitation accepted! 🍻')
      } else {
        toast.success('Event invitation declined')
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error responding to event invitation:', error)
      toast.error('Failed to respond to invitation')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'crew_invitation':
        return <Users className="w-4 h-4" />
      case 'event_invitation':
      case 'event_update':
        return <Calendar className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const renderNotificationContent = (notification: Notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

    return (
      <div className={`p-3 border-b border-border last:border-b-0 ${!notification.read ? 'bg-primary/5' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
              </div>

              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Crew invitation actions */}
            {notification.type === 'crew_invitation' && !notification.read && notification.data?.crew_member_id && (
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleCrewInvitationResponse(
                    notification.id,
                    notification.data.crew_member_id,
                    'accepted'
                  )}
                  className="h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Join Crew
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCrewInvitationResponse(
                    notification.id,
                    notification.data.crew_member_id,
                    'declined'
                  )}
                  className="h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
            )}



            {/* Event invitation actions */}
            {notification.type === 'event_invitation' && !notification.read && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleEventInvitationResponse(
                    notification.id,
                    notification.data.event_member_id,
                    'accepted'
                  )}
                  className="h-7 px-3"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEventInvitationResponse(
                    notification.id,
                    notification.data.event_member_id,
                    'declined'
                  )}
                  className="h-7 px-3"
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Mark as read button for other notifications */}
            {!['crew_invitation', 'event_invitation'].includes(notification.type) && !notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkAsRead(notification.id)}
                className="h-7 px-3 mt-2"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Refresh notifications when opening the panel
      loadNotifications()
      loadUnreadCount()
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="max-w-[340px] p-0 bg-[#0E0E10]/90 backdrop-blur-md border-white/8 rounded-2xl shadow-xl" align="end">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-xs text-gray-300 hover:text-white hover:bg-white/8"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center px-4 py-4 text-gray-400 space-y-4">
              <Bell className="w-8 h-8 mx-auto opacity-50" />
              <div>
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs">We'll let you know when something happens!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map(notification => (
                <div key={notification.id} className="px-4 py-4">
                  {renderNotificationContent(notification)}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
