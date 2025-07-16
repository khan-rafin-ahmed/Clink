import React, { useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useAuth } from '../lib/AuthContext'
import { useAuthDataFetching } from '@shared/hooks/useDataFetching'
import { getUserProfile } from '@shared/lib/userService'
import { getUserAccessibleEvents, getUserRecentActivity } from '@shared/lib/eventService'
import { useTheme } from '../hooks/useTheme'
import type { RootStackParamList } from '../navigation/AppNavigator'
import type { Event } from '@shared/types'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { user } = useAuth()
  const { colors, spacing, commonStyles } = useTheme()

  // Stabilize fetch functions to prevent infinite loops
  const fetchUserProfile = useCallback(async (currentUser: any) => {
    if (!currentUser?.id) throw new Error('User not authenticated')
    return await getUserProfile(currentUser.id)
  }, [])

  const fetchUpcomingEvents = useCallback(async () => {
    return await getUserAccessibleEvents()
  }, [])

  const fetchRecentActivity = useCallback(async () => {
    return await getUserRecentActivity()
  }, [])

  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refetchProfile
  } = useAuthDataFetching(
    fetchUserProfile,
    {
      requireAuth: true,
      user,
      isAuthReady: true
    }
  )

  const {
    data: upcomingEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents
  } = useAuthDataFetching(
    fetchUpcomingEvents,
    {
      requireAuth: true,
      user,
      isAuthReady: true
    }
  )

  const {
    data: recentActivity,
    isLoading: activityLoading,
    refetch: refetchActivity
  } = useAuthDataFetching(
    fetchRecentActivity,
    {
      requireAuth: true,
      user,
      isAuthReady: true
    }
  )

  const isLoading = profileLoading || eventsLoading || activityLoading

  const handleRefresh = async () => {
    await Promise.all([
      refetchProfile(),
      refetchEvents(),
      refetchActivity()
    ])
  }

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent')
  }

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event.id })
  }

  return (
    <ScrollView
      style={commonStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.accentPrimary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[commonStyles.heading2, styles.welcomeText]}>
          Welcome back{userProfile?.display_name ? `, ${userProfile.display_name}` : ''}!
        </Text>
        <Text style={[commonStyles.textSecondary, styles.subtitleText]}>
          Ready to discover your next adventure?
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={handleCreateEvent}
          style={[commonStyles.primaryButton, styles.createButton]}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.btnPrimaryText} />
          <Text style={[commonStyles.primaryButtonText, styles.createButtonText]}>
            Create Event
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events Section */}
      <View style={styles.section}>
        <Text style={[commonStyles.heading2, styles.sectionTitle]}>
          Your Upcoming Events
        </Text>

        {upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.slice(0, 3).map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[commonStyles.glassCard, styles.eventCard]}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.eventHeader}>
                <Text style={[commonStyles.textPrimary, styles.eventTitle]} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={[commonStyles.textMuted, styles.eventTime]}>
                  {new Date(event.date_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.eventDetails}>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Text style={[commonStyles.textMuted, styles.eventLocation]} numberOfLines={1}>
                    {event.place_nickname || event.location}
                  </Text>
                </View>
                {event.vibe && (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="happy-outline" size={16} color={colors.textMuted} />
                    <Text style={[commonStyles.textMuted, styles.eventVibe]}>
                      {event.vibe}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyCard]}>
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={[commonStyles.textSecondary, styles.emptyTitle]}>
                No upcoming events yet
              </Text>
              <Text style={[commonStyles.textMuted, styles.emptySubtitle]}>
                Create your first event or join others in Discover
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[commonStyles.heading2, styles.sectionTitle]}>
          Recent Activity
        </Text>

        {recentActivity && recentActivity.length > 0 ? (
          recentActivity.slice(0, 3).map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[commonStyles.glassCard, styles.activityCard]}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.activityHeader}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <View style={styles.activityContent}>
                  <Text style={[commonStyles.textSecondary, styles.activityTitle]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[commonStyles.textMuted, styles.activityTime]}>
                    {new Date(event.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyCard]}>
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={colors.textMuted} />
              <Text style={[commonStyles.textSecondary, styles.emptyTitle]}>
                No recent activity
              </Text>
              <Text style={[commonStyles.textMuted, styles.emptySubtitle]}>
                Your event activity will appear here
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    marginBottom: 4,
  },
  subtitleText: {
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
  },
  createButtonText: {
    marginLeft: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  eventTime: {
    fontSize: 14,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLocation: {
    flex: 1,
    fontSize: 14,
  },
  eventVibe: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  activityCard: {
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    flex: 1,
    fontSize: 15,
    marginRight: 12,
  },
  activityTime: {
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 80,
  },
})
