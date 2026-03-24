import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import GroupCard from '../../components/GroupCard';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { Group } from '../../interfaces/group';
import type { HomeStackParamList } from '../../navigation/types';
import { groupService } from '../../services/groupService';
import { profileService } from '../../services/profileService';
import { expenseService } from '../../services/expenseService';
import type { GroupsResponse } from '../../types/group';
import type { Profile, ProfilesResponse } from '../../types/profile';
import type { Expense, PersonalExpensesResponse } from '../../types/expense';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

// Default profile colors when no color is assigned
const PROFILE_COLORS = [
  '#D81B60', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

const getProfileColor = (profile: Profile, index: number): string => {
  return profile.color ?? PROFILE_COLORS[index % PROFILE_COLORS.length] ?? '#D81B60';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const getCategoryIcon = (category: string): string => {
  const map: Record<string, string> = {
    food: 'utensils',
    transport: 'car',
    shopping: 'bag-shopping',
    entertainment: 'film',
    bills: 'file-invoice',
    health: 'heart-pulse',
    education: 'graduation-cap',
    travel: 'plane',
    groceries: 'cart-shopping',
    rent: 'house',
  };
  return map[category.toLowerCase()] || 'receipt';
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout, user, accessToken, refreshSession } = useAuth();

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Loading states (independent per section)
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;

    const fetchProfiles = async () => {
      try {
        setProfilesLoading(true);
        const response: ProfilesResponse = await profileService.getProfiles(accessToken);
        if (response.success && response.data) {
          setProfiles(response.data.profiles);
        }
      } catch (err: any) {
        if (err?.statusCode === 401) throw err; // Propagate 401 to parent
        console.error('Error fetching profiles:', err);
      } finally {
        setProfilesLoading(false);
      }
    };

    const fetchExpenses = async () => {
      try {
        setExpensesLoading(true);
        const response: PersonalExpensesResponse = await expenseService.getPersonalExpenses(1, 5, accessToken);
        if (response.success && response.data) {
          setRecentExpenses(response.data.expenses);
        }
      } catch (err: any) {
        if (err?.statusCode === 401) throw err; // Propagate 401 to parent
        console.error('Error fetching expenses:', err);
      } finally {
        setExpensesLoading(false);
      }
    };

    const fetchGroups = async () => {
      try {
        setGroupsLoading(true);
        const response: GroupsResponse = await groupService.getGroups(1, 20, accessToken);
        if (response.success && response.data) {
          const apiGroups: Group[] = response.data.groups.map((group) => ({
            id: group._id,
            title: group.name,
            amount: 10,
            imageUri: undefined,
          }));
          setGroups(apiGroups);
        }
      } catch (err: any) {
        if (err?.statusCode === 401) throw err; // Propagate 401 to parent
        console.error('Error fetching groups:', err);
      } finally {
        setGroupsLoading(false);
      }
    };

    try {
      await Promise.all([fetchProfiles(), fetchExpenses(), fetchGroups()]);
    } catch (err: any) {
      if (err?.statusCode === 401) {
        // Attempt token refresh; if it fails, log the user out
        const refreshed = await refreshSession();
        if (!refreshed) {
          await logout();
        }
        // If refresh succeeded, the next useFocusEffect cycle will re-fetch with new token
      }
    }
  }, [accessToken, refreshSession, logout]);

  // Refetch when screen comes into focus (also covers initial mount)
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const handleAddExpense = () => {
    navigation.navigate('AddExpense');
  };

  const handleProfilePress = (profile: Profile) => {
    navigation.navigate('ProfileExpenses', {
      profileId: profile._id,
      profileName: profile.name,
      profileColor: profile.color,
    });
  };

  const handleAddProfile = () => {
    // Navigate to Me tab's AddProfile screen
    // Use the parent navigator to switch to MeTab
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('MeTab', { screen: 'AddProfile' });
    }
  };

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetail', {
      groupId: group.id,
      groupName: group.title,
    });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleViewAllExpenses = () => {
    navigation.navigate('ExpenseDetail');
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setShowLogoutDialog(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  // --- Section Renderers ---

  const renderProfileChip = (profile: Profile, index: number) => {
    const color = getProfileColor(profile, index);
    return (
      <TouchableOpacity
        key={profile._id}
        style={styles.profileChip}
        onPress={() => handleProfilePress(profile)}
        activeOpacity={0.7}
      >
        <View style={[styles.profileDot, { backgroundColor: color }]} />
        <Text style={styles.profileChipText} numberOfLines={1}>
          {profile.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddProfileChip = () => (
    <TouchableOpacity
      key="add-profile"
      style={[styles.profileChip, styles.addProfileChip]}
      onPress={handleAddProfile}
      activeOpacity={0.7}
    >
      <FontAwesome6
        name="plus"
        size={12}
        color={Theme.colors.primary}
        solid
      />
      <Text style={[styles.profileChipText, styles.addProfileChipText]}>
        Add
      </Text>
    </TouchableOpacity>
  );

  const getExpenseProfile = (expense: Expense): Profile | undefined => {
    if (!expense.profileId) return undefined;
    return profiles.find((p) => p._id === expense.profileId);
  };

  const renderExpenseRow = (expense: Expense) => {
    const profile = getExpenseProfile(expense);
    const profileColor = profile
      ? getProfileColor(profile, profiles.indexOf(profile))
      : undefined;

    return (
      <TouchableOpacity
        key={expense._id}
        style={styles.expenseRow}
        onPress={() => navigation.navigate('EditExpense', { expenseId: expense._id })}
        activeOpacity={0.7}>
        <View style={styles.expenseIconWrapper}>
          <FontAwesome6
            name={getCategoryIcon(expense.category ?? 'other') as any}
            size={16}
            color={Theme.colors.primary}
            solid
          />
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {expense.title}
          </Text>
          <View style={styles.expenseMeta}>
            <Text style={styles.expenseCategory}>
              {expense.category} {'\u00B7'} {formatDate(expense.createdAt)}
            </Text>
            {profile && profileColor && (
              <View style={[styles.profileBadge, { backgroundColor: profileColor + '18' }]}>
                <View style={[styles.profileBadgeDot, { backgroundColor: profileColor }]} />
                <Text style={[styles.profileBadgeText, { color: profileColor }]} numberOfLines={1}>
                  {profile.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.expenseAmount}>
          {'\u20B9'}{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGroupCard = (item: Group) => (
    <GroupCard
      key={item.id}
      title={item.title}
      amount={item.amount}
      imageUri={item.imageUri}
      onPress={() => handleGroupPress(item)}
    />
  );

  const renderSectionLoading = () => (
    <View style={styles.sectionLoadingContainer}>
      <ActivityIndicator size="small" color={Theme.colors.primary} />
      <Text style={styles.sectionLoadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.greeting}>
              Hello{user?.firstName ? `, ${user.firstName}` : ''}
            </Text>
            <Text style={styles.title}>Bakaya</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <FontAwesome6
              name="right-from-bracket"
              size={18}
              color={Theme.colors.textOnPrimary}
              solid
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Theme.spacing.xxl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {/* --- Add Expense CTA --- */}
          <TouchableOpacity
            style={styles.addExpenseButton}
            onPress={handleAddExpense}
            activeOpacity={0.85}
          >
            <View style={styles.addExpenseIconCircle}>
              <FontAwesome6
                name="plus"
                size={18}
                color={Theme.colors.primary}
                solid
              />
            </View>
            <View style={styles.addExpenseTextContainer}>
              <Text style={styles.addExpenseTitle}>Add Expense</Text>
              <Text style={styles.addExpenseSubtitle}>Track a new personal expense</Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              size={14}
              color={Theme.colors.textOnPrimary}
              solid
            />
          </TouchableOpacity>

          {/* --- Profiles Section --- */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Profiles</Text>
            {profilesLoading ? (
              renderSectionLoading()
            ) : profiles.length === 0 ? (
              <View style={styles.emptyStateRow}>
                <Text style={styles.emptyStateText}>No profiles yet.</Text>
                <TouchableOpacity onPress={handleAddProfile}>
                  <Text style={styles.emptyStateLink}>Create one</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.profileChipsContainer}
              >
                {profiles.map((profile, index) => renderProfileChip(profile, index))}
                {renderAddProfileChip()}
              </ScrollView>
            )}
          </View>

          {/* --- Recent Expenses Section --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderLabel}>Recent Expenses</Text>
              {recentExpenses.length > 0 && (
                <TouchableOpacity onPress={handleViewAllExpenses}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {expensesLoading ? (
              renderSectionLoading()
            ) : recentExpenses.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <FontAwesome6
                  name="receipt"
                  size={28}
                  color={Theme.colors.textTertiary}
                  solid
                />
                <Text style={styles.emptyStateCardText}>
                  No expenses yet. Tap "Add Expense" to get started!
                </Text>
              </View>
            ) : (
              <View style={styles.expensesCard}>
                {recentExpenses.map((expense, index) => (
                  <React.Fragment key={expense._id}>
                    {renderExpenseRow(expense)}
                    {index < recentExpenses.length - 1 && (
                      <View style={styles.expenseDivider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* --- My Groups Section --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderLabel}>My Groups</Text>
              <TouchableOpacity
                style={[styles.profileChip, styles.addProfileChip]}
                onPress={handleCreateGroup}
                activeOpacity={0.7}
              >
                <FontAwesome6
                  name="plus"
                  size={12}
                  color={Theme.colors.primary}
                  solid
                />
                <Text style={[styles.profileChipText, styles.addProfileChipText]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
            {groupsLoading ? (
              renderSectionLoading()
            ) : groups.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <FontAwesome6
                  name="users"
                  size={28}
                  color={Theme.colors.textTertiary}
                  solid
                />
                <Text style={styles.emptyStateCardText}>
                  No groups yet. Create a group to split expenses with friends.
                </Text>
              </View>
            ) : (
              <View style={styles.groupsList}>
                {groups.map((group) => renderGroupCard(group))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
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

  // --- Header ---
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    opacity: 0.9,
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // --- Content wrapper ---
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: Theme.spacing.lg,
  },

  // --- Add Expense CTA ---
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    marginHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.large,
  },
  addExpenseIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  addExpenseTextContainer: {
    flex: 1,
  },
  addExpenseTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginBottom: 2,
  },
  addExpenseSubtitle: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    opacity: 0.85,
  },

  // --- Sections ---
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.3,
  },
  sectionHeaderLabel: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Profile chips ---
  profileChipsContainer: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Theme.shadows.small,
    gap: Theme.spacing.xs,
  },
  addProfileChip: {
    borderStyle: 'dashed',
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(216, 27, 96, 0.05)',
  },
  profileDot: {
    width: 10,
    height: 10,
    borderRadius: Theme.borderRadius.round,
  },
  profileChipText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    maxWidth: 100,
  },
  addProfileChipText: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Expense rows ---
  expensesCard: {
    backgroundColor: Theme.colors.cardBackground,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  expenseIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    flexWrap: 'wrap',
  },
  expenseCategory: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.round,
    gap: 4,
  },
  profileBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: Theme.borderRadius.round,
  },
  profileBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    maxWidth: 80,
  },
  expenseAmount: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginLeft: Theme.spacing.sm,
    letterSpacing: -0.3,
  },
  expenseDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: Theme.spacing.sm,
  },

  // --- Groups ---
  groupsList: {
    gap: 0,
  },

  // --- Loading ---
  sectionLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  sectionLoadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },

  // --- Empty states ---
  emptyStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyStateLink: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  emptyStateCard: {
    backgroundColor: Theme.colors.cardBackground,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyStateCardText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;
