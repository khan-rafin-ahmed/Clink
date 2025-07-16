import React, { useCallback, useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useAuth } from '../lib/AuthContext'
import { useAuthDataFetching } from '@shared/hooks/useDataFetching'
import { getUserProfile } from '@shared/lib/userService'
import { getUserStats, getUserEvents } from '@shared/lib/userStatsService'
import { getUserCrews } from '@shared/lib/crewService'
import { signOut } from '../lib/authService'
import { useTheme } from '../hooks/useTheme'
import { UserAvatar } from '../components/UserAvatar'
import { GlassButton } from '../components/ui'
import type { RootStackParamList } from '../navigation/AppNavigator'

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function ProfileScreen() {
  const { user } = useAuth()
  const { colors, commonStyles } = useTheme()
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const [userStats, setUserStats] = useState({ totalEvents: 0, totalRSVPs: 0, totalCrews: 0, upcomingEvents: 0, pastEvents: 0 })
  const [userEvents, setUserEvents] = useState({ upcoming: [], past: [] })
  const [userCrews, setUserCrews] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Stabilize the fetch function to prevent infinite loops
  const fetchUserProfile = useCallback(async (currentUser: any) => {
    if (!currentUser?.id) throw new Error('User not authenticated')
    return await getUserProfile(currentUser.id)
  }, [])

  const {
    data: userProfile,
    isLoading,
    refetch
  } = useAuthDataFetching(
    fetchUserProfile,
    {
      requireAuth: true,
      user,
      isAuthReady: true
    }
  )

  // Fetch user statistics
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return

    try {
      setStatsLoading(true)
      const [stats, events, crews] = await Promise.all([
        getUserStats(user.id),
        getUserEvents(user.id),
        getUserCrews(user.id)
      ])

      console.log('📊 User Stats:', stats)
      console.log('📅 User Events:', { upcoming: events.upcoming.length, past: events.past.length })
      console.log('👥 User Crews:', crews.length)

      setUserStats(stats)
      setUserEvents(events)
      setUserCrews(crews)
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [user?.id])

  // Fetch data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserStats()
    }
  }, [user?.id, fetchUserStats])

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetch(),
        fetchUserStats()
      ])
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch, fetchUserStats])

  // Navigation handlers
  const handleEventPress = useCallback((eventId: string) => {
    navigation.navigate('EventDetail', { eventId })
  }, [navigation])

  const handleCrewPress = useCallback((crewId: string) => {
    navigation.navigate('CrewDetail', { crewId })
  }, [navigation])

  const handleCreateCrew = useCallback(() => {
    navigation.navigate('CreateCrew')
  }, [navigation])

  const handleCreateEvent = useCallback(() => {
    navigation.navigate('CreateEvent')
  }, [navigation])

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={commonStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.accentPrimary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {/* User Avatar */}
          <UserAvatar
            userId={userProfile?.user_id}
            displayName={userProfile?.display_name}
            avatarUrl={userProfile?.avatar_url}
            size="xl"
            style={styles.avatarContainer}
          />

          <Text style={[commonStyles.heading2, styles.displayName]}>
            {userProfile?.display_name || 'User'}
          </Text>

          {userProfile?.nickname && (
            <Text style={[styles.nickname, { color: colors.accentPrimary }]}>
              "{userProfile.nickname}"
            </Text>
          )}

          <Text style={[commonStyles.textSecondary, styles.username]}>
            @{userProfile?.username || 'username'}
          </Text>

          {userProfile?.bio && (
            <Text style={[commonStyles.textSecondary, styles.bio]}>
              {userProfile.bio}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={[commonStyles.glassCard, styles.statsCard]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[commonStyles.heading2, styles.statNumber]}>
                {statsLoading ? '—' : userStats.totalEvents}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.statLabel]}>Events</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[commonStyles.heading2, styles.statNumber]}>
                {statsLoading ? '—' : userStats.totalCrews}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.statLabel]}>Crews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[commonStyles.heading2, styles.statNumber]}>
                {statsLoading ? '—' : userStats.totalRSVPs}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.statLabel]}>RSVPs</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <GlassButton
          variant="primary"
          size="lg"
          onPress={handleCreateEvent}
          style={styles.createEventButton}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="add-outline" size={20} color="#08090A" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Create Event</Text>
          </View>
        </GlassButton>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <View style={[commonStyles.glassCard, styles.menuCard]}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
            <Ionicons name="person-outline" size={24} color={colors.textMuted} />
            <Text style={[commonStyles.textPrimary, styles.menuText]}>Edit Profile</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
            <Ionicons name="notifications-outline" size={24} color={colors.textMuted} />
            <Text style={[commonStyles.textPrimary, styles.menuText]}>Notifications</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
            <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
            <Text style={[commonStyles.textPrimary, styles.menuText]}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.textMuted} />
            <Text style={[commonStyles.textPrimary, styles.menuText]}>Help & Support</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.menuItem}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Events Section */}
      {(userEvents.upcoming.length > 0 || userEvents.past.length > 0) && (
        <View style={styles.section}>
          <Text style={[commonStyles.heading2, styles.sectionTitle]}>Events</Text>

          {/* Upcoming Events */}
          {userEvents.upcoming.length > 0 && (
            <View style={styles.subsection}>
              <Text style={[commonStyles.textSecondary, styles.subsectionTitle]}>
                Upcoming ({userEvents.upcoming.length})
              </Text>
              <View style={[commonStyles.glassCard, styles.eventsCard]}>
                {userEvents.upcoming.slice(0, 3).map((event: any, index: number) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventItem, index < 2 && styles.eventItemBorder]}
                    onPress={() => handleEventPress(event.id)}
                  >
                    <View style={styles.eventInfo}>
                      <Text style={[commonStyles.textPrimary, styles.eventTitle]} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={[commonStyles.textSecondary, styles.eventDate]}>
                        {new Date(event.date_time).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
                {userEvents.upcoming.length > 3 && (
                  <View style={styles.eventItem}>
                    <Text style={[commonStyles.textSecondary, styles.moreText]}>
                      +{userEvents.upcoming.length - 3} more upcoming events
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Past Events */}
          {userEvents.past.length > 0 && (
            <View style={styles.subsection}>
              <Text style={[commonStyles.textSecondary, styles.subsectionTitle]}>
                Past ({userEvents.past.length})
              </Text>
              <View style={[commonStyles.glassCard, styles.eventsCard]}>
                {userEvents.past.slice(0, 3).map((event: any, index: number) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventItem, index < 2 && styles.eventItemBorder]}
                    onPress={() => handleEventPress(event.id)}
                  >
                    <View style={styles.eventInfo}>
                      <Text style={[commonStyles.textPrimary, styles.eventTitle]} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={[commonStyles.textSecondary, styles.eventDate]}>
                        {new Date(event.date_time).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
                {userEvents.past.length > 3 && (
                  <View style={styles.eventItem}>
                    <Text style={[commonStyles.textSecondary, styles.moreText]}>
                      +{userEvents.past.length - 3} more past events
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Crews Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[commonStyles.heading2, styles.sectionTitle]}>
            Crews ({userCrews.length})
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCrew}
          >
            <Ionicons name="add" size={20} color={colors.accentPrimary} />
            <Text style={[commonStyles.textSecondary, { color: colors.accentPrimary, marginLeft: 4 }]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {userCrews.length > 0 ? (
          <View style={[commonStyles.glassCard, styles.crewsCard]}>
            {userCrews.slice(0, 3).map((crew: any, index: number) => (
              <TouchableOpacity
                key={crew.id}
                style={[styles.crewItem, index < Math.min(userCrews.length - 1, 2) && styles.crewItemBorder]}
                onPress={() => handleCrewPress(crew.id)}
              >
                <View style={styles.crewInfo}>
                  <Text style={[commonStyles.textPrimary, styles.crewName]} numberOfLines={1}>
                    {crew.name}
                  </Text>
                  <Text style={[commonStyles.textSecondary, styles.crewMembers]}>
                    {crew.member_count} member{crew.member_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            {userCrews.length > 3 && (
              <View style={styles.crewItem}>
                <Text style={[commonStyles.textSecondary, styles.moreText]}>
                  +{userCrews.length - 3} more crews
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyCrewsCard]}>
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={[commonStyles.textSecondary, styles.emptyTitle]}>
                No Crews Yet
              </Text>
              <Text style={[commonStyles.textMuted, styles.emptySubtitle]}>
                Create your first crew to start organizing events with friends
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
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  displayName: {
    marginBottom: 4,
  },
  nickname: {
    fontStyle: 'italic',
    fontSize: 18,
    marginTop: 4,
  },
  username: {
    marginTop: 8,
  },
  bio: {
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsCard: {
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  menuCard: {
    overflow: 'hidden',
    paddingVertical: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuText: {
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 80,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  eventsCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
  },
  crewsCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  emptyCrewsCard: {
    padding: 32,
    alignItems: 'center',
  },
  crewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  crewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  crewMembers: {
    fontSize: 14,
  },
  moreText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  createEventButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#08090A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
