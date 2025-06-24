import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, X, Users, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth-context'
import NotificationService, { type NotificationData } from '@/lib/notificationService'
import { respondToCrewInvitation } from '@/lib/crewService'
import { respondToEventInvitation } from '@/lib/eventInvitationService'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRealtimeNotifications } from '@/hooks/useSimpleRealtime'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const notificationService = NotificationService.getInstance()

  // Simple refresh function for real-time updates
  const refreshNotifications = useCallback(() => {
    if (user?.id) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [user?.id])

  // Use simple real-time hook
  useRealtimeNotifications(user?.id || '', refreshNotifications)

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
      setNotifications(data)
    } catch (error) {
      // Handle error silently in production
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
      // Handle error silently in production
    }
  }

  const handleEventInvitationResponse = async (notificationId: string, invitationId: string | null, response: 'accepted' | 'declined') => {
    try {
      if (!invitationId) {
        toast.error('Unable to process invitation - please try refreshing the page')
        return
      }

      const result = await respondToEventInvitation(invitationId, { response })

      if (result.success) {
        await markAsRead(notificationId)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      console.error('Error responding to event invitation:', error)
      toast.error('Failed to respond to invitation')
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
      // Handle error silently in production
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      // Handle error silently in production
    }
  }

  const handleCrewInvitationResponse = async (notificationId: string, crewMemberId: string | null, crewId: string | null, response: 'accepted' | 'declined') => {
    try {
      let memberIdToUse = crewMemberId

      // If crew_member_id is missing, try to find it using crew_id
      if (!memberIdToUse && crewId && user?.id) {
        const { data: member, error } = await supabase
          .from('crew_members')
          .select('id')
          .eq('crew_id', crewId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single()

        if (!error && member) {
          memberIdToUse = member.id
        }
      }

      // If still no crew_member_id, try to find any pending invitation for this user
      if (!memberIdToUse && user?.id) {
        const { data: member, error } = await supabase
          .from('crew_members')
          .select('id, crew_id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && member) {
          memberIdToUse = member.id
        }
      }

      if (!memberIdToUse) {
        toast.error('Unable to process invitation - please try refreshing the page')
        return
      }

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
      toast.error('Failed to respond to invitation')
    }
  }

  const handleNotificationClick = (notification: NotificationData) => {
    // Don't mark as read or navigate for crew/event invitations - they have their own action buttons
    if (notification.type === 'crew_invitation' || notification.type === 'event_invitation') {
      return
    }

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
      event_invitation: '📨',
      event_invitation_response: '💬',
      event_update: '📝',
      event_cancelled: '❌'
    }
    return icons[type] || '🔔'
  }

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-5 h-5" />
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#FF5E78] text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow min-w-[20px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "max-w-[340px] p-0 border-white/8 shadow-xl shadow-dark-900/50 rounded-2xl",
          "bg-[#1A1A1A]",
          notifications.length > 0 && "md:min-h-[320px]",
          notifications.length > 0 && "max-md:min-h-[260px]"
        )}
        align="end"
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-gray-300 hover:text-white hover:bg-white/8"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className={cn(
          "overflow-y-auto max-h-[70vh]",
          notifications.length === 0 ? "" : "md:min-h-[280px] max-md:min-h-[220px]"
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center px-6 py-8 text-gray-400 space-y-4">
              <Bell className="w-12 h-12 mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="text-base font-medium">No notifications yet</p>
                <p className="text-sm opacity-75">We'll let you know when something happens!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "px-4 py-4 transition-colors",
                    !notification.read && "bg-white/5 border-l-2 border-l-white",
                    notification.type !== 'crew_invitation' && notification.type !== 'event_invitation' && "hover:bg-white/8 cursor-pointer"
                  )}
                  onClick={notification.type !== 'crew_invitation' && notification.type !== 'event_invitation' ? () => handleNotificationClick(notification) : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0">
                      {notification.type === 'crew_invitation' ? (
                        <Users className="w-4 h-4 text-white mt-0.5" />
                      ) : (
                        getNotificationIcon(notification.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-white line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>

                      {/* Crew invitation actions */}
                      {notification.type === 'crew_invitation' && !notification.read && (notification.data?.crew_member_id || notification.data?.crew_id) && notification.id && (
                        <div className="space-y-3 mt-3">
                          {/* View Crew Details Button */}
                          {notification.data?.crew_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `/crew/${notification.data?.crew_id}`
                                setIsOpen(false)
                              }}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border-white/20 text-white hover:bg-white/10 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                            >
                              <Eye className="w-3 h-3" />
                              View Crew Details
                            </Button>
                          )}

                          {/* Accept/Decline Buttons */}
                          <div className="flex flex-col gap-1.5 md:gap-2">
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
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-white text-black hover:bg-gray-100 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                            >
                              <Check className="w-3 h-3" />
                              Join Crew
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCrewInvitationResponse(
                                  notification.id!,
                                  notification.data?.crew_member_id || null,
                                  notification.data?.crew_id || null,
                                  'declined'
                                )
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border border-red-500/30 text-red-400 hover:bg-red-500/10 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                            >
                              <X className="w-3 h-3" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Event invitation actions */}
                      {notification.type === 'event_invitation' && !notification.read && (notification.data?.invitation_id || notification.data?.event_member_id) && notification.id && (
                        <div className="space-y-2 mt-3">
                          {/* View Details Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (notification.data?.event_id) {
                                window.location.href = `/event/${notification.data.event_id}`
                              }
                              setIsOpen(false)
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border-white/20 text-white hover:bg-white/10 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </Button>

                          {/* Accept/Decline Buttons */}
                          <div className="flex flex-col gap-1.5 md:gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventInvitationResponse(
                                  notification.id!,
                                  notification.data?.invitation_id || notification.data?.event_member_id || null,
                                  'accepted'
                                )
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-white text-black hover:bg-gray-100 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                            >
                              <Check className="w-3 h-3" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventInvitationResponse(
                                  notification.id!,
                                  notification.data?.invitation_id || notification.data?.event_member_id || null,
                                  'declined'
                                )
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border border-red-500/30 text-red-400 hover:bg-red-500/10 h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                            >
                              <X className="w-3 h-3" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Event invitation response actions (consolidated notification with View Event button) */}
                      {notification.type === 'event_invitation_response' && notification.data?.show_view_event_button && notification.data?.event_id && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/event/${notification.data?.event_id}`
                              setIsOpen(false)
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3] hover:shadow-[0_0_8px_rgba(0,255,163,0.3)] h-[36px] md:gap-2 md:px-4 md:py-2 md:text-sm md:h-[38px]"
                          >
                            <Eye className="w-3 h-3" />
                            View Event
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
          <div className="border-t border-white/10 px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-300 hover:text-white hover:bg-white/8"
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
