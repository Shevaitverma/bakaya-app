import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { profileService } from '../../services/profileService';
import type { Expense, PersonalExpensesResponse } from '../../types/expense';
import type { Profile } from '../../types/profile';
import SwipeableExpenseItem from '../../components/SwipeableExpenseItem';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type ExpenseDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'ExpenseDetail'>;

const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch expenses and profiles on mount and refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchExpenses();
      fetchProfiles();
    }, [accessToken])
  );

  const fetchProfiles = async () => {
    if (!accessToken) return;
    try {
      const response = await profileService.getProfiles(accessToken);
      if (response.success && response.data?.profiles) {
        setProfiles(response.data.profiles);
      }
    } catch (err) {
      // Silently fail — profile display is supplementary
      console.warn('Failed to load profiles:', err);
    }
  };

  const fetchExpenses = async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response: PersonalExpensesResponse = await expenseService.getPersonalExpenses(
        1,
        20,
        accessToken
      );

      if (response.success && response.data) {
        setExpenses(response.data.expenses);
        setTotalExpenseAmount(response.data.totalExpenseAmount);
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
  };

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
    // Get UTC time and add IST offset
    const utcTime = date.getTime();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(utcTime + istOffset);

    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatAmount = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense');
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
      setTotalExpenseAmount((prevTotal) => prevTotal - deletedExpense.amount);
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
      fetchExpenses();

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

  const getExpenseProfile = (expense: Expense): Profile | undefined => {
    if (!expense.profileId) return undefined;
    return profiles.find((p) => p._id === expense.profileId);
  };

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => {
    const isLastItem = index === expenses.length - 1;
    const isOpen = openSwipeableId === item._id;
    const profile = getExpenseProfile(item);

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
        profileName={profile?.name}
        profileColor={profile?.color}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.primary} />
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <Text style={styles.headerTitle}>My Expense</Text>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.totalAmountLabel}>Total amount</Text>
            <Text style={styles.totalAmountValue}>
              {formatAmount(totalExpenseAmount)}
            </Text>
          </View>
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6
                name="receipt"
                size={48}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
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
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  totalAmountContainer: {
    marginTop: Theme.spacing.xs,
  },
  totalAmountLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    opacity: 0.9,
    marginBottom: Theme.spacing.xs,
  },
  totalAmountValue: {
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
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

export default ExpenseDetailScreen;
