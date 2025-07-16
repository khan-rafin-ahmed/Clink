import React, { useRef, useEffect } from 'react'
import { 
  View, 
  TouchableOpacity, 
  Animated, 
  StyleSheet, 
  ViewStyle,
  TouchableOpacityProps 
} from 'react-native'
import { useTheme } from '../../hooks/useTheme'

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode
  variant?: 'basic' | 'enhanced' | 'interactive' | 'subtle'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  style?: ViewStyle
  onPress?: () => void
}

const paddingMap = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export function GlassCard({
  children,
  variant = 'basic',
  padding = 'lg',
  animated = true,
  style,
  onPress,
  ...props
}: GlassCardProps) {
  const { glassEffects, spacing } = useTheme()
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(1)).current

  // Get the appropriate glass effect style
  const glassStyle = glassEffects[variant]
  
  // Determine if this should be touchable
  const Component = onPress ? TouchableOpacity : View
  
  // Animation handlers for interactive cards
  const handlePressIn = () => {
    if (animated && onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const handlePressOut = () => {
    if (animated && onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  // Enhanced glass effect for interactive variant
  const enhancedStyle = variant === 'interactive' ? {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  } : {}

  const containerStyle = [
    glassStyle,
    enhancedStyle,
    {
      padding: paddingMap[padding],
      transform: animated ? [{ scale: scaleAnim }] : undefined,
      opacity: animated ? opacityAnim : 1,
    },
    style,
  ]

  if (onPress) {
    return (
      <Animated.View style={containerStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={styles.touchableContent}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={containerStyle}>
      {children}
    </Animated.View>
  )
}

// Enhanced Glass Card with shimmer effect
export function GlassCardShimmer({
  children,
  variant = 'enhanced',
  ...props
}: GlassCardProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    )
    
    shimmerAnimation.start()
    
    return () => shimmerAnimation.stop()
  }, [shimmerAnim])

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  })

  return (
    <GlassCard variant={variant} {...props}>
      <View style={styles.shimmerContainer}>
        <Animated.View 
          style={[
            styles.shimmerOverlay,
            { opacity: shimmerOpacity }
          ]} 
        />
        {children}
      </View>
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  touchableContent: {
    flex: 1,
  },
  shimmerContainer: {
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    pointerEvents: 'none',
  },
})
