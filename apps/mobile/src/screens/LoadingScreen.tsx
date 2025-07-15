import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'

export function LoadingScreen() {
  return (
    <View className="flex-1 bg-bg-base justify-center items-center">
      <ActivityIndicator size="large" color="#00FFA3" />
      <Text className="text-text-primary text-lg mt-4 font-semibold">
        Thirstee
      </Text>
      <Text className="text-text-secondary text-sm mt-2">
        Loading your experience...
      </Text>
    </View>
  )
}
