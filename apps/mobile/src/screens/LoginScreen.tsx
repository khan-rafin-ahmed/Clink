import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { signInWithGoogle } from '../lib/authService'
import { useTheme } from '../hooks/useTheme'

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const { colors, spacing, borderRadius, fontSize, fontWeight, commonStyles } = useTheme()

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
    <View style={commonStyles.centerContainer}>
      {/* Logo/Brand */}
      <View style={styles.brandContainer}>
        <Text style={[commonStyles.heading1, styles.brandTitle]}>
          Thirstee
        </Text>
        <Text style={[commonStyles.accentText, styles.tagline]}>
          Tap. Drink. Repeat.
        </Text>
        <Text style={[commonStyles.textSecondary, styles.description]}>
          Connect with friends and discover amazing drinking events near you
        </Text>
      </View>

      {/* Sign In Button - Using PRIMARY button style (WHITE) */}
      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={isLoading}
        style={[commonStyles.primaryButton, styles.googleButton, { opacity: isLoading ? 0.7 : 1 }]}
      >
        <Ionicons name="logo-google" size={24} color="#4285F4" />
        <Text style={[commonStyles.primaryButtonText, styles.buttonText]}>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={[commonStyles.textMuted, styles.termsText]}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  brandContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandTitle: {
    marginBottom: 8,
  },
  tagline: {
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButton: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
  },
  buttonText: {
    marginLeft: 12,
  },
  termsText: {
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
})
