import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { signInWithGoogle } from '@shared/lib/authService'

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signInWithGoogle()
      
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Please try again')
      }
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-bg-base justify-center items-center px-6">
      {/* Logo/Brand */}
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-text-primary mb-2">
          Thirstee
        </Text>
        <Text className="text-lg text-neon-green font-semibold">
          Tap. Drink. Repeat.
        </Text>
        <Text className="text-text-secondary text-center mt-4 text-base">
          Connect with friends and discover amazing drinking events near you
        </Text>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        className="bg-white rounded-xl px-6 py-4 flex-row items-center justify-center w-full max-w-sm"
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        <Ionicons name="logo-google" size={24} color="#4285F4" />
        <Text className="text-gray-800 font-semibold text-lg ml-3">
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text className="text-text-muted text-sm text-center mt-8 px-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  )
}
