import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../hooks/useTheme'

export function NotificationsScreen() {
  const { colors, commonStyles } = useTheme()

  return (
    <ScrollView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[commonStyles.heading1, styles.title]}>Notifications</Text>
      </View>

      {/* Empty State */}
      <View style={[commonStyles.centerContainer, styles.emptyState]}>
        <View style={[commonStyles.glassCard, styles.emptyCard]}>
          <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
          <Text style={[commonStyles.heading2, styles.emptyTitle]}>
            No Notifications
          </Text>
          <Text style={[commonStyles.textSecondary, styles.emptyDescription]}>
            You're all caught up! Notifications for events, crews, and invites will appear here.
          </Text>
        </View>
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
  title: {
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
})
