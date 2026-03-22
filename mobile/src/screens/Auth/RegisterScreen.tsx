/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '../../context/AuthContext';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { Theme } from '../../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { register, googleLogin, isLoading, error } = useAuth();
  const { signIn: googleSignIn, isLoading: isGoogleLoading } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (/\s/.test(username)) {
      newErrors.username = 'Username cannot contain spaces';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      // Check password requirements
      const passwordErrors: string[] = [];

      if (password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }

      if (!/[a-z]/.test(password)) {
        passwordErrors.push('one lowercase letter');
      }

      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('one uppercase letter');
      }

      if (!/[0-9]/.test(password)) {
        passwordErrors.push('one number');
      }

      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('[REGISTER SCREEN] Calling register with:', {
        email: email.trim(),
        username: username.trim(),
        hasPassword: !!password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await register(
        email.trim(),
        username.trim(),
        password,
        firstName.trim(),
        lastName.trim()
      );

      console.log('[REGISTER SCREEN] Registration successful');

      // Clear form fields on success
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setErrors({});

      // Only navigate on successful registration
      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please login to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (err) {
      // Do not navigate on error - stay on registration screen
      console.error('[REGISTER SCREEN] Registration error caught:', err);
      console.error('[REGISTER SCREEN] Error type:', typeof err);
      console.error('[REGISTER SCREEN] Error constructor:', err?.constructor?.name);
      console.error('[REGISTER SCREEN] Error from context:', error);
      console.error('[REGISTER SCREEN] Full error:', JSON.stringify(err, null, 2));

      // Extract error message with proper fallbacks
      let errorMessage = 'An error occurred. Please try again.';

      if (err instanceof Error && err.message) {
        errorMessage = err.message;
        console.log('[REGISTER SCREEN] Using Error.message:', errorMessage);
      } else if (error) {
        errorMessage = error;
        console.log('[REGISTER SCREEN] Using context error:', errorMessage);
      } else if (typeof err === 'string') {
        errorMessage = err;
        console.log('[REGISTER SCREEN] Using string error:', errorMessage);
      } else if (err && typeof err === 'object') {
        // Try to extract message from error object
        const errObj = err as any;
        errorMessage = errObj?.message || errObj?.error || JSON.stringify(err);
        console.log('[REGISTER SCREEN] Extracted from error object:', errorMessage);
      }

      console.log('[REGISTER SCREEN] Final error message to display:', errorMessage);

      Alert.alert(
        'Registration Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;

    try {
      const firebaseIdToken = await googleSignIn();
      if (!firebaseIdToken) {
        // User cancelled the sign-in flow
        return;
      }
      await googleLogin(firebaseIdToken);
      // Navigation will be handled by the navigation logic based on auth state
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      Alert.alert('Google Sign-In Failed', message, [{ text: 'OK' }]);
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Theme.spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to get started with Bakaya
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Input
                  label="First Name"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.nameInput}>
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password Input with Visibility Toggle */}
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.password && styles.passwordInputError,
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}>
                  <FontAwesome6
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color={Theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.passwordErrorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input with Visibility Toggle */}
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Confirm Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.confirmPassword && styles.passwordInputError,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}>
                  <FontAwesome6
                    name={showConfirmPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color={Theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.passwordErrorText}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              label="Sign up with Google"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.footerLink} onPress={handleNavigateToLogin}>
              Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.stoneGrey,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: Theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
  },
  form: {
    marginBottom: Theme.spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  nameInput: {
    flex: 1,
  },
  registerButton: {
    marginTop: Theme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D0D0D0',
  },
  dividerText: {
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  footerText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },
  footerLink: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  passwordContainer: {
    marginBottom: Theme.spacing.md,
  },
  passwordLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  passwordInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingRight: Theme.spacing.xl + 20,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    shadowOpacity: 0.02,
    elevation: 1,
  },
  passwordInputError: {
    borderColor: Theme.colors.error,
  },
  eyeIcon: {
    position: 'absolute',
    right: Theme.spacing.md,
    padding: Theme.spacing.xs,
  },
  passwordErrorText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.xs,
  },
});
