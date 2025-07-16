import React, { useCallback, useState } from 'react'
import { View, Text, Alert, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../lib/AuthContext'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { GlassCard, GlassButton } from '../components/ui'

type InvitationActionRouteProp = RouteProp<RootStackParamList, 'InvitationAction'>
type InvitationActionNavigationProp = NativeStackNavigationProp<RootStackParamList>

interface InvitationDetails {
  type: 'event' | 'crew'
  title: string
  description?: string
  inviter: string
  expired: boolean
}

export function InvitationActionScreen() {
  const route = useRoute<InvitationActionRouteProp>()
  const navigation = useNavigation<InvitationActionNavigationProp>()
  const { colors, commonStyles } = useTheme()
  const { user } = useAuth()
  const { token } = route.params
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch invitation details
  const fetchInvitationDetails = useCallback(async (): Promise<InvitationDetails> => {
    try {
      // This would typically call a shared service to decode the invitation token
      // For now, we'll simulate the response
      
      // TODO: Implement actual invitation token decoding service
      // const details = await decodeInvitationToken(token)
      
      // Simulated response for development
      const mockDetails: InvitationDetails = {
        type: 'event',
        title: 'Sample Event Invitation',
        description: 'You\'ve been invited to join an awesome event!',
        inviter: 'John Doe',
        expired: false
      }
      
      return mockDetails
    } catch (error) {
      console.error('Failed to fetch invitation details:', error)
      throw new Error('Invalid or expired invitation')
    }
  }, [token])

  const {
    data: invitation,
    isLoading,
    error
  } = useDataFetching(fetchInvitationDetails, {
    onError: (error) => {
      Alert.alert('Error', 'Invalid or expired invitation link')
    }
  })

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return

    try {
      setIsProcessing(true)
      
      // TODO: Implement actual invitation acceptance logic
      // const result = await acceptInvitation(token, user.id)
      
      // Simulated success for development
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      Alert.alert(
        'Success!',
        `You've accepted the ${invitation.type} invitation`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to the appropriate screen based on invitation type
              if (invitation.type === 'event') {
                // navigation.navigate('EventDetail', { eventId: 'sample-id' })
                navigation.navigate('Main')
              } else if (invitation.type === 'crew') {
                // navigation.navigate('CrewDetail', { crewId: 'sample-id' })
                navigation.navigate('Main')
              }
            }
          }
        ]
      )
    } catch (error: any) {
      console.error('Failed to accept invitation:', error)
      Alert.alert('Error', error.message || 'Failed to accept invitation')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!user || !invitation) return

    try {
      setIsProcessing(true)
      
      // TODO: Implement actual invitation decline logic
      // const result = await declineInvitation(token, user.id)
      
      // Simulated success for development
      await new Promise(resolve => setTimeout(resolve, 500))
      
      Alert.alert(
        'Invitation Declined',
        'You have declined this invitation',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main')
          }
        ]
      )
    } catch (error: any) {
      console.error('Failed to decline invitation:', error)
      Alert.alert('Error', error.message || 'Failed to decline invitation')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoBack = () => {
    navigation.navigate('Main')
  }

  if (isLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Loading invitation...</Text>
      </View>
    )
  }

  if (error || !invitation) {
    return (
      <View style={commonStyles.centerContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={[commonStyles.heading2, { marginTop: 16, color: colors.error }]}>
          Invalid Invitation
        </Text>
        <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
          This invitation link is invalid or has expired
        </Text>
        <GlassButton
          variant="secondary"
          onPress={handleGoBack}
          style={{ marginTop: 24 }}
        >
          Go to App
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
          You need to sign in to respond to this invitation
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

  if (invitation.expired) {
    return (
      <View style={commonStyles.centerContainer}>
        <Ionicons name="time-outline" size={48} color={colors.textMuted} />
        <Text style={[commonStyles.heading2, { marginTop: 16 }]}>
          Invitation Expired
        </Text>
        <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
          This invitation has expired and is no longer valid
        </Text>
        <GlassButton
          variant="secondary"
          onPress={handleGoBack}
          style={{ marginTop: 24 }}
        >
          Go to App
        </GlassButton>
      </View>
    )
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.content}>
        {/* Invitation Info */}
        <GlassCard variant="enhanced" padding="xl" style={styles.invitationCard}>
          <View style={styles.invitationHeader}>
            <Ionicons 
              name={invitation.type === 'event' ? 'calendar' : 'people'} 
              size={48} 
              color={colors.accentPrimary} 
            />
            <Text style={[commonStyles.heading1, styles.invitationTitle]}>
              {invitation.title}
            </Text>
          </View>

          {invitation.description && (
            <Text style={[commonStyles.textSecondary, styles.invitationDescription]}>
              {invitation.description}
            </Text>
          )}

          <View style={styles.inviterInfo}>
            <Text style={commonStyles.textMuted}>
              Invited by {invitation.inviter}
            </Text>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={[commonStyles.heading2, styles.actionTitle]}>
            Respond to Invitation
          </Text>

          <GlassButton
            variant="primary"
            size="lg"
            loading={isProcessing}
            onPress={handleAcceptInvitation}
            style={styles.acceptButton}
          >
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </GlassButton>

          <GlassButton
            variant="outline"
            onPress={handleDeclineInvitation}
            disabled={isProcessing}
            style={styles.declineButton}
          >
            Decline
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
  invitationCard: {
    marginBottom: 32,
  },
  invitationHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  invitationTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  invitationDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  inviterInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionSection: {
    alignItems: 'center',
  },
  actionTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  acceptButton: {
    width: '100%',
    marginBottom: 16,
  },
  declineButton: {
    width: '100%',
  },
})
