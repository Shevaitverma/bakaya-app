/**
 * Profile Expenses Screen - Shows all expenses for a specific profile
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { categoryService } from '../../services/categoryService';
import type { Expense, PersonalExpensesResponse } from '../../types/expense';
import type { Category } from '../../types/category';
import SwipeableExpenseItem from '../../components/SwipeableExpenseItem';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import DateRangePicker from '../../components/DateRangePicker';
import { formatCurrencyExact } from '../../utils/currency';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type ProfileExpensesScreenProps = NativeStackScreenProps<HomeStackParamList, 'ProfileExpenses'>;

const ProfileExpensesScreen: React.FC<ProfileExpensesScreenProps> = ({ route, navigation }) => {
  const { profileId, profileName, profileColor } = route.params;
  const avatarColor = profileColor || Theme.colors.primary;
  const firstLetter = profileName ? profileName.charAt(0).toUpperCase() : '?';
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [balance, setBalance] = useState(0);
  // Initialize to "this_month" so the first useFocusEffect fetch uses the
  // correct range without relying on DateRangePicker to fire onChange on mount.
  const [startDate, setStartDate] = useState<string | undefined>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string | undefined>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const lastFetchTime = useRef<number>(0);

  const fetchCategories = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await categoryService.getCategories(accessToken);
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories.filter((c) => c.isActive));
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  }, [accessToken]);

  const fetchExpenses = useCallback(async (
    filterStartDate?: string,
    filterEndDate?: string,
    isRefreshing = false,
  ) => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      const filters: Record<string, string> = { profileId };
      if (filterStartDate) filters.startDate = filterStartDate;
      if (filterEndDate) filters.endDate = filterEndDate;

      const response: PersonalExpensesResponse = await expenseService.getPersonalExpenses(
        1,
        100,
        accessToken,
        filters
      );

      if (response.success && response.data) {
        setExpenses(response.data.expenses);
        setTotalExpenseAmount(response.data.totalExpenseAmount);
        setTotalIncome(response.data.totalIncome);
        setBalance(response.data.balance);
        lastFetchTime.current = Date.now();
      } else {
        throw new Error('Failed to fetch expenses');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching expenses';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accessToken, profileId]);

  // Fetch expenses and categories on mount and refresh when screen comes into focus.
  // Dates are initialized to "this_month" so the first fetch always has a valid range.
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchTime.current < 30000) return;
      fetchExpenses(startDate, endDate);
      fetchCategories();
    }, [fetchExpenses, fetchCategories, startDate, endDate])
  );

  const handleDateRangeChange = useCallback(
    (newStart?: string, newEnd?: string) => {
      setStartDate(newStart);
      setEndDate(newEnd);
      lastFetchTime.current = 0;
      fetchExpenses(newStart, newEnd);
    },
    [fetchExpenses]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchTime.current = 0;
    await fetchExpenses(startDate, endDate, true);
    setRefreshing(false);
  }, [fetchExpenses, startDate, endDate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    // Convert to IST (UTC+5:30)
    const utcTime = date.getTime();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(utcTime + istOffset);

    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatAmount = (amount: number): string => {
    return formatCurrencyExact(amount);
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { profileId });
  };

  const handleEditExpense = (expenseId: string) => {
    navigation.navigate('EditExpense', { expenseId });
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    // Find the expense to show in confirmation
    const expense = expenses.find((exp) => exp._id === expenseId);
    const expenseTitle = expense?.title || 'this expense';

    // Show dialog immediately with loading state
    setExpenseToDelete({ id: expenseId, title: expenseTitle });
    setDeleteDialogVisible(true);
    setDeleteLoading(true);

    // Small delay to ensure smooth UI transition, then show dialog content
    setTimeout(() => {
      setDeleteLoading(false);
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !expenseToDelete) {
      return;
    }

    setDeleteLoading(true);

    // Optimistically update UI immediately
    const deletedExpense = expenses.find((exp) => exp._id === expenseToDelete.id);
    if (deletedExpense) {
      setExpenses((prevExpenses) => prevExpenses.filter((exp) => exp._id !== expenseToDelete.id));
      if (deletedExpense.type === 'income') {
        setTotalIncome((prev) => prev - deletedExpense.amount);
        setBalance((prev) => prev - deletedExpense.amount);
      } else {
        setTotalExpenseAmount((prevTotal) => prevTotal - deletedExpense.amount);
        setBalance((prev) => prev + deletedExpense.amount);
      }
    }

    // Close dialog immediately for better UX
    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    try {
      await expenseService.deleteExpense(expenseToDelete.id, accessToken);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete expense';

      // Refetch expenses on error to restore correct state
      fetchExpenses(startDate, endDate);

      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (!deleteLoading) {
      setDeleteDialogVisible(false);
      setExpenseToDelete(null);
      setDeleteLoading(false);
    }
  };

  const handleSwipeStart = (expenseId: string) => {
    // Close any other open swipeable when starting a new swipe
    if (openSwipeableId && openSwipeableId !== expenseId) {
      setOpenSwipeableId(null);
    }
  };

  const handleSwipeEnd = (expenseId: string, isOpen: boolean) => {
    // Update the open state based on whether the item ended up open or closed
    if (isOpen) {
      setOpenSwipeableId(expenseId);
    } else {
      setOpenSwipeableId(null);
    }
  };

  // Build category lookup map
  const categoryMap = React.useMemo(() => {
    const map: Record<string, { emoji: string; color: string }> = {};
    categories.forEach((cat) => {
      map[cat.name.toLowerCase()] = { emoji: cat.emoji, color: cat.color };
    });
    return map;
  }, [categories]);

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => {
    const isLastItem = index === expenses.length - 1;
    const isOpen = openSwipeableId === item._id;
    const catKey = (item.category ?? 'other').toLowerCase();
    const catData = categoryMap[catKey];

    return (
      <SwipeableExpenseItem
        item={item}
        index={index}
        isLastItem={isLastItem}
        onDelete={handleDeleteExpense}
        onPress={handleEditExpense}
        formatDate={formatDate}
        formatTime={formatTime}
        formatAmount={formatAmount}
        isOpen={isOpen}
        onSwipeStart={() => handleSwipeStart(item._id)}
        onSwipeEnd={(expenseId, isOpen) => handleSwipeEnd(expenseId, isOpen)}
        categoryEmoji={catData?.emoji}
        categoryColor={catData?.color}
      />
    );
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        {/* Income */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconRow}>
            <FontAwesome6 name="arrow-trend-up" size={12} color={Theme.colors.success} solid />
            <Text style={styles.summaryLabel}>Income</Text>
          </View>
          <Text style={[styles.summaryValue, { color: Theme.colors.success }]}>
            {formatAmount(totalIncome)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider} />

        {/* Expenses */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconRow}>
            <FontAwesome6 name="arrow-trend-down" size={12} color={Theme.colors.error} solid />
            <Text style={styles.summaryLabel}>Expenses</Text>
          </View>
          <Text style={[styles.summaryValue, { color: Theme.colors.error }]}>
            {formatAmount(totalExpenseAmount)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider} />

        {/* Balance */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconRow}>
            <FontAwesome6
              name="wallet"
              size={12}
              color={balance >= 0 ? Theme.colors.success : Theme.colors.error}
              solid
            />
            <Text style={styles.summaryLabel}>Balance</Text>
          </View>
          <Text
            style={[
              styles.summaryValue,
              { color: balance >= 0 ? Theme.colors.success : Theme.colors.error },
            ]}
          >
            {formatAmount(balance)}
          </Text>
        </View>
      </View>

      {/* Expense count */}
      <View style={styles.summaryFooter}>
        <FontAwesome6 name="receipt" size={11} color={Theme.colors.textTertiary} solid />
        <Text style={styles.summaryFooterText}>
          {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (error && expenses.length === 0) {
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchExpenses(startDate, endDate)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header Section */}
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
        <View style={styles.headerContent}>
          {/* Profile Avatar */}
          <View style={[styles.profileAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.profileAvatarText}>{firstLetter}</Text>
          </View>
          <Text style={styles.headerTitle}>{profileName}</Text>
          {/* Date Range Picker */}
          <DateRangePicker
            onChange={handleDateRangeChange}
            defaultPreset="this_month"
            style={styles.dateRangeTrigger}
          />
        </View>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Content Area */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={expenses}
          renderItem={({ item, index }) => renderExpenseItem({ item, index })}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 }
          ]}
          ListHeaderComponent={expenses.length > 0 ? renderSummaryCard : null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6
                name="receipt"
                size={48}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyText}>No expenses for this profile</Text>
              <Text style={styles.emptySubtext}>Add an expense to start tracking</Text>
            </View>
          }
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + Theme.spacing.md,
          },
        ]}
        onPress={handleAddExpense}
        activeOpacity={0.8}>
        <View style={styles.fabContent}>
          <FontAwesome6
            name="plus"
            size={20}
            color={Theme.colors.textOnPrimary}
            solid
          />
          <Text style={styles.fabLabel}>Add expense</Text>
        </View>
      </TouchableOpacity>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Expense"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.title}"? This action cannot be undone.`
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    gap: Theme.spacing.sm,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileAvatarText: {
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  dateRangeTrigger: {
    marginTop: Theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Theme.shadows.small,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  summaryFooterText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
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
  fab: {
    position: 'absolute',
    right: Theme.spacing.md,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    ...Theme.shadows.large,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  fabLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default ProfileExpensesScreen;
