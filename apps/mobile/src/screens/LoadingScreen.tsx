import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useTheme } from '../hooks/useTheme'

export function LoadingScreen() {
  const { colors, commonStyles } = useTheme()

  return (
    <View style={commonStyles.centerContainer}>
      <ActivityIndicator size="large" color={colors.accentPrimary} />
      <Text style={[commonStyles.heading2, { marginTop: 16 }]}>
        Thirstee
      </Text>
      <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
        Loading your experience...
      </Text>
    </View>
  )
}
