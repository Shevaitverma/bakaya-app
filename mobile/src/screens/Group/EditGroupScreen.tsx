/**
 * Edit Group Screen - Edit an existing group's name and description
 */

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import type { HomeStackParamList } from '../../navigation/types';

type EditGroupScreenProps = NativeStackScreenProps<HomeStackParamList, 'EditGroup'>;

const EditGroupScreen: React.FC<EditGroupScreenProps> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!accessToken) return;

      try {
        const response = await groupService.getGroup(groupId, accessToken);
        if (response.success && response.data) {
          setName(response.data.name);
          setDescription(response.data.description || '');
        } else {
          throw new Error('Failed to load group');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load group details';
        Alert.alert('Error', errorMessage, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [accessToken, groupId, navigation]);

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('Group name is required');
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

      const data: { name?: string; description?: string } = {
        name: name.trim(),
      };
      if (description.trim()) {
        data.description = description.trim();
      }

      const response = await groupService.updateGroup(groupId, data, accessToken);

      if (response.success && response.data) {
        navigation.goBack();
      } else {
        throw new Error('Failed to update group');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while updating the group';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
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
          <Text style={styles.headerTitle}>Edit Group</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Edit Group</Text>
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

          {/* Preview Icon */}
          <View style={styles.previewSection}>
            <View style={styles.previewAvatar}>
              <FontAwesome6
                name="users"
                size={28}
                color={Theme.colors.textOnPrimary}
                solid
              />
            </View>
            <Text style={styles.previewName}>
              {name.trim() || 'Group Name'}
            </Text>
          </View>

          {/* Name Input */}
          <Input
            label="Group Name"
            placeholder="Enter group name"
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

          {/* Description Input */}
          <Input
            label="Description (optional)"
            placeholder="What is this group for?"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            autoCorrect
            maxLength={200}
            multiline
            numberOfLines={3}
            style={styles.descriptionInput}
          />

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Save Changes"
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
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
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  previewName: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitContainer: {
    marginTop: Theme.spacing.lg,
  },
});

export default EditGroupScreen;
