import React, { useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../hooks/useTheme'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getUserByUsername } from '@shared/lib/userService'
import { getUserStats, getUserEvents } from '@shared/lib/userStatsService'
import { getUserCrews } from '@shared/lib/crewService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { UserAvatar } from '../components/UserAvatar'
import { GlassCard } from '../components/ui'

type ProfileViewRouteProp = RouteProp<RootStackParamList, 'ProfileView'>
type ProfileViewNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function ProfileViewScreen() {
  const route = useRoute<ProfileViewRouteProp>()
  const navigation = useNavigation<ProfileViewNavigationProp>()
  const { colors, commonStyles, spacing } = useTheme()
  const { username } = route.params

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      const user = await getUserByUsername(username)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      throw error
    }
  }, [username])

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile
  } = useDataFetching(fetchUserProfile, {
    onError: (error) => {
      Alert.alert('Error', 'Failed to load user profile')
      navigation.goBack()
    }
  })

  // Fetch user statistics
  const fetchUserStats = useCallback(async () => {
    if (!userProfile?.id) return null
    return await getUserStats(userProfile.id)
  }, [userProfile?.id])

  const {
    data: userStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useDataFetching(fetchUserStats, {
    enabled: !!userProfile?.id
  })

  // Fetch user events
  const fetchUserEvents = useCallback(async () => {
    if (!userProfile?.id) return []
    return await getUserEvents(userProfile.id)
  }, [userProfile?.id])

  const {
    data: userEvents,
    isLoading: isLoadingEvents,
    refetch: refetchEvents
  } = useDataFetching(fetchUserEvents, {
    enabled: !!userProfile?.id
  })

  // Fetch user crews
  const fetchUserCrews = useCallback(async () => {
    if (!userProfile?.id) return []
    return await getUserCrews(userProfile.id)
  }, [userProfile?.id])

  const {
    data: userCrews,
    isLoading: isLoadingCrews,
    refetch: refetchCrews
  } = useDataFetching(fetchUserCrews, {
    enabled: !!userProfile?.id
  })

  const handleRefresh = async () => {
    await Promise.all([
      refetchProfile(),
      refetchStats(),
      refetchEvents(),
      refetchCrews()
    ])
  }

  const handleEventPress = useCallback((eventId: string) => {
    navigation.navigate('EventDetail', { eventId })
  }, [navigation])

  const handleCrewPress = useCallback((crewId: string) => {
    navigation.navigate('CrewDetail', { crewId })
  }, [navigation])

  const isLoading = isLoadingProfile || isLoadingStats || isLoadingEvents || isLoadingCrews

  if (isLoadingProfile) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Loading profile...</Text>
      </View>
    )
  }

  if (!userProfile) {
    return (
      <View style={commonStyles.centerContainer}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
          User not found
        </Text>
      </View>
    )
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
      {/* Profile Header */}
      <View style={styles.header}>
        <GlassCard variant="enhanced" padding="lg">
          <View style={styles.profileInfo}>
            <UserAvatar
              userId={userProfile.id}
              displayName={userProfile.display_name}
              avatarUrl={userProfile.avatar_url}
              size="xl"
            />
            <View style={styles.userDetails}>
              <Text style={commonStyles.heading2}>
                {userProfile.display_name || 'Anonymous User'}
              </Text>
              {userProfile.nickname && (
                <Text style={[commonStyles.textSecondary, styles.nickname]}>
                  {userProfile.nickname}
                </Text>
              )}
              <Text style={commonStyles.textMuted}>
                @{userProfile.username}
              </Text>
              {userProfile.bio && (
                <Text style={[commonStyles.textSecondary, styles.bio]}>
                  {userProfile.bio}
                </Text>
              )}
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Statistics */}
      {userStats && (
        <View style={styles.section}>
          <GlassCard variant="subtle" padding="lg">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={commonStyles.heading3}>{userStats.totalEvents}</Text>
                <Text style={commonStyles.textMuted}>Events</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={commonStyles.heading3}>{userStats.totalCrews}</Text>
                <Text style={commonStyles.textMuted}>Crews</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={commonStyles.heading3}>{userStats.totalRsvps}</Text>
                <Text style={commonStyles.textMuted}>RSVPs</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Recent Events */}
      {userEvents && userEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={[commonStyles.heading2, styles.sectionTitle]}>
            Recent Events
          </Text>
          {userEvents.slice(0, 3).map((event) => (
            <GlassCard
              key={event.id}
              variant="interactive"
              padding="md"
              style={styles.eventCard}
              onPress={() => handleEventPress(event.id)}
            >
              <Text style={commonStyles.textPrimary} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={commonStyles.textMuted}>
                {new Date(event.date_time).toLocaleDateString()}
              </Text>
            </GlassCard>
          ))}
        </View>
      )}

      {/* User Crews */}
      {userCrews && userCrews.length > 0 && (
        <View style={styles.section}>
          <Text style={[commonStyles.heading2, styles.sectionTitle]}>
            Crews
          </Text>
          {userCrews.map((crew) => (
            <GlassCard
              key={crew.id}
              variant="interactive"
              padding="md"
              style={styles.crewCard}
              onPress={() => handleCrewPress(crew.id)}
            >
              <Text style={commonStyles.textPrimary} numberOfLines={1}>
                {crew.name}
              </Text>
              <Text style={commonStyles.textMuted}>
                {crew.member_count} members
              </Text>
            </GlassCard>
          ))}
        </View>
      )}

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
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  nickname: {
    fontStyle: 'italic',
    color: '#FFD700',
    marginTop: 4,
  },
  bio: {
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  eventCard: {
    marginBottom: 8,
  },
  crewCard: {
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 32,
  },
})
