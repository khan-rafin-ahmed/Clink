import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getEventById, updateRsvp, getUserRsvpStatus, getEventMembers } from '@shared/lib/eventService'
import { UserAvatar } from '../components/UserAvatar'
import type { RootStackParamList } from '../navigation/AppNavigator'
import type { RsvpStatus } from '@shared/types'

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>

export function EventDetailScreen() {
  const route = useRoute<EventDetailRouteProp>()
  const { eventId } = route.params
  const { user } = useAuth()
  const { colors, commonStyles } = useTheme()
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false)

  const {
    data: event,
    isLoading,
    refetch
  } = useDataFetching(
    () => getEventById(eventId),
    {
      onError: (error) => {
        console.error('Failed to load event:', error)
        Alert.alert('Error', 'Failed to load event details')
      }
    }
  )

  const {
    data: userRsvpStatus,
    refetch: refetchRsvp
  } = useDataFetching(
    () => getUserRsvpStatus(eventId),
    {
      enabled: !!user,
      onError: (error) => {
        console.warn('Failed to load RSVP status:', error)
      }
    }
  )

  const {
    data: eventMembers,
    refetch: refetchMembers
  } = useDataFetching(
    () => getEventMembers(eventId),
    {
      onError: (error) => {
        console.warn('Failed to load event members:', error)
      }
    }
  )

  const handleRsvpUpdate = async (status: RsvpStatus) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP to events')
      return
    }

    setIsUpdatingRsvp(true)
    try {
      await updateRsvp(eventId, status)
      await refetchRsvp()
      
      const statusText = status === 'going' ? 'attending' : 
                        status === 'maybe' ? 'maybe attending' : 'not attending'
      Alert.alert('RSVP Updated', `You are now ${statusText} this event`)
    } catch (error) {
      console.error('Failed to update RSVP:', error)
      Alert.alert('Error', 'Failed to update RSVP. Please try again.')
    } finally {
      setIsUpdatingRsvp(false)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchRsvp(), refetchMembers()])
  }

  if (!event && !isLoading) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
        <Text style={[commonStyles.textSecondary, styles.errorTitle]}>
          Event Not Found
        </Text>
        <Text style={[commonStyles.textMuted, styles.errorSubtitle]}>
          This event may have been deleted or you don't have access to it.
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
      {event && (
        <>
          {/* Event Header */}
          <View style={styles.header}>
            <Text style={[commonStyles.heading1, styles.eventTitle]}>
              {event.title}
            </Text>
            {event.place_nickname && (
              <Text style={[commonStyles.textSecondary, styles.placeNickname]}>
                {event.place_nickname}
              </Text>
            )}
          </View>

          {/* Event Details Card */}
          <View style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={24} color={colors.accentPrimary} />
                <View style={styles.detailContent}>
                  <Text style={[commonStyles.textPrimary, styles.detailTitle]}>
                    Date & Time
                  </Text>
                  <Text style={[commonStyles.textSecondary, styles.detailValue]}>
                    {new Date(event.date_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                  {event.end_time && (
                    <Text style={[commonStyles.textMuted, styles.endTime]}>
                      Until {new Date(event.end_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={24} color={colors.accentPrimary} />
                <View style={styles.detailContent}>
                  <Text style={[commonStyles.textPrimary, styles.detailTitle]}>
                    Location
                  </Text>
                  <Text style={[commonStyles.textSecondary, styles.detailValue]}>
                    {event.location}
                  </Text>
                </View>
              </View>

              {event.vibe && (
                <View style={styles.detailRow}>
                  <Ionicons name="happy-outline" size={24} color={colors.accentPrimary} />
                  <View style={styles.detailContent}>
                    <Text style={[commonStyles.textPrimary, styles.detailTitle]}>
                      Vibe
                    </Text>
                    <Text style={[commonStyles.textSecondary, styles.detailValue, styles.capitalize]}>
                      {event.vibe}
                    </Text>
                  </View>
                </View>
              )}

              {event.drink_type && (
                <View style={styles.detailRow}>
                  <Ionicons name="wine-outline" size={24} color={colors.accentPrimary} />
                  <View style={styles.detailContent}>
                    <Text style={[commonStyles.textPrimary, styles.detailTitle]}>
                      Drink Type
                    </Text>
                    <Text style={[commonStyles.textSecondary, styles.detailValue, styles.capitalize]}>
                      {event.drink_type}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          {event.notes && (
            <View style={styles.section}>
              <Text style={[commonStyles.heading2, styles.sectionTitle]}>
                Event Notes
              </Text>
              <View style={commonStyles.glassCard}>
                <Text style={[commonStyles.textSecondary, styles.notesText]}>
                  {event.notes}
                </Text>
              </View>
            </View>
          )}

          {/* RSVP Section */}
          {user && (
            <View style={styles.section}>
              <Text style={[commonStyles.heading2, styles.sectionTitle]}>
                Your RSVP
              </Text>
              <View style={styles.rsvpContainer}>
                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    userRsvpStatus === 'going' && styles.rsvpButtonActive,
                    isUpdatingRsvp && styles.rsvpButtonDisabled
                  ]}
                  onPress={() => handleRsvpUpdate('going')}
                  disabled={isUpdatingRsvp}
                >
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={20} 
                    color={userRsvpStatus === 'going' ? colors.bgBase : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.rsvpButtonText,
                    userRsvpStatus === 'going' && styles.rsvpButtonTextActive
                  ]}>
                    Going
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    userRsvpStatus === 'maybe' && styles.rsvpButtonActive,
                    isUpdatingRsvp && styles.rsvpButtonDisabled
                  ]}
                  onPress={() => handleRsvpUpdate('maybe')}
                  disabled={isUpdatingRsvp}
                >
                  <Ionicons 
                    name="help-circle-outline" 
                    size={20} 
                    color={userRsvpStatus === 'maybe' ? colors.bgBase : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.rsvpButtonText,
                    userRsvpStatus === 'maybe' && styles.rsvpButtonTextActive
                  ]}>
                    Maybe
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rsvpButton,
                    userRsvpStatus === 'not_going' && styles.rsvpButtonActive,
                    isUpdatingRsvp && styles.rsvpButtonDisabled
                  ]}
                  onPress={() => handleRsvpUpdate('not_going')}
                  disabled={isUpdatingRsvp}
                >
                  <Ionicons 
                    name="close-circle-outline" 
                    size={20} 
                    color={userRsvpStatus === 'not_going' ? colors.bgBase : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.rsvpButtonText,
                    userRsvpStatus === 'not_going' && styles.rsvpButtonTextActive
                  ]}>
                    Can't Go
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Attendees Section */}
          {eventMembers && eventMembers.length > 0 && (
            <View style={styles.section}>
              <Text style={[commonStyles.heading2, styles.sectionTitle]}>
                Who's Going ({eventMembers.length})
              </Text>
              <View style={commonStyles.glassCard}>
                {eventMembers.map((member, index) => (
                  <View key={member.id} style={styles.attendeeRow}>
                    <View style={styles.attendeeInfo}>
                      <UserAvatar
                        userId={member.user_id}
                        displayName={member.user_profiles?.display_name}
                        avatarUrl={member.user_profiles?.avatar_url}
                        size="md"
                      />
                      <View style={styles.attendeeDetails}>
                        <Text style={[commonStyles.textPrimary, styles.attendeeName]}>
                          {member.user_profiles?.display_name || 'Unknown User'}
                          {member.user_profiles?.nickname && (
                            <Text style={[commonStyles.textMuted, styles.attendeeNickname]}>
                              {' '}({member.user_profiles.nickname})
                            </Text>
                          )}
                        </Text>
                        <Text style={[commonStyles.textMuted, styles.attendeeRole]}>
                          {member.source === 'host' ? '👑 Host' :
                           member.role === 'co_host' ? '⭐ Co-Host' :
                           'Attendee'}
                          {member.source === 'rsvp' && ' • RSVP'}
                          {member.source === 'crew' && ' • Crew'}
                        </Text>
                      </View>
                    </View>
                    {index < eventMembers.length - 1 && <View style={styles.attendeeDivider} />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  eventTitle: {
    marginBottom: 8,
  },
  placeNickname: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  endTime: {
    fontSize: 14,
    marginTop: 2,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  rsvpContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  rsvpButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  rsvpButtonDisabled: {
    opacity: 0.5,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  rsvpButtonTextActive: {
    color: '#08090A',
  },
  attendeeRow: {
    paddingVertical: 12,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  attendeeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  attendeeNickname: {
    fontStyle: 'italic',
    color: '#FFD700',
  },
  attendeeRole: {
    fontSize: 13,
  },
  attendeeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 12,
  },
  bottomSpacing: {
    height: 80,
  },
})
