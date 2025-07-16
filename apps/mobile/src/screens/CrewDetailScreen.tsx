import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'

import { useTheme } from '../hooks/useTheme'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getCrewById, getCrewMembers, inviteUserToCrew } from '@shared/lib/crewService'
import { UserAvatar } from '../components/UserAvatar'
import { GlassCard, GlassButton } from '../components/ui'
import type { RootStackParamList } from '../navigation/AppNavigator'

type CrewDetailRouteProp = RouteProp<RootStackParamList, 'CrewDetail'>

export function CrewDetailScreen() {
  const route = useRoute<CrewDetailRouteProp>()
  const { crewId } = route.params
  const { colors, commonStyles } = useTheme()

  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      Alert.alert('Error', 'Please enter a username')
      return
    }

    setIsInviting(true)
    try {
      const result = await inviteUserToCrew(crewId, inviteUsername.trim())

      if (result.success) {
        Alert.alert('Success!', 'Invitation sent successfully')
        setInviteUsername('')
        setShowInviteModal(false)
        // Refresh crew data to show updated member count
        membersRefetch && membersRefetch()
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const {
    data: crew,
    isLoading: crewLoading
  } = useDataFetching(
    () => getCrewById(crewId),
    {
      onError: (error) => {
        console.error('Failed to load crew:', error)
      }
    }
  )

  const {
    data: members,
    isLoading: membersLoading
  } = useDataFetching(
    () => getCrewMembers(crewId),
    {
      onError: (error) => {
        console.error('Failed to load crew members:', error)
      }
    }
  )

  if (crewLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Loading crew...</Text>
      </View>
    )
  }

  if (!crew) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.textSecondary}>Crew not found</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={commonStyles.container}>
        {/* Crew Header */}
        <View style={styles.header}>
          <Text style={[commonStyles.heading1, styles.crewName]}>
            {crew.name}
          </Text>
          {crew.description && (
            <Text style={[commonStyles.textSecondary, styles.description]}>
              {crew.description}
            </Text>
          )}
        </View>

      {/* Crew Stats */}
      <View style={styles.section}>
        <View style={[commonStyles.glassCard, styles.statsCard]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[commonStyles.heading2, styles.statNumber]}>
                {crew.member_count || 0}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.statLabel]}>
                Member{(crew.member_count || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[commonStyles.heading2, styles.statNumber]}>
                {crew.visibility === 'public' ? 'Public' : 'Private'}
              </Text>
              <Text style={[commonStyles.textSecondary, styles.statLabel]}>
                Visibility
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[commonStyles.heading2, styles.sectionTitle]}>
            Members ({members?.length || 0})
          </Text>
          <TouchableOpacity
            onPress={() => setShowInviteModal(true)}
            style={styles.inviteButton}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.accentPrimary} />
            <Text style={[commonStyles.textPrimary, styles.inviteButtonText]}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>
        
        {membersLoading ? (
          <View style={[commonStyles.glassCard, styles.loadingCard]}>
            <Text style={commonStyles.textSecondary}>Loading members...</Text>
          </View>
        ) : members && members.length > 0 ? (
          <View style={[commonStyles.glassCard, styles.membersCard]}>
            {members.map((member: any, index: number) => (
              <View 
                key={member.id} 
                style={[
                  styles.memberItem, 
                  index < members.length - 1 && styles.memberItemBorder
                ]}
              >
                <UserAvatar
                  userId={member.user_id}
                  displayName={member.user_profiles?.display_name}
                  avatarUrl={member.user_profiles?.avatar_url}
                  size="md"
                />
                <View style={styles.memberInfo}>
                  <Text style={[commonStyles.textPrimary, styles.memberName]}>
                    {member.user_profiles?.display_name || 'Unknown User'}
                    {member.user_profiles?.nickname && (
                      <Text style={[commonStyles.textMuted, styles.memberNickname]}>
                        {' '}({member.user_profiles.nickname})
                      </Text>
                    )}
                  </Text>
                  <Text style={[commonStyles.textSecondary, styles.memberRole]}>
                    {member.is_creator ? '👑 Host' :
                     member.role === 'co_host' ? '⭐ Co-Host' :
                     'Member'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyCard]}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[commonStyles.textSecondary, styles.emptyText]}>
              No members found
            </Text>
          </View>
        )}
      </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Invite Modal */}
    <Modal
      visible={showInviteModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <GlassCard variant="enhanced" padding="lg">
            <View style={styles.modalHeader}>
              <Text style={[commonStyles.heading2, styles.modalTitle]}>
                Invite Member
              </Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[commonStyles.textSecondary, styles.modalDescription]}>
                Enter the username of the person you'd like to invite to this crew.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[commonStyles.textPrimary, styles.inputLabel]}>
                  Username
                </Text>
                <GlassCard variant="subtle" padding="none">
                  <TextInput
                    value={inviteUsername}
                    onChangeText={setInviteUsername}
                    placeholder="Enter username..."
                    placeholderTextColor={colors.textMuted}
                    style={[commonStyles.textPrimary, styles.textInput]}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </GlassCard>
              </View>

              <View style={styles.modalActions}>
                <GlassButton
                  variant="secondary"
                  size="md"
                  onPress={() => setShowInviteModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="md"
                  loading={isInviting}
                  onPress={handleInviteUser}
                  style={styles.inviteActionButton}
                >
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </GlassButton>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  crewName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    flex: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inviteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
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
  loadingCard: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  membersCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
  },
  memberNickname: {
    fontStyle: 'italic',
    color: '#FFD700',
  },
  emptyCard: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    gap: 20,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  inviteActionButton: {
    flex: 1,
  },
})
