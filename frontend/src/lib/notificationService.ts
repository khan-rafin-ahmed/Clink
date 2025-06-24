import { supabase } from './supabase'
import { toast } from 'sonner'

export type NotificationType =
  | 'event_rsvp'
  | 'event_reminder'
  | 'crew_invite_accepted'
  | 'crew_invitation'
  | 'event_invitation'
  | 'event_invitation_response'
  | 'event_update'
  | 'event_cancelled'

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
  async createNotification(notification: Omit<NotificationData, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          read: false
        })
        .select()

      if (error) {
        console.error('❌ Error creating notification:', error)
        throw error
      }

      // Show in-app toast notification
      this.showToastNotification(notification)

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
      crew_invite_accepted: '🎯',
      crew_invitation: '👥',
      event_invitation: '📨',
      event_invitation_response: '💬',
      event_update: '📝',
      event_cancelled: '❌'
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
      title: `🍺 ${userName} joined your session`,
      message: `${userName} has joined "${eventTitle}" and is ready to drink!`,
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
   * Crew invite accepted
   */
  async onCrewInviteAccepted(crewId: string, crewName: string, inviterId: string, acceptedUserName: string): Promise<void> {
    const notification = NotificationService.getInstance()
    await notification.createNotification({
      user_id: inviterId,
      type: 'crew_invite_accepted',
      title: `🎯 You've got a new clink mate`,
      message: `${acceptedUserName} joined your "${crewName}" crew!`,
      data: { crewId, crewName },
      read: false
    })
  }
}

export default NotificationService
