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
import { Bell, Check, X, Users, Calendar, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [respondedNotifications, setRespondedNotifications] = useState<Set<string>>(new Set())

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
      // Immediately mark as responded to hide buttons
      setRespondedNotifications(prev => new Set(prev).add(notificationId))

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
      // Remove from responded set if failed
      setRespondedNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      console.error('Error responding to crew invitation:', error)
      toast.error('Failed to respond to invitation')
    }
  }

  const handleEventInvitationResponse = async (notificationId: string, eventMemberId: string, response: 'accepted' | 'declined') => {
    try {
      // Immediately mark as responded to hide buttons
      setRespondedNotifications(prev => new Set(prev).add(notificationId))

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
      // Remove from responded set if failed
      setRespondedNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
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
              <div className="flex gap-1.5 mt-3">
                {/* View Details Button */}
                {notification.data?.crew_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/crew/${notification.data?.crew_id}`
                    }}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition border-white/20 text-white hover:bg-white/10 h-[36px] flex-1 min-w-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span className="truncate">Details</span>
                  </Button>
                )}

                {/* Join/Decline Buttons - Only show if not responded */}
                {!respondedNotifications.has(notification.id) && (
                  <>
                    {/* Join Button */}
                    <Button
                      size="sm"
                      onClick={() => handleCrewInvitationResponse(
                        notification.id,
                        notification.data.crew_member_id,
                        'accepted'
                      )}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition bg-white text-black hover:bg-gray-100 h-[36px] flex-1 min-w-0"
                    >
                      <Check className="w-3 h-3" />
                      <span className="truncate">Join</span>
                    </Button>

                    {/* Decline Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCrewInvitationResponse(
                        notification.id,
                        notification.data.crew_member_id,
                        'declined'
                      )}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition border border-red-500/30 text-red-400 hover:bg-red-500/10 h-[36px] flex-1 min-w-0"
                    >
                      <X className="w-3 h-3" />
                      <span className="truncate">Decline</span>
                    </Button>
                  </>
                )}
              </div>
            )}



            {/* Event invitation actions */}
            {notification.type === 'event_invitation' && !notification.read && (
              <div className="flex gap-1.5 mt-3">
                {/* View Details Button */}
                {notification.data?.event_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/event/${notification.data?.event_id}`
                    }}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition border-white/20 text-white hover:bg-white/10 h-[36px] flex-1 min-w-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span className="truncate">Details</span>
                  </Button>
                )}

                {/* Join/Decline Buttons - Only show if not responded */}
                {!respondedNotifications.has(notification.id) && (
                  <>
                    {/* Join Button */}
                    <Button
                      size="sm"
                      onClick={() => handleEventInvitationResponse(
                        notification.id,
                        notification.data.event_member_id,
                        'accepted'
                      )}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition bg-white text-black hover:bg-gray-100 h-[36px] flex-1 min-w-0"
                    >
                      <Check className="w-3 h-3" />
                      <span className="truncate">Join</span>
                    </Button>

                    {/* Decline Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEventInvitationResponse(
                        notification.id,
                        notification.data.event_member_id,
                        'declined'
                      )}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition border border-red-500/30 text-red-400 hover:bg-red-500/10 h-[36px] flex-1 min-w-0"
                    >
                      <X className="w-3 h-3" />
                      <span className="truncate">Decline</span>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Event invitation response actions (consolidated notification with View Event button) */}
            {notification.type === 'event_invitation_response' && notification.data?.show_view_event_button && notification.data?.event_id && (
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = `/event/${notification.data?.event_id}`
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3] hover:shadow-[0_0_8px_rgba(0,255,163,0.3)] mt-3"
              >
                <Eye className="w-3 h-3" />
                View Event
              </Button>
            )}

            {/* Mark as read button for other notifications */}
            {!['crew_invitation', 'event_invitation', 'event_invitation_response'].includes(notification.type) && !notification.read && (
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
        <div className="relative">
          <Button variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#FF5E78] text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow min-w-[20px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="max-w-[340px] p-0 bg-[#0E0E10] border border-white/8 rounded-2xl shadow-xl" align="end">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-xs text-gray-300 hover:text-white hover:bg-white/8 glass-effect transition-all duration-200"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center px-6 py-8 text-gray-400 space-y-6">
              <Bell className="w-12 h-12 mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="text-base font-medium">No notifications yet</p>
                <p className="text-sm opacity-75">We'll let you know when something happens!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map(notification => (
                <div key={notification.id} className="px-4 py-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
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
