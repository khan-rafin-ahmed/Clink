import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'

import { useTheme } from '../hooks/useTheme'
import { useDataFetching } from '@shared/hooks/useDataFetching'
import { getCrewById, getCrewMembers } from '@shared/lib/crewService'
import { UserAvatar } from '../components/UserAvatar'
import type { RootStackParamList } from '../navigation/AppNavigator'

type CrewDetailRouteProp = RouteProp<RootStackParamList, 'CrewDetail'>

export function CrewDetailScreen() {
  const route = useRoute<CrewDetailRouteProp>()
  const { crewId } = route.params
  const { colors, commonStyles } = useTheme()

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
                {crew.is_public ? 'Public' : 'Private'}
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
        <Text style={[commonStyles.heading2, styles.sectionTitle]}>
          Members ({members?.length || 0})
        </Text>
        
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
  sectionTitle: {
    marginBottom: 12,
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
})
