import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function DiscoverScreen() {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // TODO: Implement refresh logic
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <ScrollView 
      className="flex-1 bg-bg-base"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#00FFA3"
        />
      }
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-text-primary">
          Discover Events
        </Text>
        <Text className="text-text-secondary mt-1">
          Find amazing events happening around you
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-6">
        <TouchableOpacity className="bg-bg-glass rounded-xl p-4 flex-row items-center border border-border-default">
          <Ionicons name="search-outline" size={20} color="#71717A" />
          <Text className="text-text-muted ml-3 flex-1">
            Search events, locations, or vibes...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {['All', 'Tonight', 'This Weekend', 'Casual', 'Party', 'Chill'].map((filter) => (
              <TouchableOpacity
                key={filter}
                className="bg-bg-glass rounded-full px-4 py-2 border border-border-default"
              >
                <Text className="text-text-secondary text-sm">
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Events List */}
      <View className="px-6 mb-6">
        <Text className="text-lg font-semibold text-text-primary mb-4">
          Events Near You
        </Text>
        
        <View className="bg-bg-glass rounded-xl p-6 border border-border-default">
          <View className="items-center">
            <Ionicons name="location-outline" size={48} color="#71717A" />
            <Text className="text-text-secondary text-center mt-3">
              No events found
            </Text>
            <Text className="text-text-muted text-center mt-1 text-sm">
              Be the first to create an event in your area!
            </Text>
          </View>
        </View>
      </View>

      {/* Popular Events */}
      <View className="px-6 mb-6">
        <Text className="text-lg font-semibold text-text-primary mb-4">
          Popular This Week
        </Text>
        
        <View className="bg-bg-glass rounded-xl p-6 border border-border-default">
          <View className="items-center">
            <Ionicons name="trending-up-outline" size={48} color="#71717A" />
            <Text className="text-text-secondary text-center mt-3">
              No popular events yet
            </Text>
            <Text className="text-text-muted text-center mt-1 text-sm">
              Popular events will appear here
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View className="h-20" />
    </ScrollView>
  )
}
