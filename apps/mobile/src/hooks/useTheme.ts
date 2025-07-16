import { StyleSheet } from 'react-native'

// Thirstee Design System for React Native - Updated to match web
export const colors = {
  // Background colors
  bgBase: '#08090A',
  bgGlass: 'rgba(255, 255, 255, 0.05)',
  bgSidebarSolid: '#0E0E10',
  headerBg: 'rgba(8, 9, 10, 0.95)',
  avatarCardBg: 'rgba(255, 255, 255, 0.05)',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#888888',

  // Button colors (Updated to match web design system)
  btnPrimaryBg: '#FFFFFF',      // WHITE primary button background
  btnPrimaryText: '#08090A',    // Dark text on white button
  btnSecondaryBg: '#07080A',    // Dark secondary button background
  btnSecondaryText: '#FFFFFF',  // White text on dark button

  // Accent colors (Updated)
  accentPrimary: '#FFFFFF',     // WHITE as primary accent
  accentSecondary: '#888888',   // Gray as secondary accent

  // Border colors
  borderDefault: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  menuBorder: 'rgba(255, 255, 255, 0.08)',

  // Interactive states
  menuItemHover: 'rgba(255, 255, 255, 0.10)',
  menuActiveItem: '#FFFFFF',

  // Status colors
  error: '#FF4D4F',
  notificationCounterBg: '#FF4D4F',
  notificationCounterFg: '#FFFFFF',

  // Legacy neon colors (for specific use cases only)
  neonGreen: '#00FFA3',
  neonOrange: '#FF5F2E',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
}

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}

// Enhanced glass effect variants
export const glassEffects = {
  // Basic glass card
  basic: {
    backgroundColor: colors.bgGlass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  // Enhanced glass with stronger effect
  enhanced: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Interactive glass with hover-like effects
  interactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  // Subtle glass for backgrounds
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  }
}

// Common style combinations
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  glassCard: {
    ...glassEffects.basic,
    padding: spacing.lg,
  },
  glassCardEnhanced: {
    ...glassEffects.enhanced,
    padding: spacing.lg,
  },
  glassCardInteractive: {
    ...glassEffects.interactive,
    padding: spacing.lg,
  },
  glassCardSubtle: {
    ...glassEffects.subtle,
    padding: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.btnPrimaryBg,  // WHITE background
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonGlass: {
    ...glassEffects.enhanced,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButton: {
    backgroundColor: colors.btnSecondaryBg,  // Dark background
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonGlass: {
    ...glassEffects.interactive,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPrimary: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  textMuted: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  heading1: {
    color: colors.textPrimary,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  heading2: {
    color: colors.textPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
  },
  accentText: {
    color: colors.accentPrimary,  // WHITE accent text
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  primaryButtonText: {
    color: colors.btnPrimaryText,  // Dark text for white button
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  secondaryButtonText: {
    color: colors.btnSecondaryText,  // White text for dark button
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
})

export function useTheme() {
  return {
    colors,
    spacing,
    borderRadius,
    fontSize,
    fontWeight,
    commonStyles,
    glassEffects,
  }
}
