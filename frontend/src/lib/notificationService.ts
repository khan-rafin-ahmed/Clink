import { supabase } from './supabase'
import { toast } from 'sonner'

export type NotificationType =
  | 'event_rsvp'
  | 'event_reminder'
  | 'crew_invitation'
  | 'crew_invitation_response'
  | 'event_invitation'
  | 'event_invitation_response'
  | 'event_update'
  | 'event_cancelled'
  | 'crew_promotion'

export interface NotificationData {
  id?: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at?: string
}

/**
 * Notification Service for Thirstee
 * Handles in-app notifications and push notifications
 */
class NotificationService {
  private static instance: NotificationService
  private pushSubscription: PushSubscription | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return false
      }

      // Register service worker
      await navigator.serviceWorker.register('/sw.js')

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: Omit<NotificationData, 'id' | 'created_at'>, options?: { skipToast?: boolean }): Promise<void> {
    try {
      // Use the create_notification function which has SECURITY DEFINER to bypass RLS
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: notification.user_id,
        p_type: notification.type,
        p_title: notification.title,
        p_message: notification.message,
        p_data: notification.data || {}
      })

      if (error) {
        console.error('❌ Error creating notification:', error)
        throw error
      }

      // Show in-app toast notification (unless skipToast is true)
      if (!options?.skipToast) {
        this.showToastNotification(notification)
      }

      // Send push notification if enabled
      await this.sendPushNotification(notification)
    } catch (error) {
      console.error('❌ Error in createNotification:', error)
      throw error
    }
  }

  /**
   * Show in-app toast notification
   */
  private showToastNotification(notification: NotificationData): void {
    const emoji = this.getNotificationEmoji(notification.type)

    const eventId = notification.data?.eventId
    const eventTitle = notification.data?.eventTitle

    if (eventId && eventTitle) {
      toast(notification.title, {
        description: notification.message,
        icon: emoji,
        duration: 5000,
        action: {
          label: 'View Event',
          onClick: () => {
            window.location.href = `/event/${eventId}`
          }
        }
      })
    } else {
      toast(notification.title, {
        description: notification.message,
        icon: emoji,
        duration: 5000
      })
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: NotificationData): Promise<void> {
    if (!this.pushSubscription) return

    try {
      // This would typically go through your backend
      // For now, we'll use the browser's notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/thirstee-logo.svg',
          badge: '/thirstee-logo.svg',
          tag: notification.type,
          data: notification.data
        })
      }
    } catch (error) {
      console.error('Failed to send push notification:', error)
    }
  }

  /**
   * Get emoji for notification type
   */
  private getNotificationEmoji(type: NotificationType): string {
    const emojis: Record<NotificationType, string> = {
      event_rsvp: '🍺',
      event_reminder: '⏰',
      crew_invitation: '👥',
      crew_invitation_response: '✅',
      event_invitation: '📨',
      event_invitation_response: '💬',
      event_update: '📝',
      event_cancelled: '❌',
      crew_promotion: '👑'
    }
    return emojis[type] || '🔔'
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, limit = 20): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Failed to mark notification as read:', error)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        return 0
      }

      return count || 0
    } catch (error) {
      return 0
    }
  }
}

// Notification trigger functions
export const notificationTriggers = {
  /**
   * Someone RSVPs to your event
   */
  async onEventRSVP(eventId: string, eventTitle: string, hostId: string, rsvpUserId: string, userName: string): Promise<void> {
    if (hostId === rsvpUserId) return // Don't notify host of their own RSVP

    const notification = NotificationService.getInstance()
    await notification.createNotification({
      user_id: hostId,
      type: 'event_rsvp',
      title: `${userName} accepted your invitation to ${eventTitle}`,
      message: `They're ready to raise hell!`,
      data: { eventId, eventTitle, rsvpUserId },
      read: false
    })
  },

  /**
   * Event starts in 30 minutes
   */
  async onEventReminder(eventId: string, eventTitle: string, attendeeIds: string[]): Promise<void> {
    const notification = NotificationService.getInstance()

    for (const userId of attendeeIds) {
      await notification.createNotification({
        user_id: userId,
        type: 'event_reminder',
        title: "Your session starts in 30 minutes!",
        message: `"${eventTitle}" is starting soon - time to get ready!`,
        data: { eventId, eventTitle },
        read: false
      })
    }
  },



  /**
   * Co-host promotion
   */
  async onCoHostPromotion(crewId: string, crewName: string, promotedUserId: string): Promise<void> {
    const notification = NotificationService.getInstance()
    await notification.createNotification({
      user_id: promotedUserId,
      type: 'crew_promotion',
      title: `You've been promoted to co-host for the Crew "${crewName}"`,
      message: `Time to help lead the party!`,
      data: { crewId, crewName },
      read: false
    }, { skipToast: true }) // Skip the automatic toast
  },

  /**
   * Co-host demotion
   */
  async onCoHostDemotion(crewId: string, crewName: string, demotedUserId: string): Promise<void> {
    const notification = NotificationService.getInstance()
    await notification.createNotification({
      user_id: demotedUserId,
      type: 'crew_promotion', // Using same type as promotion for consistency
      title: `You've been demoted to a member for the Crew "${crewName}"`,
      message: ``,
      data: { crewId, crewName },
      read: false
    }, { skipToast: true }) // Skip the automatic toast
  }
}

export default NotificationService
