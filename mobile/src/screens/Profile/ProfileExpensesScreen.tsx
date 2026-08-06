/**
 * Profile Expenses Screen - Shows all expenses for a specific profile
 */

import React, { useState, useEffect } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { useExpenses, useCategories, useDeleteExpense } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import type { Expense, PersonalExpensesData } from '../../types/expense';
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
  const queryClient = useQueryClient();
  // Initialize to "this_month" so the first fetch uses the correct range
  // without relying on DateRangePicker to fire onChange on mount.
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

  // Same filters/page/limit the hook keys on — reused below for optimistic writes.
  const filters = { profileId, startDate, endDate };
  const listKey = queryKeys.expenses.list({ ...filters, page: 1, limit: 100 });

  const { data, isLoading, isError, error, refetch, isRefetching } = useExpenses(filters, 1, 100);
  const expenses = data?.expenses ?? [];
  const totalExpenseAmount = data?.totalExpenseAmount ?? 0;
  const totalIncome = data?.totalIncome ?? 0;
  const balance = data?.balance ?? 0;

  const { data: categoryData } = useCategories();
  const deleteExpense = useDeleteExpense();

  useEffect(() => {
    if (isError) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred while fetching expenses');
    }
  }, [isError, error]);

  const handleDateRangeChange = (newStart?: string, newEnd?: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
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

  const handleConfirmDelete = () => {
    if (!accessToken || !expenseToDelete) {
      return;
    }

    setDeleteLoading(true);

    // Optimistically update the cached page immediately
    const deletedExpense = expenses.find((exp) => exp._id === expenseToDelete.id);
    if (deletedExpense) {
      queryClient.setQueryData<PersonalExpensesData>(listKey, (old) => {
        if (!old) return old;
        const isIncome = deletedExpense.type === 'income';
        return {
          ...old,
          expenses: old.expenses.filter((exp) => exp._id !== expenseToDelete.id),
          totalIncome: isIncome ? old.totalIncome - deletedExpense.amount : old.totalIncome,
          totalExpenseAmount: isIncome
            ? old.totalExpenseAmount
            : old.totalExpenseAmount - deletedExpense.amount,
          balance: isIncome
            ? old.balance - deletedExpense.amount
            : old.balance + deletedExpense.amount,
        };
      });
    }

    // Close dialog immediately for better UX
    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    deleteExpense.mutate(expenseToDelete.id, {
      onError: (err) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete expense';

        // Refetch on error to restore correct state
        refetch();

        Alert.alert('Error', errorMessage);
      },
      onSettled: () => setDeleteLoading(false),
    });
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
    categoryData?.categories.forEach((cat) => {
      if (cat.isActive) map[cat.name.toLowerCase()] = { emoji: cat.emoji, color: cat.color };
    });
    return map;
  }, [categoryData]);

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (isError && expenses.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <FontAwesome6
          name="triangle-exclamation"
          size={48}
          color={Theme.colors.error}
          solid
        />
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'An error occurred while fetching expenses'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.navigate('EditProfile', { profileId, profileName, profileColor })
          }
          activeOpacity={0.7}>
          <FontAwesome6
            name="pen"
            size={16}
            color={Theme.colors.textOnPrimary}
            solid
          />
        </TouchableOpacity>
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
              refreshing={isRefetching}
              onRefresh={() => refetch()}
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
