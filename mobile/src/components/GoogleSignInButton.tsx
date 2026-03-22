/**
 * Google Sign-In Button component
 *
 * Reusable button that handles the Google SSO flow:
 * 1. Triggers Google OAuth via expo-auth-session
 * 2. Exchanges for Firebase credential
 * 3. Calls the server's /auth/google endpoint via AuthContext
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Theme } from '../constants/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  isLoading = false,
  disabled = false,
  label = 'Sign in with Google',
  style,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {isLoading ? (
        <ActivityIndicator color={Theme.colors.textPrimary} />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: 50,
    ...Theme.shadows.small,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    color: Theme.colors.textPrimary,
  },
});
