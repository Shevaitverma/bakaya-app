/**
 * Profiles Screen - Manage user profiles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { Profile } from '../../types/profile';
import type { MeStackParamList } from '../../navigation/types';

type ProfilesScreenProps = NativeStackScreenProps<MeStackParamList, 'Profiles'>;

const ProfilesScreen: React.FC<ProfilesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfiles();
    }, [accessToken])
  );

  const fetchProfiles = async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getProfiles(accessToken);

      if (response.success && response.data) {
        setProfiles(response.data.profiles);
      } else {
        throw new Error('Failed to fetch profiles');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching profiles';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const profile = profiles.find((p) => p._id === profileId);
    if (!profile) return;

    if (profile.isDefault) {
      Alert.alert('Cannot Delete', 'The default profile cannot be deleted.');
      return;
    }

    const profileName = profile.name || 'this profile';
    setProfileToDelete({ id: profileId, name: profileName });
    setDeleteDialogVisible(true);
    setDeleteLoading(true);

    setTimeout(() => {
      setDeleteLoading(false);
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !profileToDelete) {
      return;
    }

    setDeleteLoading(true);

    // Optimistically update UI
    const deletedProfile = profiles.find((p) => p._id === profileToDelete.id);
    if (deletedProfile) {
      setProfiles((prev) => prev.filter((p) => p._id !== profileToDelete.id));
    }

    // Close dialog immediately
    setDeleteDialogVisible(false);
    setProfileToDelete(null);

    try {
      await profileService.deleteProfile(profileToDelete.id, accessToken);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete profile';
      fetchProfiles();
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (!deleteLoading) {
      setDeleteDialogVisible(false);
      setProfileToDelete(null);
      setDeleteLoading(false);
    }
  };

  const formatRelationship = (relationship?: string): string => {
    if (!relationship) return '';
    return relationship.charAt(0).toUpperCase() + relationship.slice(1);
  };

  const handleProfilePress = (profile: Profile) => {
    navigation.navigate('ProfileExpenses', {
      profileId: profile._id,
      profileName: profile.name,
      profileColor: profile.color,
    });
  };

  const handleEditProfile = (profile: Profile) => {
    navigation.navigate('EditProfile', {
      profileId: profile._id,
      profileName: profile.name,
      profileColor: profile.color,
    });
  };

  const renderProfileItem = ({ item, index }: { item: Profile; index: number }) => {
    const avatarColor = item.color || Theme.colors.primary;
    const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : '?';
    const isLastItem = index === profiles.length - 1;

    return (
      <TouchableOpacity
        style={[styles.profileCard, !isLastItem && styles.profileCardBorder]}
        onPress={() => handleProfilePress(item)}
        activeOpacity={0.7}>
        <View style={styles.profileCardContent}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>

          {/* Profile info */}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            {item.relationship ? (
              <Text style={styles.profileRelationship} numberOfLines={1}>
                {formatRelationship(item.relationship)}
              </Text>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {/* Edit button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditProfile(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome6
                name="pen-to-square"
                size={16}
                color={Theme.colors.primary}
                solid
              />
            </TouchableOpacity>

            {/* Delete button (not for default profiles) */}
            {!item.isDefault && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteProfile(item._id)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome6
                  name="trash-can"
                  size={16}
                  color={Theme.colors.error}
                  solid
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  if (error && profiles.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <FontAwesome6
          name="triangle-exclamation"
          size={48}
          color={Theme.colors.error}
          solid
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfiles}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profiles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProfile')}
            activeOpacity={0.8}>
            <FontAwesome6
              name="plus"
              size={18}
              color={Theme.colors.primary}
              solid
            />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={profiles}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6
                name="users"
                size={48}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyText}>No profiles yet</Text>
              <Text style={styles.emptySubtext}>
                Create profiles for yourself, family, and friends
              </Text>
            </View>
          }
        />
      </View>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Profile"
        message={
          profileToDelete
            ? `Are you sure you want to delete "${profileToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
        variant="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.medium,
    gap: Theme.spacing.xs,
  },
  addButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: Theme.spacing.md + 4,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  profileCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.small,
  },
  profileCardBorder: {
    // no extra border needed, cards have margin
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  profileName: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    flexShrink: 1,
  },
  defaultBadge: {
    backgroundColor: `${Theme.colors.primary}15`,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  profileRelationship: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xxxl,
    gap: Theme.spacing.md,
  },
  emptyText: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.md,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
  },
  retryButton: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.md,
  },
  retryButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default ProfilesScreen;
