import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

export function CreateEventScreen() {
  const navigation = useNavigation()
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)

  const vibes = [
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
    { id: 'party', label: 'Party', icon: 'musical-notes-outline' },
    { id: 'chill', label: 'Chill', icon: 'leaf-outline' },
    { id: 'wild', label: 'Wild', icon: 'flash-outline' },
    { id: 'classy', label: 'Classy', icon: 'wine-outline' },
  ]

  const handleCreateEvent = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title')
      return
    }
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location')
      return
    }

    // TODO: Implement event creation
    Alert.alert('Success', 'Event created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  return (
    <ScrollView className="flex-1 bg-bg-base">
      <View className="px-6 py-6">
        {/* Title Input */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold mb-2">Event Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What's the occasion?"
            placeholderTextColor="#71717A"
            className="bg-bg-glass rounded-xl p-4 text-text-primary border border-border-default"
          />
        </View>

        {/* Location Input */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold mb-2">Location</Text>
          <TouchableOpacity className="bg-bg-glass rounded-xl p-4 flex-row items-center border border-border-default">
            <Ionicons name="location-outline" size={20} color="#71717A" />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Where's it happening?"
              placeholderTextColor="#71717A"
              className="text-text-primary ml-3 flex-1"
            />
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold mb-2">Date & Time</Text>
          <TouchableOpacity className="bg-bg-glass rounded-xl p-4 flex-row items-center border border-border-default">
            <Ionicons name="calendar-outline" size={20} color="#71717A" />
            <Text className="text-text-muted ml-3 flex-1">
              Select date and time
            </Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* Vibe Selection */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold mb-2">Vibe</Text>
          <View className="flex-row flex-wrap gap-3">
            {vibes.map((vibe) => (
              <TouchableOpacity
                key={vibe.id}
                onPress={() => setSelectedVibe(vibe.id)}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  selectedVibe === vibe.id
                    ? 'bg-neon-green border-neon-green'
                    : 'bg-bg-glass border-border-default'
                }`}
              >
                <Ionicons 
                  name={vibe.icon as any} 
                  size={20} 
                  color={selectedVibe === vibe.id ? '#000' : '#71717A'} 
                />
                <Text 
                  className={`ml-2 ${
                    selectedVibe === vibe.id ? 'text-black' : 'text-text-secondary'
                  }`}
                >
                  {vibe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-text-primary font-semibold mb-2">Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special details or instructions?"
            placeholderTextColor="#71717A"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-bg-glass rounded-xl p-4 text-text-primary border border-border-default"
          />
        </View>

        {/* Privacy Settings */}
        <View className="mb-8">
          <Text className="text-text-primary font-semibold mb-2">Privacy</Text>
          <View className="bg-bg-glass rounded-xl border border-border-default overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-border-default">
              <Ionicons name="globe-outline" size={20} color="#71717A" />
              <View className="ml-3 flex-1">
                <Text className="text-text-primary">Public Event</Text>
                <Text className="text-text-muted text-sm">Anyone can find and join</Text>
              </View>
              <Ionicons name="radio-button-on-outline" size={20} color="#00FFA3" />
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center p-4">
              <Ionicons name="lock-closed-outline" size={20} color="#71717A" />
              <View className="ml-3 flex-1">
                <Text className="text-text-primary">Private Event</Text>
                <Text className="text-text-muted text-sm">Invite only</Text>
              </View>
              <Ionicons name="radio-button-off-outline" size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreateEvent}
          className="bg-neon-green rounded-xl p-4 items-center"
        >
          <Text className="text-black font-semibold text-lg">
            Create Event
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
