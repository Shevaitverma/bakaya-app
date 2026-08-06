import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Share,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { queryKeys } from '../../lib/queryKeys';
import {
  useInfiniteExpenses,
  useProfiles,
  useCategories,
  useDeleteExpense,
} from '../../hooks/queries';
import type { Expense, ExpenseQueryParams, PersonalExpensesData } from '../../types/expense';
import type { Profile } from '../../types/profile';
import SwipeableExpenseItem from '../../components/SwipeableExpenseItem';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import DateRangePicker from '../../components/DateRangePicker';
import { formatCurrencyExact } from '../../utils/currency';
import { istToday, istMonthStart } from '../../utils/istDate';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type ExpenseDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'ExpenseDetail'>;

const PROFILE_COLORS = [
  '#D81B60', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

const getProfileColor = (profile: Profile, index: number): string => {
  return profile.color ?? PROFILE_COLORS[index % PROFILE_COLORS.length] ?? '#D81B60';
};

/** Page size for the infinite expense list. */
const PAGE_SIZE = 100;

const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  // Read optional category param passed from navigation (e.g. from analytics or home)
  const routeCategory = route.params?.category ?? null;

  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter state. `searchText` is what the input shows; `search` is the
  // debounced value the query actually keys on.
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);
  const [profileFilter, setProfileFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(routeCategory);
  const [startDate, setStartDate] = useState<string | undefined>(istMonthStart);
  const [endDate, setEndDate] = useState<string | undefined>(istToday);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CSV export state
  const [exporting, setExporting] = useState(false);

  // Empty values are omitted so the query key (and the request) stay clean.
  const filters = useMemo(() => {
    const f: Omit<ExpenseQueryParams, 'page' | 'limit'> = {};
    if (search) f.search = search;
    if (typeFilter) f.type = typeFilter;
    if (profileFilter) f.profileId = profileFilter;
    if (categoryFilter) f.category = categoryFilter;
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    return f;
  }, [search, typeFilter, profileFilter, categoryFilter, startDate, endDate]);

  const expensesQuery = useInfiniteExpenses(filters, PAGE_SIZE);
  const profilesQuery = useProfiles();
  const categoriesQuery = useCategories();
  const deleteExpense = useDeleteExpense();

  // A filter change re-keys the query, so `data` is undefined until it lands.
  // The shared hook sets no `placeholderData`, so hold the last loaded pages —
  // otherwise the list blanks and the summary zeroes mid-fetch, which the old
  // imperative fetch (it only replaced state on success) never did.
  const lastPagesRef = useRef<PersonalExpensesData[]>([]);
  if (expensesQuery.data) lastPagesRef.current = expensesQuery.data.pages;
  const pages = expensesQuery.data?.pages ?? lastPagesRef.current;

  const expenses = useMemo(() => pages.flatMap((p) => p.expenses), [pages]);
  const profiles = profilesQuery.data?.profiles ?? [];

  // Summary totals are window-wide, not per-page — read them off page 1.
  const { totalIncome = 0, totalExpenses = 0, balance = 0 } = pages[0] ?? {};

  const loading = expensesQuery.isFetching;
  const error = expensesQuery.error?.message ?? null;

  // The old imperative fetch alerted on failure; keep that.
  useEffect(() => {
    if (expensesQuery.error) Alert.alert('Error', expensesQuery.error.message);
  }, [expensesQuery.error]);

  // Refetch on focus, but only what the 30s staleTime already marked stale —
  // same throttle the old `isFresh(lastFetchTimeRef)` guard gave us.
  // `cancelRefetch: false` so this joins the mount fetch instead of doubling it.
  const queriesRef = useRef<
    { isStale: boolean; refetch: (opts?: { cancelRefetch?: boolean }) => unknown }[]
  >([]);
  queriesRef.current = [expensesQuery, profilesQuery, categoriesQuery];
  useFocusEffect(
    useCallback(() => {
      queriesRef.current.forEach((q) => {
        if (q.isStale) q.refetch({ cancelRefetch: false });
      });
    }, [])
  );

  const handleEndReached = useCallback(() => {
    if (expensesQuery.hasNextPage && !expensesQuery.isFetchingNextPage) {
      expensesQuery.fetchNextPage();
    }
  }, [expensesQuery.hasNextPage, expensesQuery.isFetchingNextPage, expensesQuery.fetchNextPage]);

  // -------------------------------------------------------------------
  // Search with 400ms debounce
  // -------------------------------------------------------------------
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => setSearch(text), 400);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearch('');
  }, []);

  const handleDateRangeChange = useCallback((newStartDate?: string, newEndDate?: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  // -------------------------------------------------------------------
  // CSV Export (server-generated — full history, current filters)
  // -------------------------------------------------------------------
  const handleExportCSV = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setExporting(true);

    try {
      // Not a query — a one-shot file download, so it stays on the service.
      const csvString = await expenseService.exportCSV(accessToken, filters);

      // Use react-native Share API to let the user share/copy the CSV data
      await Share.share({
        message: csvString,
        title: 'Bakaya Expenses Export',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export';
      Alert.alert('Export Failed', errorMessage);
    } finally {
      setExporting(false);
    }
  }, [accessToken, filters]);

  // -------------------------------------------------------------------
  // Existing helpers (formatDate, formatTime, formatAmount, etc.)
  // -------------------------------------------------------------------
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

    const expense = expenses.find((exp) => exp._id === expenseId);
    const expenseTitle = expense?.title || 'this expense';

    setExpenseToDelete({ id: expenseId, title: expenseTitle });
    setDeleteDialogVisible(true);
    setDeleteLoading(true);

    setTimeout(() => {
      setDeleteLoading(false);
    }, 100);
  };

  const handleConfirmDelete = () => {
    if (!accessToken || !expenseToDelete) {
      return;
    }

    const { id } = expenseToDelete;
    setDeleteLoading(true);

    // Optimistic removal. `useDeleteExpense` invalidates expenses.all on
    // success, which refetches this page and corrects the summary totals.
    queryClient.setQueryData<InfiniteData<PersonalExpensesData>>(
      queryKeys.expenses.infinite({ ...filters, limit: PAGE_SIZE }),
      (prev) =>
        prev && {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            expenses: p.expenses.filter((exp) => exp._id !== id),
          })),
        }
    );

    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    deleteExpense.mutate(id, {
      onError: (err) => {
        // Put the optimistically removed row back.
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete expense');
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
    if (openSwipeableId && openSwipeableId !== expenseId) {
      setOpenSwipeableId(null);
    }
  };

  const handleSwipeEnd = (expenseId: string, isOpen: boolean) => {
    if (isOpen) {
      setOpenSwipeableId(expenseId);
    } else {
      setOpenSwipeableId(null);
    }
  };

  const getExpenseProfile = (expense: Expense): Profile | undefined => {
    if (!expense.profileId) return profiles.find((p) => p.isDefault);
    return profiles.find((p) => p._id === expense.profileId);
  };

  const categoryMap = React.useMemo(() => {
    const map: Record<string, { emoji: string; color: string }> = {};
    (categoriesQuery.data?.categories ?? []).forEach((cat) => {
      if (cat.isActive) map[cat.name.toLowerCase()] = { emoji: cat.emoji, color: cat.color };
    });
    return map;
  }, [categoriesQuery.data]);

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => {
    const isLastItem = index === expenses.length - 1;
    const isOpen = openSwipeableId === item._id;
    const profile = getExpenseProfile(item);
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
        profileName={profile?.name}
        profileColor={profile?.color}
        categoryEmoji={catData?.emoji}
        categoryColor={catData?.color}
      />
    );
  };

  // -------------------------------------------------------------------
  // Filter & summary header rendered above the FlatList
  // -------------------------------------------------------------------
  const renderListHeader = () => {
    return (
      <View style={styles.filtersContainer}>
        {/* 1. Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.summaryIncome]}>
              {formatAmount(totalIncome)}
            </Text>
            <Text style={styles.summaryLabel}>INCOME</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.summaryExpense]}>
              {formatAmount(totalExpenses)}
            </Text>
            <Text style={styles.summaryLabel}>EXPENSES</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryValue,
                { color: balance >= 0 ? Theme.colors.success : Theme.colors.error },
              ]}
            >
              {formatAmount(Math.abs(balance))}
            </Text>
            <Text style={styles.summaryLabel}>BALANCE</Text>
          </View>
        </View>

        {/* 2. Type Filter Tabs */}
        <View style={styles.typeFilterRow}>
          <TouchableOpacity
            style={[
              styles.typeChip,
              typeFilter === null && styles.typeChipActive,
            ]}
            onPress={() => setTypeFilter(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeChipText, typeFilter === null && styles.typeChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeChip,
              typeFilter === 'expense' && styles.typeChipActive,
            ]}
            onPress={() => setTypeFilter('expense')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeChipText, typeFilter === 'expense' && styles.typeChipTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeChip,
              typeFilter === 'income' && styles.typeChipActive,
            ]}
            onPress={() => setTypeFilter('income')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeChipText, typeFilter === 'income' && styles.typeChipTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Search Bar with export button */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBar}>
            <FontAwesome6
              name="magnifying-glass"
              size={14}
              color={Theme.colors.textTertiary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={Theme.colors.textTertiary}
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome6
                  name="xmark"
                  size={14}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.exportIconButton}
            onPress={handleExportCSV}
            activeOpacity={0.7}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <FontAwesome6
                name="download"
                size={16}
                color={Theme.colors.primary}
                solid
              />
            )}
          </TouchableOpacity>
        </View>

        {/* 4. Date Range Picker */}
        <DateRangePicker
          onChange={handleDateRangeChange}
          defaultPreset="this_month"
          style={styles.dateRangeTrigger}
        />

        {/* 5. Profile Filter Chips */}
        {profiles.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.profileChipsContainer}
          >
            {/* "All" chip */}
            <TouchableOpacity
              style={[
                styles.profileChip,
                profileFilter === null && styles.profileChipActive,
              ]}
              onPress={() => setProfileFilter(null)}
              activeOpacity={0.7}
            >
              <View style={[styles.profileDot, { backgroundColor: Theme.colors.primary }]} />
              <Text
                style={[
                  styles.profileChipText,
                  profileFilter === null && styles.profileChipTextActive,
                ]}
                numberOfLines={1}
              >
                All
              </Text>
            </TouchableOpacity>

            {/* Profile chips */}
            {profiles.map((profile, index) => {
              const color = getProfileColor(profile, index);
              const isSelected = profileFilter === profile._id;

              return (
                <TouchableOpacity
                  key={profile._id}
                  style={[
                    styles.profileChip,
                    isSelected && styles.profileChipActive,
                  ]}
                  onPress={() => setProfileFilter(profile._id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.profileDot, { backgroundColor: color }]} />
                  <Text
                    style={[
                      styles.profileChipText,
                      isSelected && styles.profileChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {profile.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Transaction list label */}
        <Text style={styles.sectionLabel}>Transactions</Text>
      </View>
    );
  };

  // -------------------------------------------------------------------
  // Loading & error states
  // -------------------------------------------------------------------
  const hasActiveFilters = Boolean(
    searchText || typeFilter || profileFilter || categoryFilter || startDate || endDate
  );

  if (loading && expenses.length === 0 && !hasActiveFilters) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error && expenses.length === 0 && !hasActiveFilters) {
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
        <TouchableOpacity style={styles.retryButton} onPress={() => expensesQuery.refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header Section — primary colored background */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Content Area — white sheet with rounded top */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={expenses}
          renderItem={({ item, index }) => renderExpenseItem({ item, index })}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6
                  name="receipt"
                  size={48}
                  color={Theme.colors.textTertiary}
                  solid
                />
                <Text style={styles.emptyText}>No transactions found</Text>
                <Text style={styles.emptySubtext}>
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Add your first expense to get started'}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Loading overlay for filter changes */}
        {loading && expenses.length > 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          </View>
        )}
      </View>

      {/* Floating Action Button — circle with + */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: insets.bottom + Theme.spacing.lg },
        ]}
        onPress={handleAddExpense}
        activeOpacity={0.8}
      >
        <FontAwesome6
          name="plus"
          size={24}
          color={Theme.colors.textOnPrimary}
          solid
        />
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

// ==========================================================================
// Styles
// ==========================================================================

const styles = StyleSheet.create({
  // --- Layout ---
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },

  // --- Header ---
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.title,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
  },

  // --- Content sheet ---
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xxl,
    borderTopRightRadius: Theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },

  // --- Filters Container ---
  filtersContainer: {
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },

  // --- Summary Bar ---
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: Theme.typography.fontSize.large,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  summaryIncome: {
    color: Theme.colors.success,
  },
  summaryExpense: {
    color: Theme.colors.error,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },

  // --- Type Filter Tabs ---
  typeFilterRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Theme.shadows.small,
  },
  typeChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  typeChipText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  typeChipTextActive: {
    color: Theme.colors.white,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Search Bar ---
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightGrey,
    borderRadius: Theme.borderRadius.round,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    gap: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    paddingVertical: 0,
  },
  exportIconButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Date Range Picker trigger ---
  dateRangeTrigger: {
    alignSelf: 'flex-start',
  },

  // --- Profile Filter Chips ---
  profileChipsContainer: {
    gap: Theme.spacing.sm,
    paddingVertical: 2,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: Theme.spacing.xs + 2,
  },
  profileChipActive: {
    backgroundColor: Theme.colors.white,
    borderColor: Theme.colors.primary,
  },
  profileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileChipText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    maxWidth: 100,
  },
  profileChipTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Section label ---
  sectionLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginTop: Theme.spacing.xs,
  },

  // --- Loading overlay ---
  loadingOverlay: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // --- Empty state ---
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

  // --- Loading & error states ---
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

  // --- FAB ---
  fab: {
    position: 'absolute',
    right: Theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.large,
    elevation: 8,
  },
});

export default ExpenseDetailScreen;
