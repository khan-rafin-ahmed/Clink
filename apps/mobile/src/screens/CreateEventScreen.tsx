import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DateTimePicker from '@react-native-community/datetimepicker'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { createEvent } from '@shared/lib/eventService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { GlassCard, GlassButton } from '../components/ui'

type CreateEventNavigationProp = NativeStackNavigationProp<RootStackParamList>

interface EventFormData {
  title: string
  location: string
  placeNickname: string
  dateTime: Date
  vibe: string
  notes: string
  isPrivate: boolean
}

export function CreateEventScreen() {
  const navigation = useNavigation<CreateEventNavigationProp>()
  const { colors, commonStyles, spacing } = useTheme()
  const { user } = useAuth()

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    location: '',
    placeNickname: '',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Default to 2 hours from now
    vibe: '',
    notes: '',
    isPrivate: false,
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const vibes = [
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'party', label: 'Party', icon: 'musical-notes-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'chill', label: 'Chill', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'wild', label: 'Wild', icon: 'flash-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'classy', label: 'Classy', icon: 'wine-outline' as keyof typeof Ionicons.glyphMap },
  ]

  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const newDateTime = new Date(formData.dateTime)
      newDateTime.setFullYear(selectedDate.getFullYear())
      newDateTime.setMonth(selectedDate.getMonth())
      newDateTime.setDate(selectedDate.getDate())
      updateFormData('dateTime', newDateTime)
    }
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      const newDateTime = new Date(formData.dateTime)
      newDateTime.setHours(selectedTime.getHours())
      newDateTime.setMinutes(selectedTime.getMinutes())
      updateFormData('dateTime', newDateTime)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Please enter an event title'
    if (!formData.location.trim()) return 'Please enter a location'
    if (!formData.vibe) return 'Please select a vibe'
    if (formData.dateTime <= new Date()) return 'Please select a future date and time'
    return null
  }

  const handleCreateEvent = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to create an event')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      Alert.alert('Error', validationError)
      return
    }

    try {
      setIsCreating(true)

      const eventData = {
        title: formData.title.trim(),
        location: formData.location.trim(),
        place_nickname: formData.placeNickname.trim() || null,
        date_time: formData.dateTime.toISOString(),
        vibe: formData.vibe,
        special_notes: formData.notes.trim() || null,
        is_private: formData.isPrivate,
        created_by: user.id,
      }

      const result = await createEvent(eventData)

      if (result.success && result.data) {
        Alert.alert(
          'Success!',
          'Your event has been created successfully',
          [
            {
              text: 'View Event',
              onPress: () => {
                navigation.replace('EventDetail', { eventId: result.data.id })
              }
            }
          ]
        )
      } else {
        Alert.alert('Error', result.error || 'Failed to create event')
      }
    } catch (error: any) {
      console.error('Failed to create event:', error)
      Alert.alert('Error', error.message || 'Failed to create event')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <ScrollView style={commonStyles.container}>
      <View style={styles.content}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Event Title</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              placeholder="What's the occasion?"
              placeholderTextColor={colors.textMuted}
              style={[commonStyles.textPrimary, styles.textInput]}
            />
          </GlassCard>
        </View>

        {/* Location Input */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Location</Text>
          <GlassCard variant="subtle" padding="none">
            <View style={styles.inputWithIcon}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="Where's it happening?"
                placeholderTextColor={colors.textMuted}
                style={[commonStyles.textPrimary, styles.textInputWithIcon]}
              />
            </View>
          </GlassCard>
        </View>

        {/* Place Nickname Input */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Place Nickname (Optional)</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.placeNickname}
              onChangeText={(value) => updateFormData('placeNickname', value)}
              placeholder="e.g., John's Place, The Rooftop"
              placeholderTextColor={colors.textMuted}
              style={[commonStyles.textPrimary, styles.textInput]}
            />
          </GlassCard>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <GlassCard
              variant="interactive"
              padding="md"
              style={styles.dateTimeCard}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                <Text style={[commonStyles.textSecondary, styles.dateTimeText]}>
                  {formData.dateTime.toLocaleDateString()}
                </Text>
              </View>
            </GlassCard>

            <GlassCard
              variant="interactive"
              padding="md"
              style={styles.dateTimeCard}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.inputWithIcon}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={[commonStyles.textSecondary, styles.dateTimeText]}>
                  {formData.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>

        {/* Vibe Selection */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Vibe</Text>
          <View style={styles.vibeGrid}>
            {vibes.map((vibe) => (
              <GlassCard
                key={vibe.id}
                variant={formData.vibe === vibe.id ? "enhanced" : "subtle"}
                padding="md"
                style={[
                  styles.vibeCard,
                  formData.vibe === vibe.id && styles.vibeCardSelected
                ]}
                onPress={() => updateFormData('vibe', vibe.id)}
              >
                <View style={styles.vibeContent}>
                  <Ionicons
                    name={vibe.icon}
                    size={20}
                    color={formData.vibe === vibe.id ? colors.accentPrimary : colors.textMuted}
                  />
                  <Text
                    style={[
                      commonStyles.textSecondary,
                      styles.vibeLabel,
                      formData.vibe === vibe.id && { color: colors.accentPrimary }
                    ]}
                  >
                    {vibe.label}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Notes (Optional)</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="Any special details or instructions?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[commonStyles.textPrimary, styles.textInputMultiline]}
            />
          </GlassCard>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Privacy</Text>
          <GlassCard variant="subtle" padding="none">
            <GlassCard
              variant="interactive"
              padding="md"
              style={[styles.privacyOption, !formData.isPrivate && styles.privacyOptionSelected]}
              onPress={() => updateFormData('isPrivate', false)}
            >
              <View style={styles.privacyContent}>
                <Ionicons name="globe-outline" size={20} color={colors.textMuted} />
                <View style={styles.privacyText}>
                  <Text style={commonStyles.textPrimary}>Public Event</Text>
                  <Text style={[commonStyles.textMuted, styles.privacyDescription]}>
                    Anyone can find and join
                  </Text>
                </View>
                <Ionicons
                  name={!formData.isPrivate ? "radio-button-on-outline" : "radio-button-off-outline"}
                  size={20}
                  color={!formData.isPrivate ? colors.accentPrimary : colors.textMuted}
                />
              </View>
            </GlassCard>

            <GlassCard
              variant="interactive"
              padding="md"
              style={[styles.privacyOption, formData.isPrivate && styles.privacyOptionSelected]}
              onPress={() => updateFormData('isPrivate', true)}
            >
              <View style={styles.privacyContent}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <View style={styles.privacyText}>
                  <Text style={commonStyles.textPrimary}>Private Event</Text>
                  <Text style={[commonStyles.textMuted, styles.privacyDescription]}>
                    Invite only
                  </Text>
                </View>
                <Ionicons
                  name={formData.isPrivate ? "radio-button-on-outline" : "radio-button-off-outline"}
                  size={20}
                  color={formData.isPrivate ? colors.accentPrimary : colors.textMuted}
                />
              </View>
            </GlassCard>
          </GlassCard>
        </View>

        {/* Create Button */}
        <GlassButton
          variant="primary"
          size="lg"
          loading={isCreating}
          onPress={handleCreateEvent}
          style={styles.createButton}
        >
          {isCreating ? 'Creating Event...' : 'Create Event'}
        </GlassButton>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateTime}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={formData.dateTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 48,
  },
  textInputWithIcon: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  textInputMultiline: {
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeCard: {
    flex: 1,
  },
  dateTimeText: {
    marginLeft: 12,
    fontSize: 16,
  },
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vibeCard: {
    minWidth: 100,
  },
  vibeCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  vibeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  privacyOption: {
    marginBottom: 8,
  },
  privacyOptionSelected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  createButton: {
    marginTop: 16,
  },
})
