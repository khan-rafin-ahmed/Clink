import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, Alert, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { createCrew } from '@shared/lib/crewService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { GlassCard, GlassButton } from '../components/ui'

type CreateCrewNavigationProp = NativeStackNavigationProp<RootStackParamList>

interface CrewFormData {
  name: string
  description: string
  vibe: string
  visibility: 'public' | 'private'
}

export function CreateCrewScreen() {
  const navigation = useNavigation<CreateCrewNavigationProp>()
  const { colors, commonStyles } = useTheme()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<CrewFormData>({
    name: '',
    description: '',
    vibe: '',
    visibility: 'private',
  })
  
  const [isCreating, setIsCreating] = useState(false)

  const vibes = [
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'party', label: 'Party', icon: 'musical-notes-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'chill', label: 'Chill', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'wild', label: 'Wild', icon: 'flash-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'classy', label: 'Classy', icon: 'wine-outline' as keyof typeof Ionicons.glyphMap },
  ]

  const updateFormData = (field: keyof CrewFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Please enter a crew name'
    if (!formData.vibe) return 'Please select a vibe'
    return null
  }

  const handleCreateCrew = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to create a crew')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      Alert.alert('Error', validationError)
      return
    }

    try {
      setIsCreating(true)

      const crewData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        vibe: formData.vibe,
        visibility: formData.visibility,
        created_by: user.id,
      }

      const result = await createCrew(crewData)

      if (result.success && result.data) {
        Alert.alert(
          'Success!',
          'Your crew has been created successfully',
          [
            {
              text: 'View Crew',
              onPress: () => {
                navigation.replace('CrewDetail', { crewId: result.data.id })
              }
            }
          ]
        )
      } else {
        Alert.alert('Error', result.error || 'Failed to create crew')
      }
    } catch (error: any) {
      console.error('Failed to create crew:', error)
      Alert.alert('Error', error.message || 'Failed to create crew')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <ScrollView style={commonStyles.container}>
      <View style={styles.content}>
        {/* Crew Name Input */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Crew Name</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="What's your crew called?"
              placeholderTextColor={colors.textMuted}
              style={[commonStyles.textPrimary, styles.textInput]}
            />
          </GlassCard>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Description (Optional)</Text>
          <GlassCard variant="subtle" padding="none">
            <TextInput
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Tell people what your crew is about..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[commonStyles.textPrimary, styles.textInputMultiline]}
            />
          </GlassCard>
        </View>

        {/* Vibe Selection */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Crew Vibe</Text>
          <View style={styles.vibeGrid}>
            {vibes.map((vibe) => (
              <GlassCard
                key={vibe.id}
                variant={formData.vibe === vibe.id ? "enhanced" : "subtle"}
                padding="md"
                style={[
                  styles.vibeCard,
                  formData.vibe === vibe.id ? styles.vibeCardSelected : null
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

        {/* Visibility Settings */}
        <View style={styles.section}>
          <Text style={[commonStyles.textPrimary, styles.label]}>Visibility</Text>
          <GlassCard variant="subtle" padding="none">
            <GlassCard
              variant="interactive"
              padding="md"
              style={[styles.visibilityOption, formData.visibility === 'private' ? styles.visibilityOptionSelected : null]}
              onPress={() => updateFormData('visibility', 'private')}
            >
              <View style={styles.visibilityContent}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <View style={styles.visibilityText}>
                  <Text style={commonStyles.textPrimary}>Private Crew</Text>
                  <Text style={[commonStyles.textMuted, styles.visibilityDescription]}>
                    Invite only, members can invite others
                  </Text>
                </View>
                <Ionicons 
                  name={formData.visibility === 'private' ? "radio-button-on-outline" : "radio-button-off-outline"} 
                  size={20} 
                  color={formData.visibility === 'private' ? colors.accentPrimary : colors.textMuted} 
                />
              </View>
            </GlassCard>
            
            <GlassCard
              variant="interactive"
              padding="md"
              style={[styles.visibilityOption, formData.visibility === 'public' ? styles.visibilityOptionSelected : null]}
              onPress={() => updateFormData('visibility', 'public')}
            >
              <View style={styles.visibilityContent}>
                <Ionicons name="globe-outline" size={20} color={colors.textMuted} />
                <View style={styles.visibilityText}>
                  <Text style={commonStyles.textPrimary}>Public Crew</Text>
                  <Text style={[commonStyles.textMuted, styles.visibilityDescription]}>
                    Anyone can find and request to join
                  </Text>
                </View>
                <Ionicons 
                  name={formData.visibility === 'public' ? "radio-button-on-outline" : "radio-button-off-outline"} 
                  size={20} 
                  color={formData.visibility === 'public' ? colors.accentPrimary : colors.textMuted} 
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
          onPress={handleCreateCrew}
          style={styles.createButton}
        >
          {isCreating ? 'Creating Crew...' : 'Create Crew'}
        </GlassButton>
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
  textInputMultiline: {
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
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
  visibilityOption: {
    marginBottom: 8,
  },
  visibilityOptionSelected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  visibilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    flex: 1,
    marginLeft: 12,
  },
  visibilityDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  createButton: {
    marginTop: 16,
  },
})
