import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '../navigation/AppNavigator'

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>

export function EventDetailScreen() {
  const route = useRoute<EventDetailRouteProp>()
  const { eventId } = route.params

  // TODO: Fetch event data using eventId
  console.log('Event ID:', eventId)

  return (
    <ScrollView className="flex-1 bg-bg-base">
      {/* Event Header */}
      <View className="px-6 py-6">
        <Text className="text-2xl font-bold text-text-primary mb-2">
          Sample Event Title
        </Text>
        
        <View className="flex-row items-center mb-4">
          <Ionicons name="location-outline" size={16} color="#71717A" />
          <Text className="text-text-secondary ml-2">
            Sample Location
          </Text>
        </View>
        
        <View className="flex-row items-center mb-4">
          <Ionicons name="calendar-outline" size={16} color="#71717A" />
          <Text className="text-text-secondary ml-2">
            Today at 8:00 PM
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="bg-neon-green rounded-full px-3 py-1">
            <Text className="text-black text-sm font-semibold">Casual</Text>
          </View>
        </View>
      </View>

      {/* Event Details */}
      <View className="px-6 mb-6">
        <Text className="text-lg font-semibold text-text-primary mb-3">
          About This Event
        </Text>
        <View className="bg-bg-glass rounded-xl p-4 border border-border-default">
          <Text className="text-text-secondary">
            This is a sample event description. The actual event details would be loaded from the database using the eventId.
          </Text>
        </View>
      </View>

      {/* Attendees */}
      <View className="px-6 mb-6">
        <Text className="text-lg font-semibold text-text-primary mb-3">
          Attendees (0)
        </Text>
        <View className="bg-bg-glass rounded-xl p-6 border border-border-default">
          <View className="items-center">
            <Ionicons name="people-outline" size={48} color="#71717A" />
            <Text className="text-text-secondary text-center mt-3">
              No attendees yet
            </Text>
            <Text className="text-text-muted text-center mt-1 text-sm">
              Be the first to join this event!
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-6 mb-8">
        <TouchableOpacity className="bg-neon-green rounded-xl p-4 items-center mb-3">
          <Text className="text-black font-semibold text-lg">
            Join Event
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-bg-glass rounded-xl p-4 items-center border border-border-default">
          <Text className="text-text-primary font-semibold">
            Share Event
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View className="h-20" />
    </ScrollView>
  )
}
