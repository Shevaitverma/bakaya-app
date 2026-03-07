/**
 * Theme constants for the application
 * Modern 2025 design language with glassmorphism and elegant aesthetics
 */

export const Colors = {
  // Primary color - Vibrant magenta with modern gradient support
  primary: '#D81B60',
  primaryDark: '#AD1457',
  primaryLight: '#F48FB1',

  // Gradient colors for modern effects
  gradientStart: '#D81B60',
  gradientEnd: '#E91E63',

  // Splash screen background color
  splashBackground: '#D81B60',

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  grey: '#6B7280',
  lightGrey: '#F3F4F6',
  darkGrey: '#374151',
  stoneGrey: '#E5E5E5', // Silver grey similar to 500 rupee note

  // Semantic colors
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Card and surface colors
  cardBackground: '#FFFFFF',
  cardBackgroundElevated: '#FFFFFF',
  surface: '#FAFAFA',

  // Glassmorphism colors
  glassBackground: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
} as const;

export const Shadows = {
  // Modern elevation shadows
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Glassmorphism shadow
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export const SplashScreen = {
  // Duration in milliseconds
  duration: 2000,

  // Logo text (replaces missing image asset)
  logoText: 'Bakaya',
} as const;

export const Typography = {
  // Modern typography system
  fontFamily: 'System',
  fontFamilyBold: 'System',

  // Font sizes with better hierarchy
  fontSize: {
    xs: 11,
    small: 13,
    medium: 15,
    large: 17,
    xlarge: 20,
    xxlarge: 24,
    title: 28,
    display: 32,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const;

export const Theme = {
  colors: Colors,
  shadows: Shadows,
  splashScreen: SplashScreen,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
} as const;
