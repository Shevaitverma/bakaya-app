/**
 * Profiles Screen - Manage user profiles
 */

import React, { useState, useCallback, useRef } from 'react';
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
import { expenseService } from '../../services/expenseService';
import { invitationService } from '../../services/invitationService';
import { formatCurrency } from '../../utils/currency';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { Profile } from '../../types/profile';
import type { MeStackParamList } from '../../navigation/types';

type ProfilesScreenProps = NativeStackScreenProps<MeStackParamList, 'Profiles'>;

const ProfilesScreen: React.FC<ProfilesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileTotals, setProfileTotals] = useState<Record<string, { totalSpent: number; balance: number }>>({});
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState<number>(0);
  const lastFetchTime = useRef<number>(0);

  const fetchPendingInvitationCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await invitationService.listMyInvitations(accessToken, 'pending');
      if (response.success && response.data) {
        setPendingInvitationCount(response.data.invitations?.length ?? 0);
      }
    } catch (err) {
      // Silently fail — don't disrupt the Profiles screen
      console.warn('[ProfilesScreen] Failed to fetch invitation count', err);
    }
  }, [accessToken]);

  const fetchProfileTotals = useCallback(async (profilesList: Profile[]) => {
    if (!accessToken || profilesList.length === 0) return;

    setTotalsLoading(true);
    const totals: Record<string, { totalSpent: number; balance: number }> = {};

    // Fetch sequentially to avoid rate limits
    for (const profile of profilesList) {
      try {
        const response = await expenseService.getPersonalExpenses(1, 1, accessToken, {
          profileId: profile._id,
        });
        if (response.success && response.data) {
          totals[profile._id] = {
            totalSpent: response.data.totalExpenseAmount ?? 0,
            balance: response.data.balance ?? 0,
          };
        }
      } catch (err) {
        // Silently skip — leave this profile without totals
        console.warn(`[ProfilesScreen] Failed to fetch totals for profile ${profile._id}`, err);
      }
    }

    setProfileTotals(totals);
    setTotalsLoading(false);
  }, [accessToken]);

  const fetchProfiles = useCallback(async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    if (Date.now() - lastFetchTime.current < 30000) return;

    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getProfiles(accessToken);

      if (response.success && response.data) {
        setProfiles(response.data.profiles);
        lastFetchTime.current = Date.now();
        // Fetch totals in the background — don't block profile list rendering
        fetchProfileTotals(response.data.profiles);
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
  }, [accessToken, fetchProfileTotals]);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
      fetchPendingInvitationCount();
    }, [fetchProfiles, fetchPendingInvitationCount])
  );

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
    navigation.navigate('EditProfile', {
      profileId: profile._id,
      profileName: profile.name,
      profileColor: profile.color,
    });
  };

  const renderProfileItem = ({ item, index }: { item: Profile; index: number }) => {
    const avatarColor = item.color || Theme.colors.primary;
    const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : '?';
    const isDefault = item.isDefault;
    const relationship = item.relationship ? formatRelationship(item.relationship) : '';

    return (
      <TouchableOpacity
        style={[styles.profileCard, isDefault && styles.profileCardDefault]}
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
              {isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
              {relationship && !isDefault ? (
                <View style={styles.relationshipBadge}>
                  <Text style={styles.relationshipBadgeText}>{relationship.toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.profileSubtitle} numberOfLines={1}>
              {isDefault ? 'PRIMARY ACCOUNT' : relationship ? `${relationship.toUpperCase()} GROUP` : 'PERSONAL'}
            </Text>
          </View>

          {/* Right side - totals */}
          <View style={styles.profileRight}>
            <Text style={styles.profileRightLabel}>
              {isDefault ? 'TOTAL SPENT' : 'BALANCE'}
            </Text>
            {totalsLoading && !profileTotals[item._id] ? (
              <ActivityIndicator size="small" color={Theme.colors.textTertiary} />
            ) : (
              <Text
                style={[
                  styles.profileRightAmount,
                  {
                    color: isDefault
                      ? Theme.colors.error
                      : (profileTotals[item._id]?.balance ?? 0) >= 0
                        ? Theme.colors.success
                        : Theme.colors.error,
                  },
                ]}>
                {(() => {
                  if (isDefault) {
                    return formatCurrency(profileTotals[item._id]?.totalSpent ?? 0);
                  }
                  const bal = profileTotals[item._id]?.balance ?? 0;
                  const sign = bal >= 0 ? '+' : '-';
                  return `${sign}${formatCurrency(Math.abs(bal))}`;
                })()}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom divider */}
        {index < profiles.length - 1 && <View style={styles.profileDivider} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
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

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setShowLogoutDialog(false);
  };

  return (
    <View style={styles.container}>
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
            { paddingBottom: Theme.spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.invitationsCard}
              onPress={() => navigation.navigate('Invitations')}
              activeOpacity={0.7}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsLeft}>
                  <View style={[styles.settingsIcon, { backgroundColor: `${Theme.colors.primary}15` }]}>
                    <FontAwesome6
                      name="envelope-open-text"
                      size={16}
                      color={Theme.colors.primary}
                      solid
                    />
                  </View>
                  <Text style={styles.settingsText}>Invitations</Text>
                </View>
                <View style={styles.invitationsRight}>
                  <View
                    style={[
                      styles.invitationsBadge,
                      pendingInvitationCount === 0 && styles.invitationsBadgeEmpty,
                    ]}>
                    <Text
                      style={[
                        styles.invitationsBadgeText,
                        pendingInvitationCount === 0 && styles.invitationsBadgeTextEmpty,
                      ]}>
                      {pendingInvitationCount}
                    </Text>
                  </View>
                  <FontAwesome6
                    name="chevron-right"
                    size={14}
                    color={Theme.colors.textTertiary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          }
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
          ListFooterComponent={
            <View>
              {/* Manage Categories */}
              <TouchableOpacity
                style={styles.settingsCard}
                onPress={() => navigation.navigate('Categories')}
                activeOpacity={0.7}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingsIcon, { backgroundColor: `${Theme.colors.primary}15` }]}>
                      <FontAwesome6 name="tags" size={16} color={Theme.colors.primary} solid />
                    </View>
                    <Text style={styles.settingsText}>Manage Categories</Text>
                  </View>
                  <FontAwesome6 name="chevron-right" size={14} color={Theme.colors.textTertiary} />
                </View>
              </TouchableOpacity>

              {/* Account Settings Section */}
              <Text style={styles.sectionTitle}>Account Settings</Text>

              <View style={styles.accountCard}>
                {/* Email */}
                <View style={styles.settingsRow}>
                  <View style={styles.settingsLeft}>
                    <View style={[styles.settingsIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <FontAwesome6 name="envelope" size={16} color="#3B82F6" solid />
                    </View>
                    <View>
                      <Text style={styles.settingsLabel}>EMAIL ADDRESS</Text>
                      <Text style={styles.settingsValue}>{user?.email || 'Not set'}</Text>
                    </View>
                  </View>
                </View>

              </View>

              {/* Sign Out */}
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => setShowLogoutDialog(true)}
                activeOpacity={0.7}>
                <FontAwesome6 name="right-from-bracket" size={16} color={Theme.colors.error} solid />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Delete Profile Dialog */}
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

      {/* Logout Dialog */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
        loading={logoutLoading}
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
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  profileCardDefault: {
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1.5,
    borderColor: `${Theme.colors.primary}30`,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    gap: 3,
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
    fontWeight: Theme.typography.fontWeight.bold,
  },
  defaultBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: 9,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  relationshipBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  relationshipBadgeText: {
    fontSize: 9,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  profileSubtitle: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  profileRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  profileRightLabel: {
    fontSize: 9,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
  profileRightAmount: {
    fontSize: Theme.typography.fontSize.large,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Theme.spacing.md,
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
  settingsCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.small,
  },
  invitationsCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  invitationsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  invitationsBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationsBadgeEmpty: {
    backgroundColor: Theme.colors.lightGrey,
  },
  invitationsBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  invitationsBadgeTextEmpty: {
    color: Theme.colors.textSecondary,
  },
  accountCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.small,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  settingsLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  settingsValue: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: Theme.spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xxl,
    paddingVertical: Theme.spacing.sm,
  },
  signOutText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default ProfilesScreen;
