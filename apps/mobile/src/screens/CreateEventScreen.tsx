import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, Alert, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { createEvent } from '@shared/lib/eventService'
import { getUserCrews } from '@shared/lib/crewService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { GlassCard, GlassButton } from '../components/ui'

type CreateEventNavigationProp = NativeStackNavigationProp<RootStackParamList>

interface EventFormData {
  title: string
  location: string
  place_nickname: string
  dateTime: Date
  endTime: Date
  drink_type: string
  vibe: string
  notes: string
  is_public: boolean
  time: 'now' | 'custom'
  cover_image: string | null
  invited_users: string[]
  invited_crews: string[]
}

export function CreateEventScreen() {
  const navigation = useNavigation<CreateEventNavigationProp>()
  const { colors, commonStyles, spacing } = useTheme()
  const { user } = useAuth()

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    location: '',
    place_nickname: '',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Default to 2 hours from now
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // Default to 5 hours from now
    drink_type: 'beer', // Default as per architecture
    vibe: 'casual', // Default as per architecture
    notes: '',
    is_public: true, // Default as per architecture
    time: 'now', // Default to "Right now" as per web app
    cover_image: null,
    invited_users: [],
    invited_crews: [],
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [userCrews, setUserCrews] = useState<any[]>([])
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [isLoadingCrews, setIsLoadingCrews] = useState(false)

  const drinkTypes = [
    { value: 'beer', label: 'Beer', emoji: '🍺' },
    { value: 'wine', label: 'Wine', emoji: '🍷' },
    { value: 'whiskey', label: 'Whiskey', emoji: '🥃' },
    { value: 'cocktails', label: 'Cocktails', emoji: '🍸' },
    { value: 'shots', label: 'Shots', emoji: '🥂' },
    { value: 'mixed', label: 'Mixed', emoji: '🍹' },
  ]

  const vibes = [
    { value: 'casual', label: 'Casual Hang', emoji: '😎' },
    { value: 'party', label: 'Party Mode', emoji: '🎉' },
    { value: 'shots', label: 'Shots Night', emoji: '🥃' },
    { value: 'chill', label: 'Chill Vibes', emoji: '🌙' },
    { value: 'wild', label: 'Wild Night', emoji: '🔥' },
    { value: 'classy', label: 'Classy Evening', emoji: '🥂' },
  ]

  const timeOptions = [
    { value: 'now', label: 'Right Now', emoji: '🚀' },
    { value: 'custom', label: 'Pick Your Time', emoji: '⏰' }
  ]

  // Simple dropdown component
  interface DropdownOption {
    value: string
    label: string
    emoji: string
  }

  interface DropdownProps {
    label: string
    value: string
    options: DropdownOption[]
    onSelect: (value: string) => void
    placeholder?: string
  }

  const SimpleDropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const selectedOption = options.find(opt => opt.value === value)

    const handleTriggerPress = (event: any) => {
      const target = event.currentTarget
      target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setDropdownLayout({ x: pageX, y: pageY + height, width, height })
        setIsOpen(true)
      })
    }

    return (
      <View style={styles.section}>
        <Text style={[commonStyles.textPrimary, styles.label]}>{label}</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleTriggerPress}
        >
          <View style={styles.dropdownContent}>
            {selectedOption ? (
              <View style={styles.selectedOption}>
                <Text style={styles.optionEmoji}>{selectedOption.emoji}</Text>
                <Text style={[commonStyles.textPrimary, styles.optionLabel]}>{selectedOption.label}</Text>
              </View>
            ) : (
              <Text style={[commonStyles.textMuted, styles.placeholder]}>{placeholder || 'Select option'}</Text>
            )}
            <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <Modal visible={isOpen} transparent animationType="none">
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: 'rgba(8, 9, 10, 0.95)', // More opaque background
                  left: dropdownLayout.x,
                  top: dropdownLayout.y,
                  width: dropdownLayout.width,
                }
              ]}
            >
              <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                {options.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.dropdownOption, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}
                    onPress={() => {
                      onSelect(item.value)
                      setIsOpen(false)
                    }}
                  >
                    <Text style={styles.optionEmoji}>{item.emoji}</Text>
                    <Text style={[commonStyles.textPrimary, styles.optionLabel]}>{item.label}</Text>
                    {value === item.value && (
                      <Ionicons name="checkmark" size={20} color={colors.accentPrimary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }

  // Multi-select dropdown component for crews
  interface MultiSelectDropdownProps {
    label: string
    selectedIds: string[]
    options: Array<{ id: string; name: string; member_count?: number }>
    onToggle: (id: string) => void
    placeholder?: string
    isLoading?: boolean
  }

  const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    label,
    selectedIds,
    options,
    onToggle,
    placeholder,
    isLoading
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })

    const handleTriggerPress = (event: any) => {
      if (isLoading) return
      const target = event.currentTarget
      target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setDropdownLayout({ x: pageX, y: pageY + height, width, height })
        setIsOpen(true)
      })
    }

    return (
      <View style={styles.section}>
        <Text style={[commonStyles.textPrimary, styles.label]}>{label}</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleTriggerPress}
          disabled={isLoading}
        >
          <View style={styles.dropdownContent}>
            {selectedIds.length > 0 ? (
              <Text style={[commonStyles.textPrimary, styles.optionLabel]}>
                {selectedIds.length} crew{selectedIds.length !== 1 ? 's' : ''} selected
              </Text>
            ) : (
              <Text style={[commonStyles.textMuted, styles.placeholder]}>
                {isLoading ? 'Loading crews...' : (placeholder || 'Select crews')}
              </Text>
            )}
            <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        <Modal visible={isOpen} transparent animationType="none">
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: 'rgba(8, 9, 10, 0.95)', // More opaque background
                  left: dropdownLayout.x,
                  top: dropdownLayout.y,
                  width: dropdownLayout.width,
                }
              ]}
            >
              <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                {options.length === 0 ? (
                  <View style={styles.noOptionsContainer}>
                    <Text style={[commonStyles.textMuted, styles.noOptionsText]}>
                      No crews available
                    </Text>
                  </View>
                ) : (
                  options.map((crew) => (
                    <TouchableOpacity
                      key={crew.id}
                      style={[styles.dropdownOption, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}
                      onPress={() => onToggle(crew.id)}
                    >
                      <View style={styles.crewOptionContent}>
                        <View style={styles.crewOptionInfo}>
                          <Text style={[commonStyles.textPrimary, styles.optionLabel]}>{crew.name}</Text>
                          <Text style={[commonStyles.textMuted, styles.crewMemberText]}>
                            {crew.member_count || 0} members
                          </Text>
                        </View>
                        <Ionicons
                          name={selectedIds.includes(crew.id) ? "checkmark-circle" : "radio-button-off-outline"}
                          size={24}
                          color={selectedIds.includes(crew.id) ? colors.accentPrimary : colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }

  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Load user's crews on component mount
  useEffect(() => {
    if (user) {
      loadUserCrews()
    }
  }, [user])

  const loadUserCrews = async () => {
    if (!user) return

    setIsLoadingCrews(true)
    try {
      const crews = await getUserCrews(user.id)
      setUserCrews(crews || [])
    } catch (error) {
      console.error('Error loading user crews:', error)
      setUserCrews([])
    } finally {
      setIsLoadingCrews(false)
    }
  }

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.')
        return
      }

      setIsUploading(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Check file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select an image smaller than 5MB.')
          return
        }

        updateFormData('cover_image', asset.uri)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    updateFormData('cover_image', null)
  }

  const handleAddUser = () => {
    if (!inviteUsername.trim()) {
      Alert.alert('Error', 'Please enter a username')
      return
    }

    if (formData.invited_users.includes(inviteUsername.trim())) {
      Alert.alert('Error', 'User already invited')
      return
    }

    updateFormData('invited_users', [...formData.invited_users, inviteUsername.trim()])
    setInviteUsername('')
  }

  const handleRemoveUser = (username: string) => {
    updateFormData('invited_users', formData.invited_users.filter(u => u !== username))
  }

  const handleToggleCrew = (crewId: string) => {
    const isSelected = selectedCrewIds.includes(crewId)
    if (isSelected) {
      setSelectedCrewIds(prev => prev.filter(id => id !== crewId))
      updateFormData('invited_crews', formData.invited_crews.filter(id => id !== crewId))
    } else {
      setSelectedCrewIds(prev => [...prev, crewId])
      updateFormData('invited_crews', [...formData.invited_crews, crewId])
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date picker changed:', selectedDate)
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
    console.log('Time picker changed:', selectedTime)
    setShowTimePicker(false)
    if (selectedTime) {
      const newDateTime = new Date(formData.dateTime)
      newDateTime.setHours(selectedTime.getHours())
      newDateTime.setMinutes(selectedTime.getMinutes())
      updateFormData('dateTime', newDateTime)

      // Auto-update end time to be 3 hours after start time
      const newEndTime = new Date(newDateTime)
      newEndTime.setHours(newEndTime.getHours() + 3)
      updateFormData('endTime', newEndTime)
    }
  }

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      const newEndTime = new Date(formData.endTime)
      newEndTime.setFullYear(selectedDate.getFullYear())
      newEndTime.setMonth(selectedDate.getMonth())
      newEndTime.setDate(selectedDate.getDate())
      updateFormData('endTime', newEndTime)
    }
  }

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false)
    if (selectedTime) {
      const newEndTime = new Date(formData.endTime)
      newEndTime.setHours(selectedTime.getHours())
      newEndTime.setMinutes(selectedTime.getMinutes())
      updateFormData('endTime', newEndTime)
    }
  }

  const validateForm = (): string | null => {
    // Step 1 validations (required fields)
    if (!formData.title.trim()) return 'Event title is required'
    if (formData.title.trim().length < 3) return 'Title must be at least 3 characters'
    if (formData.title.trim().length > 100) return 'Title must be less than 100 characters'

    // Step 2 validations (required fields)
    if (!formData.drink_type) return 'Drink selection is required'
    if (!formData.vibe) return 'Vibe selection is required'

    // Time validation
    if (formData.time === 'custom') {
      if (formData.dateTime <= new Date()) return 'Start time cannot be in the past'
      if (formData.endTime <= formData.dateTime) return 'End time must be after start time'
    }

    // Optional validations
    if (formData.notes && formData.notes.length > 300) {
      return 'Notes must be less than 300 characters'
    }

    // Cover image validation (basic check for mobile)
    if (formData.cover_image && !formData.cover_image.startsWith('file://')) {
      return 'Invalid cover image selected'
    }

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
        place_nickname: formData.place_nickname.trim() || null,
        date_time: formData.time === 'now' ? new Date().toISOString() : formData.dateTime.toISOString(),
        end_time: formData.time === 'custom' ? formData.endTime.toISOString() : null,
        drink_type: formData.drink_type,
        vibe: formData.vibe,
        notes: formData.notes.trim() || null,
        is_private: !formData.is_public, // Invert for backend
        created_by: user.id,
        cover_image_url: formData.cover_image,
        invited_users: formData.invited_users,
        invited_crews: formData.invited_crews,
      }

      const result = await createEvent(eventData)

      if (result.success && result.data?.id) {
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
              value={formData.place_nickname}
              onChangeText={(value) => updateFormData('place_nickname', value)}
              placeholder="e.g., John's Place, The Rooftop"
              placeholderTextColor={colors.textMuted}
              style={[commonStyles.textPrimary, styles.textInput]}
            />
          </GlassCard>
        </View>

        {/* Time Selection */}
        <SimpleDropdown
          label="When"
          value={formData.time}
          options={timeOptions}
          onSelect={(value) => updateFormData('time', value)}
          placeholder="Select timing"
        />

        {/* Custom Date & Time (only when custom time is selected) */}
        {formData.time === 'custom' && (
          <>
            <View style={styles.section}>
              <Text style={[commonStyles.textPrimary, styles.label]}>Start Date & Time</Text>
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

            <View style={styles.section}>
              <Text style={[commonStyles.textPrimary, styles.label]}>End Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <GlassCard
                  variant="interactive"
                  padding="md"
                  style={styles.dateTimeCard}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    <Text style={[commonStyles.textSecondary, styles.dateTimeText]}>
                      {formData.endTime.toLocaleDateString()}
                    </Text>
                  </View>
                </GlassCard>

                <GlassCard
                  variant="interactive"
                  padding="md"
                  style={styles.dateTimeCard}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                    <Text style={[commonStyles.textSecondary, styles.dateTimeText]}>
                      {formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </GlassCard>
              </View>
            </View>
          </>
        )}

        {/* Drink Type Selection */}
        <SimpleDropdown
          label="What's your poison?"
          value={formData.drink_type}
          options={drinkTypes}
          onSelect={(value) => updateFormData('drink_type', value)}
          placeholder="Select your drink"
        />

        {/* Vibe Selection */}
        <SimpleDropdown
          label="What's the vibe?"
          value={formData.vibe}
          options={vibes}
          onSelect={(value) => updateFormData('vibe', value)}
          placeholder="Select the vibe"
        />

        {/* Cover Image Upload */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Event Cover Image (Optional)</Text>
          <View style={styles.coverImageContainer}>
            {/* Preview Section */}
            <View style={styles.imagePreview}>
              {formData.cover_image ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: formData.cover_image }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={handleRemoveImage}
                    style={styles.removeImageButton}
                  >
                    <Ionicons name="close-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderEmoji}>
                    {vibes.find(v => v.value === formData.vibe)?.emoji || '✨'}
                  </Text>
                  <Text style={[commonStyles.textMuted, styles.placeholderText]}>
                    Default {formData.vibe} cover will be used
                  </Text>
                </View>
              )}
            </View>

            {/* Upload Controls */}
            <View style={styles.imageControls}>
              <GlassButton
                variant="secondary"
                size="md"
                onPress={handleImagePicker}
                loading={isUploading}
                style={styles.uploadButton}
              >
                <View style={styles.uploadButtonContent}>
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.uploadButtonText}>Upload Cover</Text>
                </View>
              </GlassButton>
              {formData.cover_image && (
                <GlassButton
                  variant="outline"
                  size="md"
                  onPress={handleRemoveImage}
                  style={styles.removeButton}
                >
                  Remove
                </GlassButton>
              )}
            </View>
            <Text style={[commonStyles.textMuted, styles.uploadHint]}>
              Max 5MB • JPEG, PNG, WebP
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Special Notes (Optional)</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              placeholder="BYOB, dress code, bring snacks, etc."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[commonStyles.textPrimary, styles.textArea]}
              maxLength={300}
            />
          </GlassCard>
          {formData.notes.length > 0 && (
            <Text style={[commonStyles.textMuted, styles.characterCount]}>
              {formData.notes.length}/300
            </Text>
          )}
        </View>

        {/* Event Visibility */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Event Visibility</Text>
          <View style={styles.visibilityOptions}>
            <GlassCard
              variant="interactive"
              padding="md"
              style={StyleSheet.flatten([styles.privacyOption, formData.is_public && styles.privacyOptionSelected])}
              onPress={() => updateFormData('is_public', true)}
            >
              <View style={styles.privacyContent}>
                <Text style={styles.visibilityEmoji}>🌐</Text>
                <View style={styles.privacyText}>
                  <Text style={commonStyles.textPrimary}>Public</Text>
                  <Text style={[commonStyles.textMuted, styles.privacyDescription]}>
                    Everyone can see
                  </Text>
                </View>
                <Ionicons
                  name={formData.is_public ? "radio-button-on-outline" : "radio-button-off-outline"}
                  size={20}
                  color={formData.is_public ? colors.accentPrimary : colors.textMuted}
                />
              </View>
            </GlassCard>

            <GlassCard
              variant="interactive"
              padding="md"
              style={StyleSheet.flatten([styles.privacyOption, !formData.is_public && styles.privacyOptionSelected])}
              onPress={() => updateFormData('is_public', false)}
            >
              <View style={styles.privacyContent}>
                <Text style={styles.visibilityEmoji}>🔒</Text>
                <View style={styles.privacyText}>
                  <Text style={commonStyles.textPrimary}>Private</Text>
                  <Text style={[commonStyles.textMuted, styles.privacyDescription]}>
                    Invite only
                  </Text>
                </View>
                <Ionicons
                  name={!formData.is_public ? "radio-button-on-outline" : "radio-button-off-outline"}
                  size={20}
                  color={!formData.is_public ? colors.accentPrimary : colors.textMuted}
                />
              </View>
            </GlassCard>
          </View>
        </View>

        {/* User Invitations */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Invite People (Optional)</Text>

          {/* Add User Input */}
          <View style={styles.inviteInputContainer}>
            <GlassCard variant="subtle" padding="none" style={styles.inviteInputCard}>
              <View style={styles.inviteInputRow}>
                <TextInput
                  value={inviteUsername}
                  onChangeText={setInviteUsername}
                  placeholder="Enter username..."
                  placeholderTextColor={colors.textMuted}
                  style={[commonStyles.textPrimary, styles.inviteInput]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={handleAddUser}
                  style={styles.addUserButton}
                  disabled={!inviteUsername.trim()}
                >
                  <Ionicons
                    name="add-outline"
                    size={20}
                    color={inviteUsername.trim() ? colors.accentPrimary : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          {/* Invited Users List */}
          {formData.invited_users.length > 0 && (
            <View style={styles.invitedUsersContainer}>
              <Text style={[commonStyles.textSecondary, styles.invitedUsersTitle]}>
                Invited Users ({formData.invited_users.length})
              </Text>
              <View style={styles.invitedUsersList}>
                {formData.invited_users.map((username, index) => (
                  <View key={index} style={styles.invitedUserChip}>
                    <Text style={[commonStyles.textPrimary, styles.invitedUserText]}>
                      @{username}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveUser(username)}
                      style={styles.removeUserButton}
                    >
                      <Ionicons name="close-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={[commonStyles.textMuted, styles.inviteHint]}>
            Enter usernames to send invitations. Users will be notified about your event.
          </Text>
        </View>

        {/* Crew Invitations */}
        <MultiSelectDropdown
          label="Invite Your Crews (Optional)"
          selectedIds={selectedCrewIds}
          options={userCrews.map(crew => ({
            id: crew.id,
            name: crew.name,
            member_count: crew.member_count
          }))}
          onToggle={handleToggleCrew}
          placeholder="Select crews to invite"
          isLoading={isLoadingCrews}
        />

        {selectedCrewIds.length > 0 && (
          <Text style={[commonStyles.textMuted, styles.inviteHint, { marginTop: -12, marginBottom: 16 }]}>
            All crew members will be automatically invited to your event.
          </Text>
        )}

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

        {/* Date Picker Modal */}
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={[commonStyles.textPrimary, styles.pickerTitle]}>Select Start Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.dateTime}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.dateTimePicker}
              />
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal */}
        <Modal visible={showTimePicker} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={[commonStyles.textPrimary, styles.pickerTitle]}>Select Start Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.dateTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.dateTimePicker}
              />
            </View>
          </View>
        </Modal>

        {/* End Date Picker Modal */}
        <Modal visible={showEndDatePicker} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={[commonStyles.textPrimary, styles.pickerTitle]}>Select End Date</Text>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.endTime}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={new Date()}
                style={styles.dateTimePicker}
              />
            </View>
          </View>
        </Modal>

        {/* End Time Picker Modal */}
        <Modal visible={showEndTimePicker} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={[commonStyles.textPrimary, styles.pickerTitle]}>Select End Time</Text>
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.endTime}
                mode="time"
                display="spinner"
                onChange={handleEndTimeChange}
                style={styles.dateTimePicker}
              />
            </View>
          </View>
        </Modal>
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
  textArea: {
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
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
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
  },
  timeCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  drinkCard: {
    width: '30%',
    minWidth: 100,
  },
  drinkCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  drinkContent: {
    alignItems: 'center',
  },
  drinkEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  drinkLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
    alignItems: 'center',
  },
  vibeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  vibeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  visibilityOptions: {
    gap: 12,
  },
  visibilityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  createButton: {
    marginTop: 16,
  },
  // Cover Image Styles
  coverImageContainer: {
    gap: 12,
  },
  imagePreview: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: 12,
    textAlign: 'center',
  },
  imageControls: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 16,
  },
  uploadHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Invitation Styles
  inviteInputContainer: {
    marginBottom: 16,
  },
  inviteInputCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 24,
  },
  addUserButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedUsersContainer: {
    gap: 12,
    marginBottom: 16,
  },
  invitedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  invitedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  invitedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  invitedUserText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeUserButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Crew Invitation Styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  crewsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  crewCard: {
    marginBottom: 0,
  },
  crewCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  crewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  crewMemberCount: {
    fontSize: 12,
  },
  crewSelection: {
    marginLeft: 12,
  },
  noCrewsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
  },
  noCrewsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedCrewsInfo: {
    marginBottom: 12,
  },
  selectedCrewsText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Dropdown styles
  dropdownTrigger: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 16,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
  // Multi-select dropdown styles
  noOptionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  crewOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  crewOptionInfo: {
    flex: 1,
  },
  crewMemberText: {
    fontSize: 12,
    marginTop: 2,
  },
  dateTimePicker: {
    backgroundColor: 'rgba(8, 9, 10, 0.9)',
    borderRadius: 12,
    marginVertical: 10,
  },
  // Date/Time Picker Modal styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerModalContainer: {
    backgroundColor: 'rgba(8, 9, 10, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
})
