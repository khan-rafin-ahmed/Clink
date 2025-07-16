import React, { useCallback, useState } from 'react'
import { View, Text, Alert, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getCrewByInviteCode, joinCrewByInviteCode } from '@shared/lib/crewService'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { GlassCard, GlassButton } from '../components/ui'

type CrewJoinRouteProp = RouteProp<RootStackParamList, 'CrewJoin'>
type CrewJoinNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function CrewJoinScreen() {
  const route = useRoute<CrewJoinRouteProp>()
  const navigation = useNavigation<CrewJoinNavigationProp>()
  const { colors, commonStyles } = useTheme()
  const { user } = useAuth()
  const { inviteCode } = route.params
  const [isJoining, setIsJoining] = useState(false)

  // Fetch crew details by invite code
  const fetchCrewDetails = useCallback(async () => {
    try {
      const crew = await getCrewByInviteCode(inviteCode)
      if (!crew) {
        throw new Error('Invalid invite code')
      }
      return crew
    } catch (error) {
      console.error('Failed to fetch crew details:', error)
      throw error
    }
  }, [inviteCode])

  const {
    data: crew,
    isLoading,
    error
  } = useDataFetching(fetchCrewDetails, {
    onError: (error) => {
      Alert.alert('Error', 'Invalid or expired invite link')
    }
  })

  const handleJoinCrew = async () => {
    if (!user || !crew) return

    try {
      setIsJoining(true)
      
      const result = await joinCrewByInviteCode(inviteCode, user.id)
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `You've joined ${crew.name}`,
          [
            {
              text: 'View Crew',
              onPress: () => {
                navigation.replace('CrewDetail', { crewId: crew.id })
              }
            }
          ]
        )
      } else {
        Alert.alert('Error', result.error || 'Failed to join crew')
      }
    } catch (error: any) {
      console.error('Failed to join crew:', error)
      Alert.alert('Error', error.message || 'Failed to join crew')
    } finally {
      setIsJoining(false)
    }
  }

  const handleGoBack = () => {
    navigation.goBack()
  }

  if (isLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Loading crew details...</Text>
      </View>
    )
  }

  if (error || !crew) {
    return (
      <View style={commonStyles.centerContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={[commonStyles.heading2, { marginTop: 16, color: colors.error }]}>
          Invalid Invite
        </Text>
        <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
          This invite link is invalid or has expired
        </Text>
        <GlassButton
          variant="secondary"
          onPress={handleGoBack}
          style={{ marginTop: 24 }}
        >
          Go Back
        </GlassButton>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={commonStyles.centerContainer}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={[commonStyles.heading2, { marginTop: 16 }]}>
          Sign In Required
        </Text>
        <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
          You need to sign in to join this crew
        </Text>
        <GlassButton
          variant="primary"
          onPress={() => navigation.navigate('Login', {})}
          style={{ marginTop: 24 }}
        >
          Sign In
        </GlassButton>
      </View>
    )
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.content}>
        {/* Crew Info */}
        <GlassCard variant="enhanced" padding="xl" style={styles.crewCard}>
          <View style={styles.crewHeader}>
            <Ionicons name="people" size={48} color={colors.accentPrimary} />
            <Text style={[commonStyles.heading1, styles.crewName]}>
              {crew.name}
            </Text>
          </View>

          {crew.description && (
            <Text style={[commonStyles.textSecondary, styles.crewDescription]}>
              {crew.description}
            </Text>
          )}

          <View style={styles.crewStats}>
            <View style={styles.statItem}>
              <Text style={commonStyles.heading3}>{crew.member_count || 0}</Text>
              <Text style={commonStyles.textMuted}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={commonStyles.heading3}>{crew.vibe || 'Mixed'}</Text>
              <Text style={commonStyles.textMuted}>Vibe</Text>
            </View>
          </View>
        </GlassCard>

        {/* Join Action */}
        <View style={styles.actionSection}>
          <Text style={[commonStyles.heading2, styles.actionTitle]}>
            Join This Crew
          </Text>
          <Text style={[commonStyles.textSecondary, styles.actionDescription]}>
            You've been invited to join {crew.name}. Members can create events together and get notified about crew activities.
          </Text>

          <GlassButton
            variant="primary"
            size="lg"
            loading={isJoining}
            onPress={handleJoinCrew}
            style={styles.joinButton}
          >
            {isJoining ? 'Joining...' : 'Join Crew'}
          </GlassButton>

          <GlassButton
            variant="outline"
            onPress={handleGoBack}
            style={styles.cancelButton}
          >
            Maybe Later
          </GlassButton>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  crewCard: {
    marginBottom: 32,
  },
  crewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  crewName: {
    marginTop: 16,
    textAlign: 'center',
  },
  crewDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  crewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  actionSection: {
    alignItems: 'center',
  },
  actionTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  actionDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  joinButton: {
    width: '100%',
    marginBottom: 16,
  },
  cancelButton: {
    width: '100%',
  },
})
