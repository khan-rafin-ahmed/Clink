import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../lib/AuthContext'
import { useAuthDataFetching } from '@shared/hooks/useDataFetching'
import { getUserProfile } from '@shared/lib/userService'
import { signOut } from '@shared/lib/authService'

export function ProfileScreen() {
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base justify-center items-center">
        <Text className="text-text-secondary">Loading profile...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-bg-base">
      {/* Profile Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="items-center">
          {/* Avatar Placeholder */}
          <View className="w-24 h-24 bg-bg-glass rounded-full items-center justify-center border border-border-default mb-4">
            <Ionicons name="person-outline" size={40} color="#71717A" />
          </View>
          
          <Text className="text-2xl font-bold text-text-primary">
            {userProfile?.display_name || 'User'}
          </Text>
          
          {userProfile?.nickname && (
            <Text className="text-neon-green italic text-lg mt-1">
              "{userProfile.nickname}"
            </Text>
          )}
          
          <Text className="text-text-secondary mt-2">
            @{userProfile?.username || 'username'}
          </Text>
          
          {userProfile?.bio && (
            <Text className="text-text-secondary text-center mt-3 px-4">
              {userProfile.bio}
            </Text>
          )}
        </View>
      </View>

      {/* Stats */}
      <View className="px-6 mb-6">
        <View className="bg-bg-glass rounded-xl p-4 border border-border-default">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">0</Text>
              <Text className="text-text-secondary text-sm">Events</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">0</Text>
              <Text className="text-text-secondary text-sm">Crews</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-text-primary">0</Text>
              <Text className="text-text-secondary text-sm">RSVPs</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-6 mb-6">
        <View className="bg-bg-glass rounded-xl border border-border-default overflow-hidden">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border-default">
            <Ionicons name="person-outline" size={24} color="#71717A" />
            <Text className="text-text-primary ml-3 flex-1">Edit Profile</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#71717A" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border-default">
            <Ionicons name="notifications-outline" size={24} color="#71717A" />
            <Text className="text-text-primary ml-3 flex-1">Notifications</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#71717A" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border-default">
            <Ionicons name="settings-outline" size={24} color="#71717A" />
            <Text className="text-text-primary ml-3 flex-1">Settings</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#71717A" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border-default">
            <Ionicons name="help-circle-outline" size={24} color="#71717A" />
            <Text className="text-text-primary ml-3 flex-1">Help & Support</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#71717A" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSignOut}
            className="flex-row items-center p-4"
          >
            <Ionicons name="log-out-outline" size={24} color="#FF5F2E" />
            <Text className="text-red-400 ml-3 flex-1">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View className="h-20" />
    </ScrollView>
  )
}
