import React, { useRef } from 'react'
import { 
  TouchableOpacity, 
  Text, 
  Animated, 
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps 
} from 'react-native'
import { useTheme } from '../../hooks/useTheme'

interface GlassButtonProps extends TouchableOpacityProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'glass' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  onPress?: () => void
}

const sizeMap = {
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    borderRadius: 12,
  },
  md: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 16,
  },
  lg: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    fontSize: 18,
    borderRadius: 20,
  },
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...props
}: GlassButtonProps) {
  const { colors, glassEffects, fontWeight } = useTheme()
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(1)).current

  const sizeStyle = sizeMap[size]
  const isDisabled = disabled || loading

  // Get variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.btnPrimaryBg,
          borderWidth: 0,
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }
      case 'secondary':
        return {
          backgroundColor: colors.btnSecondaryBg,
          borderWidth: 1,
          borderColor: colors.borderDefault,
        }
      case 'glass':
        return {
          ...glassEffects.enhanced,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.accentPrimary,
        }
      default:
        return {}
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.btnPrimaryText
      case 'secondary':
      case 'glass':
        return colors.btnSecondaryText
      case 'outline':
        return colors.accentPrimary
      default:
        return colors.textPrimary
    }
  }

  const handlePressIn = () => {
    if (!isDisabled) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.96,
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
    if (!isDisabled) {
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

  const buttonStyle = [
    styles.button,
    getVariantStyle(),
    {
      paddingHorizontal: sizeStyle.paddingHorizontal,
      paddingVertical: sizeStyle.paddingVertical,
      borderRadius: sizeStyle.borderRadius,
      opacity: isDisabled ? 0.5 : 1,
      transform: [{ scale: scaleAnim }],
    },
    style,
  ]

  const textColor = getTextColor()
  const finalTextStyle = [
    styles.text,
    {
      fontSize: sizeStyle.fontSize,
      fontWeight: fontWeight.semibold,
      color: textColor,
    },
    textStyle,
  ]

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        {...props}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={textColor}
            style={styles.loader}
          />
        ) : (
          typeof children === 'string' ? (
            <Text style={finalTextStyle}>{children}</Text>
          ) : (
            children
          )
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// Specialized glass button variants
export function PrimaryGlassButton(props: Omit<GlassButtonProps, 'variant'>) {
  return <GlassButton variant="glass" {...props} />
}

export function OutlineGlassButton(props: Omit<GlassButtonProps, 'variant'>) {
  return <GlassButton variant="outline" {...props} />
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
  loader: {
    marginHorizontal: 8,
  },
})
