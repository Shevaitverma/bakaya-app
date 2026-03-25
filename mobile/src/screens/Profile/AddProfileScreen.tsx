/**
 * Add Profile Screen - Create a new profile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import type { MeStackParamList } from '../../navigation/types';

type AddProfileScreenProps = NativeStackScreenProps<MeStackParamList, 'AddProfile'>;

const RELATIONSHIP_OPTIONS = [
  { label: 'Self', value: 'self' },
  { label: 'Family', value: 'family' },
  { label: 'Partner', value: 'partner' },
  { label: 'Friend', value: 'friend' },
  { label: 'Other', value: 'other' },
];

const PROFILE_COLORS = [
  '#D81B60', // Primary magenta
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

const AddProfileScreen: React.FC<AddProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<string>('');
  const [color, setColor] = useState<string>(PROFILE_COLORS[0] ?? '#D81B60');
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('Profile name is required');
      return false;
    }
    setNameError(undefined);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setSubmitting(true);

      const data: { name: string; relationship?: string; color?: string } = {
        name: name.trim(),
      };
      if (relationship) {
        data.relationship = relationship;
      }
      if (color) {
        data.color = color;
      }

      const response = await profileService.createProfile(data, accessToken);

      if (response.success && response.data) {
        navigation.goBack();
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while creating the profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <FontAwesome6
            name="arrow-left"
            size={20}
            color={Theme.colors.textOnPrimary}
            solid
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Profile</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Preview Avatar */}
          <View style={styles.previewSection}>
            <View style={[styles.previewAvatar, { backgroundColor: color }]}>
              <Text style={styles.previewAvatarText}>
                {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.previewName}>
              {name.trim() || 'New Profile'}
            </Text>
          </View>

          {/* Name Input */}
          <Input
            label="Name"
            placeholder="Enter profile name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={50}
          />

          {/* Relationship Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Relationship</Text>
            <View style={styles.chipsContainer}>
              {RELATIONSHIP_OPTIONS.map((option) => {
                const isSelected = relationship === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() =>
                      setRelationship(isSelected ? '' : option.value)
                    }
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {PROFILE_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircleWrapper,
                      isSelected && styles.colorCircleWrapperSelected,
                      isSelected && { borderColor: c },
                    ]}
                    onPress={() => setColor(c)}
                    activeOpacity={0.7}>
                    <View style={[styles.colorCircle, { backgroundColor: c }]}>
                      {isSelected && (
                        <FontAwesome6
                          name="check"
                          size={14}
                          color={Theme.colors.white}
                          solid
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Create Profile"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!name.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  formContent: {
    padding: Theme.spacing.lg,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  previewAvatarText: {
    fontSize: Theme.typography.fontSize.title,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  previewName: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  sectionContainer: {
    marginBottom: Theme.spacing.md,
  },
  sectionLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  chipSelected: {
    backgroundColor: `${Theme.colors.primary}15`,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  colorCircleWrapper: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  colorCircleWrapperSelected: {
    // borderColor is set dynamically
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitContainer: {
    marginTop: Theme.spacing.lg,
  },
});

export default AddProfileScreen;
