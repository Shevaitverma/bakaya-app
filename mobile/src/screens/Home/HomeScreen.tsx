import React, { useState, useCallback, useRef } from 'react';
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
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { HomeStackParamList } from '../../navigation/types';
import { useProfiles, useExpenses, useCategories, useBalance } from '../../hooks/queries';
import { formatCurrency } from '../../utils/currency';
import type { Profile } from '../../types/profile';
import type { Expense } from '../../types/expense';

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

const getSourceIcon = (source: string): string => {
  const map: Record<string, string> = {
    salary: 'briefcase',
    freelance: 'laptop',
    investment: 'chart-line',
    gift: 'gift',
    refund: 'rotate-left',
    rental: 'house',
    other: 'money-bill',
  };
  return map[source.toLowerCase()] || 'money-bill';
};

const getCurrentMonthYear = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const getBalanceColor = (balance: number): string => {
  if (balance > 0) return Theme.colors.success;
  if (balance < 0) return Theme.colors.error;
  return Theme.colors.textSecondary;
};

const getProgressColor = (percentage: number): string => {
  if (percentage <= 50) return Theme.colors.primary;
  if (percentage <= 75) return Theme.colors.warning;
  return Theme.colors.error;
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout, user } = useAuth();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null); // null = "All"

  const profilesQuery = useProfiles();
  const expensesQuery = useExpenses(
    selectedProfileId ? { profileId: selectedProfileId } : undefined,
    1,
    5
  );
  const balanceQuery = useBalance();
  const categoriesQuery = useCategories();

  const profiles = profilesQuery.data?.profiles ?? [];
  const recentExpenses = expensesQuery.data?.expenses ?? [];
  const balanceData = balanceQuery.data ?? null;

  const [refreshing, setRefreshing] = useState(false);

  // Logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Tab screens stay mounted, so `refetchOnMount` never fires on tab switch.
  // Refetch on focus, but only what the 30s staleTime already marked stale —
  // same throttle the old `isFresh(lastFetchTime)` guard gave us.
  // `cancelRefetch: false` so this joins the mount fetch instead of doubling it.
  const queriesRef = useRef<
    { isStale: boolean; refetch: (opts?: { cancelRefetch?: boolean }) => unknown }[]
  >([]);
  queriesRef.current = [profilesQuery, expensesQuery, balanceQuery, categoriesQuery];
  useFocusEffect(
    useCallback(() => {
      queriesRef.current.forEach((q) => {
        if (q.isStale) q.refetch({ cancelRefetch: false });
      });
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(queriesRef.current.map((q) => q.refetch()));
    setRefreshing(false);
  }, []);

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { type: 'expense' });
  };

  const handleAddIncome = () => {
    navigation.navigate('AddExpense', { type: 'income' });
  };

  const handleProfilePress = (profileId: string | null) => {
    setSelectedProfileId(profileId);
  };

  const handleAddProfile = () => {
    // Navigate to Me tab's AddProfile screen
    // Use the parent navigator to switch to MeTab
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('MeTab', { screen: 'AddProfile' });
    }
  };

  const handleViewAllExpenses = () => {
    navigation.navigate('ExpenseDetail');
  };

  const handleViewAllProfiles = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('MeTab', { screen: 'Profiles' });
    }
  };

  const handleQuickAnalytics = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('AnalyticsTab');
    }
  };

  const handleQuickCategories = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('MeTab', { screen: 'Categories' });
    }
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

  const renderAllChip = () => {
    const isSelected = selectedProfileId === null;
    return (
      <TouchableOpacity
        key="all-profiles"
        style={[
          styles.profileChip,
          isSelected && styles.profileChipSelected,
        ]}
        onPress={() => handleProfilePress(null)}
        activeOpacity={0.7}
      >
        <FontAwesome6 name="layer-group" size={10} color={isSelected ? Theme.colors.textOnPrimary : Theme.colors.primary} solid />
        <Text style={[styles.profileChipText, isSelected && styles.profileChipTextSelected]} numberOfLines={1}>
          All
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProfileChip = (profile: Profile, index: number) => {
    const color = getProfileColor(profile, index);
    const isSelected = selectedProfileId === profile._id;
    return (
      <TouchableOpacity
        key={profile._id}
        style={[
          styles.profileChip,
          isSelected && { backgroundColor: color, borderColor: color },
        ]}
        onPress={() => handleProfilePress(profile._id)}
        activeOpacity={0.7}
      >
        <View style={[styles.profileDot, { backgroundColor: isSelected ? Theme.colors.white : color }]} />
        <Text style={[styles.profileChipText, isSelected && { color: Theme.colors.white }]} numberOfLines={1}>
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
    if (!expense.profileId) return profiles.find((p) => p.isDefault);
    return profiles.find((p) => p._id === expense.profileId);
  };

  // Build category lookup map
  const categoryMap = React.useMemo(() => {
    const map: Record<string, { emoji: string; color: string }> = {};
    (categoriesQuery.data?.categories ?? []).forEach((cat) => {
      if (cat.isActive) map[cat.name.toLowerCase()] = { emoji: cat.emoji, color: cat.color };
    });
    return map;
  }, [categoriesQuery.data]);

  const renderExpenseRow = (expense: Expense, isLast: boolean) => {
    const profile = getExpenseProfile(expense);
    const profileColor = profile
      ? getProfileColor(profile, profiles.indexOf(profile))
      : undefined;
    const isIncome = expense.type === 'income';
    const catKey = (expense.category ?? 'other').toLowerCase();
    const catData = categoryMap[catKey];
    const labelText = isIncome
      ? (expense.source ?? 'Income')
      : (expense.category ?? 'Other');

    // For income, use FontAwesome icon; for expenses, prefer category emoji
    let iconContent: React.ReactNode;
    let iconBg: string;
    if (isIncome) {
      const iconName = getSourceIcon(expense.source ?? 'other');
      iconBg = 'rgba(16, 185, 129, 0.1)';
      iconContent = (
        <FontAwesome6
          name={iconName as any}
          size={16}
          color={Theme.colors.success}
          solid
        />
      );
    } else if (catData) {
      iconBg = catData.color + '20';
      iconContent = <Text style={styles.expenseEmojiIcon}>{catData.emoji}</Text>;
    } else {
      const iconName = getCategoryIcon(expense.category ?? 'other');
      iconBg = 'rgba(216, 27, 96, 0.1)';
      iconContent = (
        <FontAwesome6
          name={iconName as any}
          size={16}
          color={Theme.colors.primary}
          solid
        />
      );
    }

    return (
      <React.Fragment key={expense._id}>
        <TouchableOpacity
          style={styles.expenseRow}
          onPress={() => navigation.navigate('EditExpense', { expenseId: expense._id })}
          activeOpacity={0.7}>
          <View style={[styles.expenseIconWrapper, { backgroundColor: iconBg }]}>
            {iconContent}
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseTitle} numberOfLines={1}>
              {expense.title}
            </Text>
            <Text style={styles.expenseCategory} numberOfLines={1}>
              {labelText}
              {profile ? ` \u00B7 ${profile.name}` : ''}
              {` \u00B7 ${formatDate(expense.createdAt)}`}
            </Text>
          </View>
          <Text style={[styles.expenseAmount, { color: isIncome ? Theme.colors.success : Theme.colors.error }]}>
            {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
          </Text>
        </TouchableOpacity>
        {!isLast && <View style={styles.expenseDivider} />}
      </React.Fragment>
    );
  };

  const renderSectionLoading = () => (
    <View style={styles.sectionLoadingContainer}>
      <ActivityIndicator size="small" color={Theme.colors.primary} />
      <Text style={styles.sectionLoadingText}>Loading...</Text>
    </View>
  );

  // Balance card derived values
  const clampedPercentage = balanceData ? Math.min(Math.max(balanceData.spentPercentage, 0), 100) : 0;
  const progressColor = getProgressColor(clampedPercentage);
  const balanceColor = balanceData ? getBalanceColor(balanceData.balance) : Theme.colors.textSecondary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* ===== Header ===== */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <Text style={styles.title}>Bakaya</Text>
        <Text style={styles.greeting}>
          Hello{user?.firstName ? `, ${user.firstName}` : ''}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 },
        ]}
        style={styles.contentSheet}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
            tintColor={Theme.colors.primary}
          />
        }
      >

        {/* ===== Balance Summary Card ===== */}
        {balanceQuery.isLoading ? (
          <View style={styles.balanceLoadingContainer}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          </View>
        ) : balanceData ? (
          <View style={styles.balanceCard}>
            {/* Top row: Month chip + Income button */}
            <View style={styles.balanceCardTopRow}>
              <View style={styles.monthChip}>
                <FontAwesome6 name="calendar" size={12} color={Theme.colors.primary} />
                <Text style={styles.monthChipText}>{getCurrentMonthYear()}</Text>
              </View>
              <TouchableOpacity
                style={styles.incomeButton}
                onPress={handleAddIncome}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="plus" size={10} color={Theme.colors.primary} solid />
                <Text style={styles.incomeButtonText}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Three columns: Income | Expenses | Balance */}
            <View style={styles.balanceSummaryRow}>
              <View style={styles.balanceSummaryItem}>
                <Text style={[styles.balanceSummaryValue, { color: Theme.colors.success }]}>
                  {formatCurrency(balanceData.totalIncome)}
                </Text>
                <Text style={styles.balanceSummaryLabel}>INCOME</Text>
              </View>
              <View style={styles.balanceSummaryItem}>
                <Text style={[styles.balanceSummaryValue, { color: Theme.colors.error }]}>
                  {formatCurrency(balanceData.totalExpenses)}
                </Text>
                <Text style={styles.balanceSummaryLabel}>EXPENSES</Text>
              </View>
              <View style={styles.balanceSummaryItem}>
                <Text style={[styles.balanceSummaryValue, { color: balanceColor }]}>
                  {formatCurrency(Math.abs(balanceData.balance))}
                </Text>
                <Text style={styles.balanceSummaryLabel}>BALANCE</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${clampedPercentage}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>

            {/* Bottom row: daily rates + days remaining */}
            <View style={styles.balanceBottomRow}>
              <Text style={styles.balanceBottomLeft}>
                {formatCurrency(balanceData.dailySpendingRate)}/day spent  {'\u00B7'}  Budget: {formatCurrency(balanceData.dailyBudgetRate)}/day
              </Text>
              {balanceData.daysRemaining > 0 && (
                <Text style={styles.balanceBottomRight}>
                  {balanceData.daysRemaining} days left
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {/* ===== Profiles Section ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderLabel}>Profiles</Text>
            {profiles.length > 0 && (
              <TouchableOpacity onPress={handleViewAllProfiles}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {profilesQuery.isLoading ? (
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
              {renderAllChip()}
              {profiles.map((profile, index) => renderProfileChip(profile, index))}
              {renderAddProfileChip()}
            </ScrollView>
          )}
        </View>

        {/* ===== Recent Transactions Section ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderLabel}>Recent Transactions</Text>
          </View>
          {expensesQuery.isLoading ? (
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
                No expenses yet. Tap the + button to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.expensesCard}>
              {recentExpenses.map((expense, index) =>
                renderExpenseRow(expense, index === recentExpenses.length - 1)
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ===== FAB (Floating Action Button) ===== */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={handleAddExpense}
        activeOpacity={0.85}
      >
        <FontAwesome6 name="plus" size={22} color={Theme.colors.white} solid />
      </TouchableOpacity>

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

  contentSheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    marginTop: -Theme.borderRadius.xl,
  },

  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: Theme.spacing.xl,
  },

  // --- Header ---
  header: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl + Theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Theme.typography.fontSize.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  title: {
    fontSize: Theme.typography.fontSize.title,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
  },

  // --- Balance Card ---
  balanceCard: {
    backgroundColor: Theme.colors.white,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.medium,
  },
  balanceLoadingContainer: {
    marginHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
  },
  balanceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm + 4,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: Theme.colors.primaryLight,
    backgroundColor: 'rgba(216, 27, 96, 0.05)',
    gap: 6,
  },
  monthChipText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  incomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm + 4,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    gap: 4,
  },
  incomeButtonText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // Balance summary row
  balanceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  balanceSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceSummaryValue: {
    fontSize: Theme.typography.fontSize.xlarge,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  balanceSummaryLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },

  // Progress bar
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
  },

  // Balance bottom row
  balanceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceBottomLeft: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    flex: 1,
  },
  balanceBottomRight: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
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
    backgroundColor: Theme.colors.white,
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
  profileChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  profileChipTextSelected: {
    color: Theme.colors.textOnPrimary,
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
    backgroundColor: Theme.colors.white,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.xs,
    ...Theme.shadows.small,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm + 2,
    paddingHorizontal: Theme.spacing.md,
  },
  expenseIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  expenseEmojiIcon: {
    fontSize: 18,
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
  expenseCategory: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  expenseAmount: {
    fontSize: Theme.typography.fontSize.large,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginLeft: Theme.spacing.sm,
    letterSpacing: -0.3,
  },
  expenseDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: Theme.spacing.md,
  },

  // --- FAB ---
  fab: {
    position: 'absolute',
    right: Theme.spacing.md + 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.large,
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
    backgroundColor: Theme.colors.white,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: Theme.spacing.sm,
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
