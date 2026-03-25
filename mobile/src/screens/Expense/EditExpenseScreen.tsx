/**
 * Edit Expense Screen
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Theme } from '../../constants/theme';
import { expenseService } from '../../services/expenseService';
import { profileService } from '../../services/profileService';
import { categoryService } from '../../services/categoryService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { Profile } from '../../types/profile';
import type { Category } from '../../types/category';

type EditExpenseScreenProps = NativeStackScreenProps<HomeStackParamList, 'EditExpense'>;

export const EditExpenseScreen: React.FC<EditExpenseScreenProps> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [fetchingExpense, setFetchingExpense] = useState(true);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
  }>({});

  // Fetch expense data and profiles on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      try {
        setFetchingExpense(true);

        // Fetch expense, profiles, and categories in parallel
        const [expenseResponse, profilesResponse, categoriesResponse] = await Promise.all([
          expenseService.getExpense(expenseId, accessToken),
          profileService.getProfiles(accessToken),
          categoryService.getCategories(accessToken).catch(() => ({ success: false, data: { categories: [] } })),
        ]);

        // Populate form with expense data
        if (expenseResponse.success && expenseResponse.data) {
          const expense = expenseResponse.data;
          setTitle(expense.title);
          setAmount(String(expense.amount));
          setCategory(expense.category ?? '');
          setNotes(expense.notes ?? '');
          setSelectedProfileId(expense.profileId ?? '');
        } else {
          throw new Error('Failed to load expense');
        }

        // Set profiles
        if (profilesResponse.success && profilesResponse.data?.profiles) {
          setProfiles(profilesResponse.data.profiles);
        }

        // Set categories
        if (categoriesResponse.success && categoriesResponse.data?.categories) {
          setCategories(categoriesResponse.data.categories.filter((c) => c.isActive));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred while loading expense';
        Alert.alert('Error', errorMessage, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setFetchingExpense(false);
      }
    };

    fetchData();
  }, [accessToken, expenseId]);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; amount?: string; category?: string } = {};

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

    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateExpense = async () => {
    if (!validateForm()) {
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        title: title.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        notes: notes.trim() || undefined,
        profileId: selectedProfileId || undefined,
      };

      const response = await expenseService.updateExpense(expenseId, expenseData, accessToken);

      if (response.success) {
        Alert.alert('Success', 'Expense updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error('Failed to update expense');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while updating expense';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
    // Clear category error when selected
    if (errors.category) {
      setErrors({ ...errors, category: undefined });
    }
  };

  const selectedCat = categories.find((c) => c.name === category);

  if (fetchingExpense) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
        <Text style={styles.loadingText}>Loading expense...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

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
        <Text style={styles.headerTitle}>Edit expense</Text>
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
          {/* Profile Selector */}
          {profiles.length > 0 && (
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
            placeholder="Enter expense title"
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

          {/* Category Picker */}
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
                  <View style={[styles.categoryEmojiCircle, selectedCat?.color ? { backgroundColor: selectedCat.color + '20' } : undefined]}>
                    <Text style={styles.categoryEmoji}>{selectedCat?.emoji || '📦'}</Text>
                  </View>
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

          {/* Update Button */}
          <Button
            title="Update Expense"
            onPress={handleUpdateExpense}
            loading={loading}
            style={styles.updateButton}
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
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat.name)}
                    activeOpacity={0.7}>
                    <View style={styles.categoryItemContent}>
                      <View
                        style={[
                          styles.categoryItemIcon,
                          { backgroundColor: isSelected ? cat.color : (cat.color + '20') },
                        ]}>
                        <Text style={styles.categoryItemEmoji}>{cat.emoji}</Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryItemText,
                          isSelected && styles.categoryItemTextSelected,
                        ]}>
                        {cat.name}
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
    </KeyboardAvoidingView>
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
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.md,
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
  categoryEmojiCircle: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 16,
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
  notesInput: {
    minHeight: 100,
    paddingTop: Theme.spacing.md,
  },
  updateButton: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
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
  categoryItemEmoji: {
    fontSize: 18,
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
});

export default EditExpenseScreen;
