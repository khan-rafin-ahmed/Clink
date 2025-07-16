import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useTheme } from '../hooks/useTheme'

interface UserAvatarProps {
  userId?: string
  displayName?: string | null
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showFallback?: boolean
  style?: any
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64
}

const textSizeMap = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20
}

export function UserAvatar({
  userId,
  displayName,
  avatarUrl,
  size = 'md',
  showFallback = true,
  style
}: UserAvatarProps) {
  const { colors } = useTheme()
  
  const avatarSize = sizeMap[size]
  const textSize = textSizeMap[size]
  
  const getFallbackText = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (userId) {
      return userId.charAt(0).toUpperCase()
    }
    return '?'
  }

  const avatarStyle = [
    styles.avatar,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    style
  ]

  // If we have an avatar URL, try to display the image
  if (avatarUrl) {
    return (
      <View style={avatarStyle}>
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatarImage,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }
          ]}
          onError={() => {
            // If image fails to load, fall back to text
            console.warn('Failed to load avatar image:', avatarUrl)
          }}
        />
        {/* Fallback text overlay in case image fails */}
        <View style={[styles.fallbackOverlay, { opacity: 0 }]}>
          <Text style={[styles.fallbackText, { fontSize: textSize, color: '#FFFFFF' }]}>
            {getFallbackText()}
          </Text>
        </View>
      </View>
    )
  }

  // Fallback to text avatar
  if (showFallback) {
    return (
      <View style={avatarStyle}>
        <Text style={[styles.fallbackText, { fontSize: textSize, color: '#FFFFFF' }]}>
          {getFallbackText()}
        </Text>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },
  fallbackText: {
    fontWeight: '600',
    textAlign: 'center',
  },
})
