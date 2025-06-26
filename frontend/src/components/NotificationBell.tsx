import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
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
import { cacheService } from '@/lib/cacheService'
import { getEventTimingStatus } from '@/lib/eventUtils'

// Extended notification interface with sender profile info
interface ExtendedNotificationData extends NotificationData {
  senderName?: string
  senderAvatar?: string
}



export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<ExtendedNotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [respondedNotifications, setRespondedNotifications] = useState<Set<string>>(new Set())

  const CACHE_TTL = 60 * 1000 // 60 seconds

  const getNotificationsCacheKey = (userId: string) => `user_notifications_${userId}`
  const getUnreadCacheKey = (userId: string) => `unread_count_${userId}`

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
      const cacheKey = getNotificationsCacheKey(user.id)
      let data = cacheService.get<ExtendedNotificationData[]>(cacheKey)
      if (!data) {
        // Fetch notifications with sender profile information
        const baseNotifications = await notificationService.getUserNotifications(user.id)

        // Enhance notifications with sender profile data
        const enhancedNotifications = await Promise.all(
          baseNotifications.map(async (notification) => {
            let senderName = 'Someone'
            let senderAvatar = null

            // Extract sender ID from notification data based on notification type
            let senderId = null
            if (notification.type === 'event_rsvp') {
              senderId = notification.data?.rsvpUserId
            } else if (notification.type === 'event_invitation_response') {
              senderId = notification.data?.inviter_id || notification.data?.user_id
            } else if (notification.type === 'crew_invitation') {
              senderId = notification.data?.inviter_id
            } else if (notification.type === 'event_invitation') {
              senderId = notification.data?.inviter_id
            } else if (notification.type === 'crew_invite_accepted') {
              senderId = notification.data?.user_id || notification.data?.member_id
            }

            if (senderId) {
              try {
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('display_name, avatar_url')
                  .eq('user_id', senderId)
                  .single()

                if (profile) {
                  senderName = profile.display_name || 'Someone'
                  senderAvatar = profile.avatar_url
                }
              } catch (error) {
                // Fallback to 'Someone' if profile fetch fails
              }
            }

            return {
              ...notification,
              senderName,
              senderAvatar
            } as ExtendedNotificationData
          })
        )

        data = enhancedNotifications
        cacheService.set(cacheKey, data, CACHE_TTL)
      }
      setNotifications(data)
    } catch (error) {
      console.error('❌ Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user?.id) return

    try {
      const cacheKey = getUnreadCacheKey(user.id)
      let count = cacheService.get<number>(cacheKey)
      if (count === null || count === undefined) {
        count = await notificationService.getUnreadCount(user.id)
        cacheService.set(cacheKey, count, CACHE_TTL)
      }
      setUnreadCount(count)
    } catch (error) {
      console.error('❌ Error loading unread count:', error)
    }
  }

  const handleEventInvitationResponse = async (notificationId: string, invitationId: string | null, response: 'accepted' | 'declined') => {
    try {
      // Immediately mark as responded to hide buttons
      setRespondedNotifications(prev => new Set(prev).add(notificationId))

      if (!invitationId) {
        // Remove from responded set if failed
        setRespondedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        toast.error('Unable to process invitation - please try refreshing the page')
        return
      }

      const result = await respondToEventInvitation(invitationId, { response }, user!.id)

      if (result.success) {
        await markAsRead(notificationId)

        // Update notification to show response message immediately
        setNotifications(prev => {
          const updated = prev.map(n => {
            if (n.id === notificationId) {
              const eventTitle = n.data?.event_title || 'the event'
              return {
                ...n,
                title: response === 'accepted'
                  ? `✅ You accepted invitation to "${eventTitle}"`
                  : `❌ You declined invitation to "${eventTitle}"`,
                message: response === 'accepted'
                  ? 'See you there!'
                  : 'Maybe next time.',
                read: true
              }
            }
            return n
          })
          if (user?.id) {
            cacheService.set(getNotificationsCacheKey(user.id), updated, CACHE_TTL)
          }
          return updated
        })
        // Toast is handled by the service function
      } else {
        // Remove from responded set if failed
        setRespondedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        toast.error(result.message)
      }
    } catch (error: any) {
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

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        if (user?.id) {
          cacheService.set(getNotificationsCacheKey(user.id), updated, CACHE_TTL)
        }
        return updated
      })
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1)
        if (user?.id) {
          cacheService.set(getUnreadCacheKey(user.id), newCount, CACHE_TTL)
        }
        return newCount
      })
    } catch (error) {
      // Handle error silently in production
    }
  }



  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }))
        cacheService.set(getNotificationsCacheKey(user.id), updated, CACHE_TTL)
        return updated
      })
      setUnreadCount(() => {
        cacheService.set(getUnreadCacheKey(user.id), 0, CACHE_TTL)
        return 0
      })
    } catch (error) {
      // Handle error silently in production
    }
  }

  const handleCrewInvitationResponse = async (notificationId: string, crewMemberId: string | null, crewId: string | null, response: 'accepted' | 'declined') => {
    try {
      // Immediately mark as responded to hide buttons
      setRespondedNotifications(prev => new Set(prev).add(notificationId))

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
        // Remove from responded set if failed
        setRespondedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        toast.error('Unable to process invitation - please try refreshing the page')
        return
      }

      await respondToCrewInvitation(memberIdToUse, response)
      await markAsRead(notificationId)

      // Show success toast
      if (response === 'accepted') {
        toast.success('Joined the crew! 🍺')
      } else {
        toast.success('Crew invitation declined')
      }

      // Update notification to show response message immediately and persist the response
      setNotifications(prev => {
        const updated = prev.map(n => {
          if (n.id === notificationId) {
            const crewName = n.data?.crew_name || 'the crew'
            return {
              ...n,
              data: {
                ...n.data,
                response: response
              },
              title: response === 'accepted'
                ? `You have joined ${crewName}`
                : `You declined invitation to ${crewName}`,
              message: response === 'accepted'
                ? 'Welcome to the crew!'
                : 'Maybe next time.',
              read: true
            }
          }
          return n
        })
        if (user?.id) {
          cacheService.set(getNotificationsCacheKey(user.id), updated, CACHE_TTL)
        }
        return updated
      })

      // Also update the notification in the database to persist the response
      try {
        await supabase
          .from('notifications')
          .update({
            data: {
              ...notifications.find(n => n.id === notificationId)?.data,
              response: response
            },
            read: true
          })
          .eq('id', notificationId)
      } catch (dbError) {
        console.error('Failed to update notification in database:', dbError)
      }
    } catch (error) {
      // Remove from responded set if failed
      setRespondedNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      toast.error('Failed to respond to invitation')
    }
  }

  const handleNotificationClick = (notification: ExtendedNotificationData) => {
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
      crew_invitation: '👥',
      event_invitation: '🎉',
      event_invitation_response: '✅',
      event_update: '📝',
      event_cancelled: '❌',
      crew_promotion: '👑'
    }
    return icons[type] || '🔔'
  }

  // Helper to clean notification title (remove all leading emojis)
  const cleanNotificationTitle = (title: string, type: string) => {
    const icon = getNotificationIcon(type)
    // Remove the icon emoji if present at the start
    let cleaned = title.replace(new RegExp(`^${icon}\\s*`, 'g'), '')
    // Remove any other leading emojis or non-word characters (unicode aware)
    cleaned = cleaned.replace(/^[^\p{L}\p{N}]*/u, '')
    return cleaned.trim()
  }

  // Helper function to check if event invitation is expired
  const isEventInvitationExpired = (notification: ExtendedNotificationData): boolean => {
    if (notification.type !== 'event_invitation' || !notification.data?.event_date_time) {
      return false
    }

    const eventDateTime = notification.data.event_date_time
    const eventEndTime = notification.data.event_end_time
    const durationType = notification.data.duration_type

    const status = getEventTimingStatus(eventDateTime, eventEndTime, durationType)
    return status === 'past'
  }

  // Helper function to get notification state
  const getNotificationState = (notification: ExtendedNotificationData) => {
    // Hide processed event invitations (already responded to)
    if (notification.type === 'event_invitation' && notification.data?.status && notification.data.status !== 'pending') {
      return null // Hide this notification
    }

    // Hide expired event invitations
    if (notification.type === 'event_invitation' && isEventInvitationExpired(notification)) {
      return null // Hide this notification
    }

    // Fix event invitation response notifications - always override stored title/message
    if (notification.type === 'event_invitation_response') {
      const response = notification.data?.response
      const eventTitle = notification.data?.event_title || 'your event'
      const userName = notification.senderName || 'Someone'

      if (response === 'accepted') {
        return {
          isExpired: false,
          title: `${userName} joined your session`,
          message: `They joined "${eventTitle}" and are ready to drink!`,
          showActions: false,
          showViewEventButton: true
        }
      } else if (response === 'declined') {
        return {
          isExpired: false,
          title: `${userName} declined your invite`,
          message: `They can't make it to "${eventTitle}"`,
          showActions: false
        }
      }
    }

    // Fix event RSVP notifications - always override stored title/message
    if (notification.type === 'event_rsvp') {
      const eventTitle = notification.data?.eventTitle || 'your session'
      const userName = notification.senderName || 'Someone'
      return {
        isExpired: false,
        title: `${userName} joined your session`,
        message: `They joined "${eventTitle}" and are ready to drink!`,
        showActions: false
      }
    }

    // Fix crew notifications - always override stored title/message
    if (notification.type === 'crew_invite_accepted') {
      const crewName = notification.data?.crew_name || 'your crew'
      const userName = notification.senderName || 'Someone'
      return {
        isExpired: false,
        title: `${userName} joined your crew`,
        message: `They joined "${crewName}" crew!`,
        showActions: false
      }
    }

    // Handle crew invitation notifications - override stored title/message
    if (notification.type === 'crew_invitation') {
      const crewName = notification.data?.crew_name || 'the crew'
      const userName = notification.senderName || 'Someone'

      // Check if user has already responded
      const hasResponded = notification.data?.response === 'accepted' || notification.data?.response === 'declined'

      if (hasResponded) {
        if (notification.data?.response === 'accepted') {
          return {
            isExpired: false,
            title: `You have joined ${crewName}`,
            message: 'Welcome to the crew!',
            showActions: false,
            showViewCrewButton: true
          }
        } else {
          return {
            isExpired: false,
            title: `You declined invitation to ${crewName}`,
            message: 'Maybe next time.',
            showActions: false
          }
        }
      }

      return {
        isExpired: false,
        title: `${userName} invited you to join "${crewName}"`,
        message: '', // No additional message needed
        showActions: true
      }
    }

    return {
      isExpired: false,
      title: notification.title,
      message: notification.message,
      showActions: !notification.read
    }
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
          notifications.length > 0 && "md:min-h-[320px] md:max-h-[480px]",
          notifications.length > 0 && "max-md:min-h-[260px] max-md:max-h-[360px]"
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
          "overflow-y-auto",
          notifications.length === 0 ? "" : "md:min-h-[280px] md:max-h-[440px] max-md:min-h-[220px] max-md:max-h-[320px]"
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
              {notifications.map((notification) => {
                const state = getNotificationState(notification)

                // Hide notifications that return null state (processed/expired)
                if (!state) return null

                return (
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
                    <div className="flex-shrink-0">
                      {notification.senderAvatar && (notification.type === 'event_invitation_response' || notification.type === 'event_rsvp' || notification.type === 'crew_invitation' || notification.type === 'event_invitation' || notification.type === 'crew_invite_accepted') ? (
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName || 'User'}
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                      ) : (notification.type === 'event_invitation_response' || notification.type === 'event_rsvp' || notification.type === 'crew_invitation' || notification.type === 'event_invitation' || notification.type === 'crew_invite_accepted') ? (
                        // Show placeholder avatar for user-specific notifications without avatar data
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-xs text-white/70">👤</span>
                        </div>
                      ) : (
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "font-medium text-sm text-white leading-relaxed",
                              "line-clamp-2" // Allow 2 lines for all notifications to prevent truncation
                            )}
                          >
                            {cleanNotificationTitle(state.title, notification.type)}
                          </p>
                          {!notification.read && !state.isExpired && (
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                          {state.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </>

                      {/* Crew invitation actions */}
                      {notification.type === 'crew_invitation' && state.showActions && (notification.data?.crew_member_id || notification.data?.crew_id) && notification.id && (
                        <div className="mt-3 space-y-2">
                          {/* Line 1: View Crew Button (full width) */}
                          {notification.data?.crew_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `/crew/${notification.data?.crew_id}`
                                setIsOpen(false)
                              }}
                              className="w-full text-xs border-white/20 text-white hover:bg-white/10"
                            >
                              View Crew
                            </Button>
                          )}

                          {/* Line 2: Accept and Decline buttons (side by side) */}
                          {!respondedNotifications.has(notification.id!) && (
                            <div className="flex gap-2">
                              {/* Accept Button - Primary styling */}
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
                                className="flex-1 bg-white text-black hover:bg-gray-100 text-xs font-medium"
                              >
                                Accept
                              </Button>

                              {/* Decline Button - Secondary styling */}
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
                                className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs font-medium"
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show View Crew button for accepted invitations */}
                      {notification.type === 'crew_invitation' && state.showViewCrewButton && notification.data?.crew_id && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/crew/${notification.data?.crew_id}`
                              setIsOpen(false)
                            }}
                            className="w-full text-xs border-white/20 text-white hover:bg-white/10"
                          >
                            View Crew
                          </Button>
                        </div>
                      )}

                      {/* Event invitation actions */}
                      {notification.type === 'event_invitation' && state.showActions && !isEventInvitationExpired(notification) && (notification.data?.invitation_id || notification.data?.event_member_id) && notification.id && (
                        <div className="mt-3 space-y-2">
                          {/* Mobile: 2 lines, Desktop: 1 line */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
                            {/* View Details Button - Full width on mobile, flex-1 on desktop */}
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
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border-white/20 text-white hover:bg-white/10 h-[36px] w-full sm:flex-1"
                            >
                              View Event →
                            </Button>

                            {/* Join/Decline container - Horizontal on both mobile and desktop */}
                            {!respondedNotifications.has(notification.id!) && (
                              <div className="flex gap-1.5 sm:contents">
                                {/* Join Button */}
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
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-white text-black hover:bg-gray-100 h-[36px] flex-1 sm:flex-1"
                                >
                                  ✔️ Join
                                </Button>

                                {/* Decline Button */}
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
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border border-red-500/30 text-red-400 hover:bg-red-500/10 h-[36px] flex-1 sm:flex-1"
                                >
                                  ❌ Decline
                                </Button>
                              </div>
                            )}
                          </div>
                          {/* Status badge for event invitation */}
                          {!state.showActions && notification.data?.response === 'accepted' && (
                            <span className="text-sm text-green-400 mt-2">Already Joined</span>
                          )}
                          {!state.showActions && notification.data?.response === 'declined' && (
                            <span className="text-sm text-red-400 mt-2">Declined</span>
                          )}
                        </div>
                      )}

                      {/* Expired event invitation status */}
                      {notification.type === 'event_invitation' && isEventInvitationExpired(notification) && (
                        <div className="mt-3">
                          <span className="text-sm text-amber-400 flex items-center gap-1.5">
                            ⚠️ Event has expired
                          </span>
                        </div>
                      )}

                      {/* Event invitation response actions (consolidated notification with View Event button) */}
                      {notification.type === 'event_invitation_response' && (notification.data?.show_view_event_button || state.showViewEventButton) && notification.data?.event_id && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/event/${notification.data?.event_id}`
                              setIsOpen(false)
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-white text-[#08090A] h-[32px] md:px-3 md:text-sm md:h-[36px]"
                          >
                            View Event →
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
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
