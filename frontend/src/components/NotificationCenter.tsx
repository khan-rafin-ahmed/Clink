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

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

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
            {notification.type === 'crew_invitation' && !notification.read && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleCrewInvitationResponse(
                    notification.id,
                    notification.data.crew_member_id,
                    'accepted'
                  )}
                  className="h-7 px-3"
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
                  className="h-7 px-3"
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Mark as read button for other notifications */}
            {notification.type !== 'crew_invitation' && !notification.read && (
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
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div key={notification.id}>
                    {renderNotificationContent(notification)}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
