import React, { useState, useRef, useCallback } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { profileService } from '../../services/profileService';
import { categoryService } from '../../services/categoryService';
import type { Expense, PersonalExpensesResponse } from '../../types/expense';
import type { Profile } from '../../types/profile';
import type { Category } from '../../types/category';
import SwipeableExpenseItem from '../../components/SwipeableExpenseItem';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { formatCurrencyExact } from '../../utils/currency';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

// ---------------------------------------------------------------------------
// Date filter presets (inline chips — replaces DateRangePicker modal)
// ---------------------------------------------------------------------------

type DatePreset = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all';

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeRange(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case 'last_3_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'all':
      return { startDate: undefined, endDate: undefined };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All' },
];

type ExpenseDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'ExpenseDetail'>;

const PROFILE_COLORS = [
  '#D81B60', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

const getProfileColor = (profile: Profile, index: number): string => {
  return profile.color ?? PROFILE_COLORS[index % PROFILE_COLORS.length] ?? '#D81B60';
};

const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  // Read optional category param passed from navigation (e.g. from analytics or home)
  const routeCategory = route.params?.category ?? null;

  // Existing state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [openSwipeableId, setOpenSwipeableId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Summary state
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);
  const [profileFilter, setProfileFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(routeCategory);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');

  // Refs for debounce and keeping filter values current
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef({
    search: '',
    type: null as 'income' | 'expense' | null,
    profileId: null as string | null,
    category: routeCategory as string | null,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  // Guard: prevent overlapping expense fetches from piling up requests.
  const fetchInFlightRef = useRef(false);

  // Staleness check: track the last successful fetch time so that
  // useFocusEffect can skip redundant refetches when returning to the
  // screen within a short window (30 seconds).
  const lastFetchTimeRef = useRef<number>(0);
  const STALE_THRESHOLD_MS = 30_000; // 30 seconds

  // CSV export state
  const [exporting, setExporting] = useState(false);

  // -------------------------------------------------------------------
  // Unified fetch function
  // -------------------------------------------------------------------
  const fetchExpenses = useCallback(async (overrides?: {
    search?: string;
    type?: 'income' | 'expense' | null;
    profileId?: string | null;
    category?: string | null;
    startDate?: string;
    endDate?: string;
    /** When true, bypass the staleness check (used for active filter changes). */
    force?: boolean;
  }) => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    // --- In-flight guard ---
    // If a fetch is already running, skip this request to avoid 429s.
    if (fetchInFlightRef.current) {
      return;
    }

    // --- Staleness guard ---
    // When `force` is false (e.g. useFocusEffect re-focus), skip the fetch
    // if data was loaded less than 30 seconds ago to prevent duplicate requests.
    const force = overrides?.force ?? false;
    if (!force && Date.now() - lastFetchTimeRef.current < STALE_THRESHOLD_MS) {
      return;
    }

    const filters = {
      search: overrides?.search ?? filtersRef.current.search,
      type: overrides?.type !== undefined ? overrides.type : filtersRef.current.type,
      profileId: overrides?.profileId !== undefined ? overrides.profileId : filtersRef.current.profileId,
      category: overrides?.category !== undefined ? overrides.category : filtersRef.current.category,
      startDate: overrides?.startDate !== undefined ? overrides.startDate : filtersRef.current.startDate,
      endDate: overrides?.endDate !== undefined ? overrides.endDate : filtersRef.current.endDate,
    };

    // Update ref
    filtersRef.current = { ...filters };

    try {
      fetchInFlightRef.current = true;
      setLoading(true);
      setError(null);

      const apiFilters: Record<string, string> = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.type) apiFilters.type = filters.type;
      if (filters.profileId) apiFilters.profileId = filters.profileId;
      if (filters.category) apiFilters.category = filters.category;
      if (filters.startDate) apiFilters.startDate = filters.startDate;
      if (filters.endDate) apiFilters.endDate = filters.endDate;

      const response: PersonalExpensesResponse = await expenseService.getPersonalExpenses(
        1,
        50,
        accessToken,
        Object.keys(apiFilters).length > 0 ? apiFilters : undefined
      );

      if (response.success && response.data) {
        setExpenses(response.data.expenses);
        setTotalExpenseAmount(response.data.totalExpenseAmount);
        setTotalIncome(response.data.totalIncome);
        setTotalExpenses(response.data.totalExpenses);
        setBalance(response.data.balance);
      } else {
        throw new Error('Failed to fetch expenses');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching expenses';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      fetchInFlightRef.current = false;
      lastFetchTimeRef.current = Date.now();
      setLoading(false);
    }
  }, [accessToken]);

  const fetchProfiles = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await profileService.getProfiles(accessToken);
      if (response.success && response.data?.profiles) {
        setProfiles(response.data.profiles);
      }
    } catch (err) {
      console.warn('Failed to load profiles:', err);
    }
  }, [accessToken]);

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

  // --- Fix 2: Stagger API calls ---
  // Fetch lightweight data (profiles + categories) first, then fetch
  // the heavier expenses endpoint. This avoids all three hitting the
  // server at the same instant and triggering 429 rate limits.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        // 1. Lightweight lookups in parallel
        await Promise.all([fetchProfiles(), fetchCategories()]);

        // 2. Then fetch expenses (the heavy call)
        if (!cancelled) {
          await fetchExpenses();
        }
      };

      loadData();

      return () => {
        cancelled = true;
      };
    }, [fetchExpenses, fetchProfiles, fetchCategories])
  );

  // -------------------------------------------------------------------
  // Search with 400ms debounce
  // -------------------------------------------------------------------
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchExpenses({ search: text, force: true });
    }, 400);
  }, [fetchExpenses]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    fetchExpenses({ search: '', force: true });
  }, [fetchExpenses]);

  // -------------------------------------------------------------------
  // Type filter
  // -------------------------------------------------------------------
  const handleTypeFilterChange = useCallback((type: 'income' | 'expense' | null) => {
    setTypeFilter(type);
    fetchExpenses({ type, force: true });
  }, [fetchExpenses]);

  // -------------------------------------------------------------------
  // Profile filter
  // -------------------------------------------------------------------
  const handleProfileFilterChange = useCallback((profileId: string | null) => {
    setProfileFilter(profileId);
    fetchExpenses({ profileId, force: true });
  }, [fetchExpenses]);

  // -------------------------------------------------------------------
  // Category filter
  // -------------------------------------------------------------------
  const handleCategoryFilterChange = useCallback((category: string | null) => {
    setCategoryFilter(category);
    fetchExpenses({ category, force: true });
  }, [fetchExpenses]);

  // -------------------------------------------------------------------
  // Date range filter
  // -------------------------------------------------------------------
  const handleDateRangeChange = useCallback((newStartDate?: string, newEndDate?: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchExpenses({ startDate: newStartDate, endDate: newEndDate, force: true });
  }, [fetchExpenses]);

  const handleDatePresetChange = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    const range = computeRange(preset);
    handleDateRangeChange(range.startDate, range.endDate);
  }, [handleDateRangeChange]);

  // -------------------------------------------------------------------
  // CSV Export
  // -------------------------------------------------------------------
  const handleExportCSV = useCallback(async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export.');
      return;
    }

    setExporting(true);

    try {
      const header = 'Date,Title,Amount,Type,Category,Profile,Notes';

      const rows = expenses.map((exp) => {
        const date = new Date(exp.createdAt).toISOString().split('T')[0];
        const title = `"${(exp.title || '').replace(/"/g, '""')}"`;
        const amount = exp.amount.toFixed(2);
        const type = exp.type || 'expense';
        const category = `"${(exp.category || '').replace(/"/g, '""')}"`;
        const profile = profiles.find((p) => p._id === exp.profileId);
        const profileName = `"${(profile?.name || '').replace(/"/g, '""')}"`;
        const notes = `"${(exp.notes || '').replace(/"/g, '""')}"`;
        return `${date},${title},${amount},${type},${category},${profileName},${notes}`;
      });

      const csvString = [header, ...rows].join('\n');

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
  }, [expenses, profiles]);

  // -------------------------------------------------------------------
  // Existing helpers (formatDate, formatTime, formatAmount, etc.)
  // -------------------------------------------------------------------
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const utcTime = date.getTime();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(utcTime + istOffset);
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
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

  const handleConfirmDelete = async () => {
    if (!accessToken || !expenseToDelete) {
      return;
    }

    setDeleteLoading(true);

    const deletedExpense = expenses.find((exp) => exp._id === expenseToDelete.id);
    if (deletedExpense) {
      setExpenses((prevExpenses) => prevExpenses.filter((exp) => exp._id !== expenseToDelete.id));
      setTotalExpenseAmount((prevTotal) => prevTotal - deletedExpense.amount);
    }

    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    try {
      await expenseService.deleteExpense(expenseToDelete.id, accessToken);
      // Re-fetch to update summary values
      fetchExpenses({ force: true });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete expense';
      fetchExpenses({ force: true });
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
    if (!expense.profileId) return undefined;
    return profiles.find((p) => p._id === expense.profileId);
  };

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
            onPress={() => handleTypeFilterChange(null)}
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
            onPress={() => handleTypeFilterChange('expense')}
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
            onPress={() => handleTypeFilterChange('income')}
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

        {/* 4. Date Range Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateChipsContainer}
        >
          {DATE_PRESETS.map((preset) => {
            const isActive = datePreset === preset.key;
            return (
              <TouchableOpacity
                key={preset.key}
                style={[
                  styles.dateChip,
                  isActive && styles.dateChipActive,
                ]}
                onPress={() => handleDatePresetChange(preset.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateChipText,
                    isActive && styles.dateChipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
              onPress={() => handleProfileFilterChange(null)}
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
                  onPress={() => handleProfileFilterChange(profile._id)}
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
  if (loading && expenses.length === 0 && !searchText && !typeFilter && !profileFilter && !categoryFilter) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error && expenses.length === 0 && !searchText && !typeFilter && !profileFilter && !categoryFilter) {
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchExpenses({ force: true })}>
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
                  {searchText || typeFilter || profileFilter || categoryFilter || startDate
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

  // --- Date Range Chips ---
  dateChipsContainer: {
    gap: Theme.spacing.sm,
    paddingVertical: 2,
  },
  dateChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateChipActive: {
    backgroundColor: Theme.colors.white,
    borderColor: Theme.colors.primary,
  },
  dateChipText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  dateChipTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
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
