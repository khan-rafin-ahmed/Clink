// Extract inviter name from the raw notification.title if senderName is fallback
const extractNameFromTitle = (title: string) => {
  const match = title.match(/^[^\p{L}]*([\p{L}]+)/u)
  return match ? match[1] : 'Someone'
}
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
import { invalidateEventCaches, invalidateEventAttendanceCaches, CACHE_KEYS } from '@/lib/cache'
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
            } else if (notification.type === 'crew_invitation_response') {
              // For crew invitation responses, get the responder's ID
              senderId = notification.data?.joiner_id || notification.data?.user_id
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
        // Mark as read in service
        await markAsRead(notificationId);

        // Mark notification as responded to prevent reappearance
        try {
          const currentNotification = notifications.find(n => n.id === notificationId);
          await supabase
            .from('notifications')
            .update({
              data: {
                ...(currentNotification?.data || {}),
                user_response: response,
                responded_at: new Date().toISOString()
              }
            })
            .eq('id', notificationId);
        } catch (err) {
          console.error('Failed to update notification response:', err);
        }

        // Remove from local state immediately
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // Clear cache so other components reflect changes
        if (user?.id) {
          cacheService.delete(getNotificationsCacheKey(user.id));
        }

        // Invalidate event-related caches to ensure immediate UI updates
        const currentNotification = notifications.find(n => n.id === notificationId);
        if (currentNotification?.data?.event_id) {
          const eventId = currentNotification.data.event_id;
          // Clear event detail cache
          cacheService.delete(CACHE_KEYS.EVENT_DETAIL(eventId));
          // Clear event attendance cache for this user
          invalidateEventAttendanceCaches(eventId);
          // Clear general event caches
          invalidateEventCaches();
        }

        // Show success toast (optional)
        toast.success(response === 'accepted' ? 'Invitation accepted!' : 'Invitation declined.');
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
      await markAsRead(notificationId);

      // Mark notification as responded to prevent reappearance
      try {
        const currentNotification = notifications.find(n => n.id === notificationId);
        await supabase
          .from('notifications')
          .update({
            data: {
              ...(currentNotification?.data || {}),
              user_response: response,
              responded_at: new Date().toISOString()
            }
          })
          .eq('id', notificationId);
      } catch (err) {
        console.error('Failed to update notification response:', err);
      }

      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Clear cache so other components reflect changes
      if (user?.id) {
        cacheService.delete(getNotificationsCacheKey(user.id));
      }

      // Show success toast (optional)
      if (response === 'accepted') {
        toast.success('Joined the crew! 🍺')
      } else {
        toast.success('Crew invitation declined')
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

  // No longer using emoji icons - system now uses user avatars

  // Helper function to check if event invitation is expired
  const isEventInvitationExpired = (notification: ExtendedNotificationData): boolean => {
    if (notification.type !== 'event_invitation') {
      return false
    }

    // If no event timing data, don't mark as expired
    if (!notification.data?.event_date_time) {
      return false
    }

    const eventDateTime = notification.data.event_date_time
    const eventEndTime = notification.data.event_end_time
    const durationType = notification.data.duration_type

    try {
      const status = getEventTimingStatus(eventDateTime, eventEndTime, durationType)
      return status === 'past'
    } catch (error) {
      // If timing calculation fails, don't mark as expired
      return false
    }
  }

  // Helper function to get notification state
  const getNotificationState = (notification: ExtendedNotificationData) => {
    // Hide invites immediately after user response, before DB-side propagation delay
    if ((notification.type === 'event_invitation' || notification.type === 'crew_invitation')
        && respondedNotifications.has(notification.id!)) {
      return null
    }
    // Hide event invitations that have been responded to or expired
    if (notification.type === 'event_invitation') {
      // After response: data.response or data.user_response will be 'accepted' or 'declined'
      if (notification.data?.response === 'accepted' || notification.data?.response === 'declined' ||
          notification.data?.user_response === 'accepted' || notification.data?.user_response === 'declined') {
        return null
      }
      // Hide expired invites
      if (isEventInvitationExpired(notification)) {
        return null
      }
    }

    // Hide crew invitations that have been responded to
    if (notification.type === 'crew_invitation') {
      // After response: data.user_response will be 'accepted' or 'declined'
      if (notification.data?.user_response === 'accepted' || notification.data?.user_response === 'declined') {
        return null
      }
    }



    // Crew invitation response: show response notification (match event style)
    if (notification.type === 'crew_invitation_response') {
      const crewName = notification.data?.crew_name || 'the crew'
      const userName =
        notification.senderName && notification.senderName !== 'Someone'
          ? notification.senderName
          : extractNameFromTitle(notification.title)
      const response = notification.data?.response
      return {
        isExpired: false,
        title: response === 'accepted'
          ? `${userName} accepted your invitation to "${crewName}"`
          : `${userName} declined your invitation to "${crewName}"`,
        message: response === 'accepted'
          ? 'They\'re ready to raise hell!'
          : 'They won\'t be able to make it this time.',
        showActions: false
      }
    }

    // Event invitation or post-response
    if (notification.type === 'event_invitation') {
      const sessionTitle = notification.data?.event_title || 'a session'
      const userName =
        notification.senderName && notification.senderName !== 'Someone'
          ? notification.senderName
          : extractNameFromTitle(notification.title)
      const response = notification.data?.response
      // After response: show invite + subtext
      if (response === 'accepted' || response === 'declined') {
        return {
          isExpired: false,
          title: `${userName} invited you to join a session "${sessionTitle}"`,
          message: response === 'accepted'
            ? '✅ You accepted this invitation.'
            : '❌ You declined this invitation.',
          showActions: false
        }
      }
      // Initial invitation
      return {
        isExpired: false,
        title: `${userName} invited you to join a session "${sessionTitle}"`,
        message: '',
        showActions: true
      }
    }

    // Event RSVP (legacy - keeping for backward compatibility)
    if (notification.type === 'event_rsvp') {
      const sessionTitle = notification.data?.eventTitle || notification.data?.event_title || 'a session'
      const userName = notification.senderName || 'Someone'
      return {
        isExpired: false,
        title: `${userName} accepted your invitation to ${sessionTitle}`,
        message: 'They\'re ready to raise hell!',
        showActions: false
      }
    }

    // Event invitation response (new format)
    if (notification.type === 'event_invitation_response') {
      const sessionTitle = notification.data?.event_title || 'a session'
      const userName = notification.senderName || 'Someone'
      const response = notification.data?.response || 'responded'
      return {
        isExpired: false,
        title: `${userName} ${response} your invitation to ${sessionTitle}`,
        message: response === 'accepted' ? 'They\'re ready to raise hell!' : 'They won\'t be able to make it this time.',
        showActions: false
      }
    }

    // Crew invitation response (new format)
    if (notification.type === 'crew_invitation_response') {
      const crewName = notification.data?.crew_name || 'a crew'
      const userName = notification.senderName || 'Someone'
      const response = notification.data?.response || 'responded'
      return {
        isExpired: false,
        title: `${userName} ${response} your invitation to ${crewName}`,
        message: response === 'accepted' ? 'They\'re ready to raise hell!' : 'They won\'t be able to make it this time.',
        showActions: false
      }
    }

    // Handle crew invitations
    if (notification.type === 'crew_invitation') {
      const crewName = notification.data?.crew_name || 'the crew'
      const userName = notification.senderName || 'Someone'
      const response = notification.data?.response
      // After response: show invite + subtext
      if (response === 'accepted' || response === 'declined') {
        return {
          isExpired: false,
          title: `${userName} invited you to join "${crewName}"`,
          message: response === 'accepted'
            ? '✅ You accepted this invitation.'
            : '❌ You declined this invitation.',
          showActions: false
        }
      }
      // Initial invitation
      return {
        isExpired: false,
        title: `${userName} invited you to join "${crewName}"`,
        message: '',
        showActions: true
      }
    }

    // Default fallback
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
                      {notification.senderAvatar && (notification.type === 'event_invitation_response' || notification.type === 'event_rsvp' || notification.type === 'crew_invitation' || notification.type === 'event_invitation' || notification.type === 'crew_invitation_response') ? (
                        <img
                          src={notification.senderAvatar}
                          alt={notification.senderName || 'User'}
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                      ) : (notification.type === 'event_invitation_response' || notification.type === 'event_rsvp' || notification.type === 'crew_invitation' || notification.type === 'event_invitation' || notification.type === 'crew_invitation_response') ? (
                        // Show placeholder avatar for user-specific notifications without avatar data
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-xs text-white/70">👤</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-xs text-white/70">🔔</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "font-medium text-sm text-white leading-relaxed",
                              "line-clamp-2"
                            )}
                            // dangerouslySetInnerHTML will be used for crew_invitation and event_invitation
                          >
                            {(() => {
                              // Crew invitation: hyperlink crew name in title
                              if (notification.type === 'crew_invitation') {
                                const crewName = notification.data?.crew_name || 'the crew'
                                const crewId = notification.data?.crew_id
                                // Replace just the quoted crew name with a link
                                const raw = state.title
                                if (crewId && crewName) {
                                  // Replace the quoted name in the string with <a>
                                  const quoted = `"${crewName}"`
                                  const html = raw.replace(
                                    quoted,
                                    `<a href="/crew/${crewId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${crewName}</a>`
                                  )
                                  return <span dangerouslySetInnerHTML={{ __html: html }} />
                                }
                              }
                              // Event invitation: hyperlink event name in title
                              if (notification.type === 'event_invitation') {
                                const eventTitle = notification.data?.event_title || notification.data?.eventTitle
                                const eventId = notification.data?.event_id
                                const raw = state.title
                                if (eventId && eventTitle) {
                                  const quoted = `"${eventTitle}"`
                                  const html = raw.replace(
                                    quoted,
                                    `<a href="/event/${eventId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${eventTitle}</a>`
                                  )
                                  return <span dangerouslySetInnerHTML={{ __html: html }} />
                                }
                              }
                              // Event invitation response: hyperlink event name in title
                              if (notification.type === 'event_invitation_response') {
                                const eventTitle = notification.data?.event_title
                                const eventId = notification.data?.event_id
                                const raw = state.title
                                if (eventId && eventTitle) {
                                  // Handle both quoted and unquoted event titles
                                  const quoted = `"${eventTitle}"`
                                  const unquoted = eventTitle
                                  let html = raw

                                  // Try quoted first, then unquoted
                                  if (raw.includes(quoted)) {
                                    html = raw.replace(
                                      quoted,
                                      `<a href="/event/${eventId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${eventTitle}</a>`
                                    )
                                  } else if (raw.includes(unquoted)) {
                                    html = raw.replace(
                                      unquoted,
                                      `<a href="/event/${eventId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${eventTitle}</a>`
                                    )
                                  }
                                  return <span dangerouslySetInnerHTML={{ __html: html }} />
                                }
                              }
                              // Crew invitation response: hyperlink crew name in title
                              if (notification.type === 'crew_invitation_response') {
                                const crewName = notification.data?.crew_name
                                const crewId = notification.data?.crew_id
                                const raw = state.title
                                if (crewId && crewName) {
                                  // Handle both quoted and unquoted crew names
                                  const quoted = `"${crewName}"`
                                  const unquoted = crewName
                                  let html = raw

                                  // Try quoted first, then unquoted
                                  if (raw.includes(quoted)) {
                                    html = raw.replace(
                                      quoted,
                                      `<a href="/crew/${crewId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${crewName}</a>`
                                    )
                                  } else if (raw.includes(unquoted)) {
                                    html = raw.replace(
                                      unquoted,
                                      `<a href="/crew/${crewId}" class="font-bold underline decoration-white/60 underline-offset-2 hover:text-white">${crewName}</a>`
                                    )
                                  }
                                  return <span dangerouslySetInnerHTML={{ __html: html }} />
                                }
                              }
                              // Default: plain text
                              return state.title
                            })()}
                          </p>
                          {!notification.read && (
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
                      {notification.type === 'crew_invitation' && !notification.data?.response && (notification.data?.crew_member_id || notification.data?.crew_id) && notification.id && (
                        <div className="mt-3 space-y-2">
                          {/* Line 2: Accept and Decline buttons (side by side) */}
                          {!respondedNotifications.has(notification.id!) && (
                            <div className="flex gap-2">
                              {/* Accept Button - Primary styling per design system */}
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
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-[#FFFFFF] text-[#08090A] hover:bg-[#FFFFFF]/90 h-[36px]"
                              >
                                ✔️ Join
                              </Button>

                              {/* Decline Button - Secondary styling per design system */}
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
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-[#07080A] text-[#FFFFFF] border border-white/10 hover:bg-white/5 h-[36px]"
                              >
                                ❌ Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      )}


                      {/* Event invitation actions */}
                      {notification.type === 'event_invitation' && !notification.data?.response && !isEventInvitationExpired(notification) && (notification.data?.invitation_id || notification.data?.event_member_id) && notification.id && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            {/* Accept Button - matches crew invitation styling */}
                            {!respondedNotifications.has(notification.id!) && (
                              <>
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
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-[#FFFFFF] text-[#08090A] hover:bg-[#FFFFFF]/90 h-[36px]"
                                >
                                  ✔️ Join
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
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition bg-[#07080A] text-[#FFFFFF] border border-white/10 hover:bg-white/5 h-[36px]"
                                >
                                  ❌ Decline
                                </Button>
                              </>
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
