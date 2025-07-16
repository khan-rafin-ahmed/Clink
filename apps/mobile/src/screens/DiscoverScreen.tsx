import React, { useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useTheme } from '../hooks/useTheme'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getPublicEvents } from '@shared/lib/eventService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import type { EventWithCreator } from '@shared/lib/eventService'

type DiscoverScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>()
  const { colors, commonStyles } = useTheme()

  // Stabilize the fetch function to prevent infinite loops
  const fetchEvents = useCallback(async () => {
    return await getPublicEvents()
  }, [])

  const {
    data: events,
    isLoading,
    refetch
  } = useDataFetching(fetchEvents, {
    onError: (error) => {
      console.error('Failed to load events:', error)
    }
  })

  const handleEventPress = (event: EventWithCreator) => {
    navigation.navigate('EventDetail', { eventId: event.id })
  }

  const handleRefresh = async () => {
    await refetch()
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
        <Text style={commonStyles.heading2}>
          Discover Events
        </Text>
        <Text style={[commonStyles.textSecondary, styles.subtitle]}>
          Find amazing events happening around you
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.section}>
        <TouchableOpacity style={[commonStyles.glassCard, styles.searchBar]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={[commonStyles.textMuted, styles.searchText]}>
            Search events, locations, or vibes...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.section}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {['All', 'Tonight', 'This Weekend', 'Casual', 'Party', 'Chill'].map((filter, index) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, index > 0 && styles.filterChipSpacing]}
              >
                <Text style={[commonStyles.textSecondary, styles.filterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Events List */}
      <View style={styles.section}>
        <Text style={[commonStyles.heading2, styles.sectionTitle]}>
          Events Near You
        </Text>

        {events && events.length > 0 ? (
          events.map((event) => (
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

                {event.creator && (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                    <Text style={[commonStyles.textMuted, styles.eventHost]}>
                      Hosted by {event.creator.display_name || 'Anonymous'}
                    </Text>
                  </View>
                )}

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
              <Ionicons name="location-outline" size={48} color={colors.textMuted} />
              <Text style={[commonStyles.textSecondary, styles.emptyTitle]}>
                No events found
              </Text>
              <Text style={[commonStyles.textMuted, styles.emptySubtitle]}>
                Be the first to create an event in your area!
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
  subtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    marginLeft: 12,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipSpacing: {
    marginLeft: 12,
  },
  filterText: {
    fontSize: 14,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventLocation: {
    flex: 1,
    fontSize: 14,
  },
  eventHost: {
    flex: 1,
    fontSize: 14,
  },
  eventVibe: {
    fontSize: 14,
    textTransform: 'capitalize',
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
