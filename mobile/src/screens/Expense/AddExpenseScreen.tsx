/**
 * Add Expense Screen
 */

import React, { useState } from 'react';
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
import { getCategoryIcon } from '../../utils/categoryIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type AddExpenseScreenProps = NativeStackScreenProps<MainStackParamList, 'AddExpense'>;

// Available categories
const CATEGORIES = [
  'Food',
  'Accessory',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Groceries',
  'Healthcare',
  'Education',
  'Travel',
  'Utilities',
  'Clothing',
  'Restaurant',
  'Gas',
  'Insurance',
  'Rent',
  'Other',
];

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
  }>({});

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

  const handleAddExpense = async () => {
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
      };

      const response = await expenseService.createExpense(expenseData, accessToken);

      if (response.success) {
        Alert.alert('Success', 'Expense added successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while adding expense';
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

  const selectedCategoryIcon = category ? getCategoryIcon(category) : 'receipt';

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
        <Text style={styles.headerTitle}>Add expense</Text>
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
              // Allow only numbers and decimal point
              const numericValue = text.replace(/[^0-9.]/g, '');
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

          {/* Add Button */}
          <Button
            title="Add Expense"
            onPress={handleAddExpense}
            loading={loading}
            style={styles.addButton}
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
  notesInput: {
    minHeight: 100,
    paddingTop: Theme.spacing.md,
  },
  addButton: {
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
});

export default AddExpenseScreen;
