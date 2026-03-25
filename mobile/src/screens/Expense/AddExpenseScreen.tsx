/**
 * Add Expense / Income Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { profileService } from '../../services/profileService';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { CATEGORIES } from '../../constants/categories';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { Profile } from '../../types/profile';

type AddExpenseScreenProps = NativeStackScreenProps<HomeStackParamList, 'AddExpense'>;

const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Rental',
  'Other',
] as const;

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

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ navigation, route }) => {
  const routeProfileId = route.params?.profileId;
  const routeType = route.params?.type ?? 'expense';
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>(routeType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    source?: string;
  }>({});

  const isIncome = type === 'income';
  const accentColor = isIncome ? '#10B981' : Theme.colors.primary;

  // Fetch profiles on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!accessToken) return;
      try {
        const response = await profileService.getProfiles(accessToken);
        if (response.success && response.data?.profiles) {
          const fetchedProfiles = response.data.profiles;
          setProfiles(fetchedProfiles);
          // Pre-select the route profile if provided, otherwise the default profile
          if (routeProfileId && fetchedProfiles.some((p) => p._id === routeProfileId)) {
            setSelectedProfileId(routeProfileId);
          } else {
            const defaultProfile = fetchedProfiles.find((p) => p.isDefault);
            if (defaultProfile) {
              setSelectedProfileId(defaultProfile._id);
            }
          }
        }
      } catch (err) {
        // Silently fail -- profile selection is optional
        console.warn('Failed to load profiles:', err);
      }
    };

    fetchProfiles();
  }, [accessToken]);

  // Clear type-specific fields when switching type
  const handleTypeSwitch = (newType: 'expense' | 'income') => {
    if (newType === type) return;
    setType(newType);
    setCategory('');
    setSource('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; amount?: string; category?: string; source?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (isIncome) {
      if (!source.trim()) {
        newErrors.source = 'Source is required';
      }
    } else {
      if (!category.trim()) {
        newErrors.category = 'Category is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoading(true);
      const expenseData: any = {
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        notes: notes.trim() || undefined,
      };

      if (isIncome) {
        expenseData.source = source.trim();
      } else {
        expenseData.category = category.trim();
        expenseData.profileId = selectedProfileId || undefined;
      }

      const response = await expenseService.createExpense(expenseData, accessToken);

      if (response.success) {
        const successLabel = isIncome ? 'Income' : 'Expense';
        Alert.alert('Success', `${successLabel} added successfully`, [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error(`Failed to add ${isIncome ? 'income' : 'expense'}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `An error occurred while adding ${isIncome ? 'income' : 'expense'}`;
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
    if (errors.category) {
      setErrors({ ...errors, category: undefined });
    }
  };

  const handleSourceSelect = (selectedSource: string) => {
    setSource(selectedSource);
    setShowSourceModal(false);
    if (errors.source) {
      setErrors({ ...errors, source: undefined });
    }
  };

  const selectedCategoryIcon = category ? getCategoryIcon(category) : 'receipt';
  const selectedSourceIcon = source ? getSourceIcon(source) : 'money-bill';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: accentColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <StatusBar barStyle="light-content" backgroundColor={accentColor} />

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
        <Text style={styles.headerTitle}>
          {isIncome ? 'Add Income' : 'Add Expense'}
        </Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Theme.spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Type Toggle */}
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                !isIncome && styles.typeToggleButtonActive,
                !isIncome && { backgroundColor: Theme.colors.primary },
              ]}
              onPress={() => handleTypeSwitch('expense')}
              activeOpacity={0.7}>
              <FontAwesome6
                name="arrow-trend-down"
                size={14}
                color={!isIncome ? Theme.colors.white : Theme.colors.textSecondary}
                solid
              />
              <Text
                style={[
                  styles.typeToggleText,
                  !isIncome && styles.typeToggleTextActive,
                ]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                isIncome && styles.typeToggleButtonActive,
                isIncome && { backgroundColor: '#10B981' },
              ]}
              onPress={() => handleTypeSwitch('income')}
              activeOpacity={0.7}>
              <FontAwesome6
                name="arrow-trend-up"
                size={14}
                color={isIncome ? Theme.colors.white : Theme.colors.textSecondary}
                solid
              />
              <Text
                style={[
                  styles.typeToggleText,
                  isIncome && styles.typeToggleTextActive,
                ]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Selector (only for expenses) */}
          {!isIncome && profiles.length > 0 && (
            <View style={styles.profileContainer}>
              <Text style={styles.profileLabel}>Profile</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.profileChipsRow}>
                {profiles.map((profile) => {
                  const isSelected = selectedProfileId === profile._id;
                  return (
                    <TouchableOpacity
                      key={profile._id}
                      style={[
                        styles.profileChip,
                        isSelected && styles.profileChipSelected,
                      ]}
                      onPress={() => setSelectedProfileId(profile._id)}
                      activeOpacity={0.7}>
                      <View
                        style={[
                          styles.profileColorDot,
                          { backgroundColor: profile.color || Theme.colors.grey },
                        ]}
                      />
                      <Text
                        style={[
                          styles.profileChipText,
                          isSelected && styles.profileChipTextSelected,
                        ]}>
                        {profile.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Title Input */}
          <Input
            label="Title"
            placeholder={isIncome ? 'Enter income title' : 'Enter expense title'}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                setErrors({ ...errors, title: undefined });
              }
            }}
            error={errors.title}
            autoCapitalize="words"
          />

          {/* Amount Input */}
          <Input
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChangeText={(text) => {
              // Allow only numbers and a single decimal point
              let numericValue = text.replace(/[^0-9.]/g, '');
              // Remove all but the first decimal point
              const parts = numericValue.split('.');
              if (parts.length > 2) {
                numericValue = parts[0] + '.' + parts.slice(1).join('');
              }
              setAmount(numericValue);
              if (errors.amount) {
                setErrors({ ...errors, amount: undefined });
              }
            }}
            error={errors.amount}
            keyboardType="decimal-pad"
          />

          {/* Category Picker (expense only) */}
          {!isIncome && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.categoryPicker,
                  errors.category && styles.categoryPickerError,
                ]}
                onPress={() => setShowCategoryModal(true)}
                activeOpacity={0.7}>
                {category ? (
                  <View style={styles.categorySelected}>
                    <FontAwesome6
                      name={selectedCategoryIcon as any}
                      size={18}
                      color={Theme.colors.primary}
                      solid
                    />
                    <Text style={styles.categorySelectedText}>{category}</Text>
                  </View>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Select category</Text>
                )}
                <FontAwesome6
                  name="chevron-down"
                  size={16}
                  color={Theme.colors.textSecondary}
                  solid
                />
              </TouchableOpacity>
              {errors.category && (
                <Text style={styles.categoryErrorText}>{errors.category}</Text>
              )}
            </View>
          )}

          {/* Source Picker (income only) */}
          {isIncome && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Source</Text>
              <TouchableOpacity
                style={[
                  styles.categoryPicker,
                  errors.source && styles.categoryPickerError,
                ]}
                onPress={() => setShowSourceModal(true)}
                activeOpacity={0.7}>
                {source ? (
                  <View style={styles.categorySelected}>
                    <FontAwesome6
                      name={selectedSourceIcon as any}
                      size={18}
                      color="#10B981"
                      solid
                    />
                    <Text style={styles.categorySelectedText}>{source}</Text>
                  </View>
                ) : (
                  <Text style={styles.categoryPlaceholder}>Select source</Text>
                )}
                <FontAwesome6
                  name="chevron-down"
                  size={16}
                  color={Theme.colors.textSecondary}
                  solid
                />
              </TouchableOpacity>
              {errors.source && (
                <Text style={styles.categoryErrorText}>{errors.source}</Text>
              )}
            </View>
          )}

          {/* Notes Input */}
          <Input
            label="Notes (Optional)"
            placeholder="Add any additional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.notesInput}
          />

          {/* Submit Button */}
          <Button
            title={isIncome ? 'Add Income' : 'Add Expense'}
            onPress={handleSubmit}
            loading={loading}
            style={[styles.addButton, isIncome && styles.addIncomeButtonStyle]}
          />
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                activeOpacity={0.7}>
                <FontAwesome6
                  name="xmark"
                  size={20}
                  color={Theme.colors.textPrimary}
                  solid
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => {
                const icon = getCategoryIcon(cat);
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.7}>
                    <View style={styles.categoryItemContent}>
                      <View
                        style={[
                          styles.categoryItemIcon,
                          isSelected && styles.categoryItemIconSelected,
                        ]}>
                        <FontAwesome6
                          name={icon as any}
                          size={18}
                          color={isSelected ? Theme.colors.textOnPrimary : Theme.colors.primary}
                          solid
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryItemText,
                          isSelected && styles.categoryItemTextSelected,
                        ]}>
                        {cat}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome6
                        name="check"
                        size={18}
                        color={Theme.colors.primary}
                        solid
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Source Modal */}
      <Modal
        visible={showSourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSourceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Source</Text>
              <TouchableOpacity
                onPress={() => setShowSourceModal(false)}
                activeOpacity={0.7}>
                <FontAwesome6
                  name="xmark"
                  size={20}
                  color={Theme.colors.textPrimary}
                  solid
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}>
              {INCOME_SOURCES.map((src) => {
                const icon = getSourceIcon(src);
                const isSelected = source === src;
                return (
                  <TouchableOpacity
                    key={src}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.sourceItemSelected,
                    ]}
                    onPress={() => handleSourceSelect(src)}
                    activeOpacity={0.7}>
                    <View style={styles.categoryItemContent}>
                      <View
                        style={[
                          styles.sourceItemIcon,
                          isSelected && styles.sourceItemIconSelected,
                        ]}>
                        <FontAwesome6
                          name={icon as any}
                          size={18}
                          color={isSelected ? Theme.colors.textOnPrimary : '#10B981'}
                          solid
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryItemText,
                          isSelected && styles.sourceItemTextSelected,
                        ]}>
                        {src}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome6
                        name="check"
                        size={18}
                        color="#10B981"
                        solid
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  form: {
    flex: 1,
  },

  // --- Type Toggle ---
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.lightGrey,
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
    marginBottom: Theme.spacing.lg,
  },
  typeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.xs,
    minHeight: 44,
  },
  typeToggleButtonActive: {
    ...Theme.shadows.small,
  },
  typeToggleText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  typeToggleTextActive: {
    color: Theme.colors.white,
    fontWeight: Theme.typography.fontWeight.bold,
  },

  // --- Profile ---
  profileContainer: {
    marginBottom: Theme.spacing.md,
  },
  profileLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  profileChipsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    backgroundColor: Theme.colors.white,
    gap: Theme.spacing.sm,
  },
  profileChipSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight + '20',
  },
  profileColorDot: {
    width: 10,
    height: 10,
    borderRadius: Theme.borderRadius.round,
  },
  profileChipText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  profileChipTextSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Category / Source Picker ---
  categoryContainer: {
    marginBottom: Theme.spacing.md,
  },
  categoryLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    minHeight: 50,
  },
  categoryPickerError: {
    borderColor: Theme.colors.error,
  },
  categorySelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  categorySelectedText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
  },
  categoryPlaceholder: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },
  categoryErrorText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.xs,
  },

  // --- Notes & Button ---
  notesInput: {
    minHeight: 100,
    paddingTop: Theme.spacing.md,
  },
  addButton: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  addIncomeButtonStyle: {
    backgroundColor: '#10B981',
  },

  // --- Modals ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    maxHeight: '70%',
    ...Theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGrey,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  categoryList: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
  },
  categoryItemSelected: {
    backgroundColor: Theme.colors.lightGrey,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  categoryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItemIconSelected: {
    backgroundColor: Theme.colors.primary,
  },
  categoryItemText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  categoryItemTextSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Source Modal Items ---
  sourceItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  sourceItemIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceItemIconSelected: {
    backgroundColor: '#10B981',
  },
  sourceItemTextSelected: {
    color: '#10B981',
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default AddExpenseScreen;
