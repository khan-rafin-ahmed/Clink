import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useAuth } from '../lib/AuthContext'
import { useAuthDataFetching } from '@shared/hooks/useDataFetching'
import { getUserProfile } from '@shared/lib/userService'
import type { RootStackParamList } from '../navigation/AppNavigator'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { user } = useAuth()

  const {
    data: userProfile,
    isLoading,
    refetch
  } = useAuthDataFetching(
    (user) => getUserProfile(user.id),
    {
      requireAuth: true,
      user,
      isAuthReady: true
    }
  )

  const handleCreateEvent = () => {
    navigation.navigate('CreateEvent')
  }

  return (
    <ScrollView 
      className="flex-1 bg-bg-base"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#00FFA3"
        />
      }
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-text-primary">
          Welcome back{userProfile?.display_name ? `, ${userProfile.display_name}` : ''}!
        </Text>
        <Text className="text-text-secondary mt-1">
          Ready to discover your next adventure?
        </Text>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mb-6">
        <TouchableOpacity
          onPress={handleCreateEvent}
          className="bg-neon-green rounded-xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="add-circle-outline" size={24} color="#000" />
          <Text className="text-black font-semibold text-lg ml-2">
            Create Event
          </Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events Section */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">
          Your Upcoming Events
        </Text>
        
        <View className="bg-bg-glass rounded-xl p-6 border border-border-default">
          <View className="items-center">
            <Ionicons name="calendar-outline" size={48} color="#71717A" />
            <Text className="text-text-secondary text-center mt-3">
              No upcoming events yet
            </Text>
            <Text className="text-text-muted text-center mt-1 text-sm">
              Create your first event or join others in Discover
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">
          Recent Activity
        </Text>
        
        <View className="bg-bg-glass rounded-xl p-6 border border-border-default">
          <View className="items-center">
            <Ionicons name="time-outline" size={48} color="#71717A" />
            <Text className="text-text-secondary text-center mt-3">
              No recent activity
            </Text>
            <Text className="text-text-muted text-center mt-1 text-sm">
              Your event activity will appear here
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View className="h-20" />
    </ScrollView>
  )
}
