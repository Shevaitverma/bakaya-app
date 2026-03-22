/**
 * Add Group Expense Screen
 * Form to create a new expense in a group with equal split
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
import { groupService } from '../../services/groupService';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { CATEGORIES } from '../../constants/categories';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type AddGroupExpenseScreenProps = NativeStackScreenProps<HomeStackParamList, 'AddGroupExpense'>;

const AddGroupExpenseScreen: React.FC<AddGroupExpenseScreenProps> = ({ navigation, route }) => {
  const { groupId, members } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaidByModal, setShowPaidByModal] = useState(false);

  // Paid by - default to current user
  const currentUserId = user?.id || '';
  const [paidBy, setPaidBy] = useState(currentUserId);

  // Split between - default all members selected
  const [splitMembers, setSplitMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );

  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    split?: string;
  }>({});

  const getPaidByName = (): string => {
    if (paidBy === currentUserId) return 'You';
    const member = members.find((m) => m.userId === paidBy);
    return member?.name || 'Select';
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; amount?: string; category?: string; split?: string } = {};

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

    if (splitMembers.size < 1) {
      newErrors.split = 'Select at least one member to split with';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) return;

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const amountNum = parseFloat(amount);
    const splitCount = splitMembers.size;
    const perPersonAmount = Math.round((amountNum / splitCount) * 100) / 100;

    // Build splitAmong array
    const splitAmong = Array.from(splitMembers).map((userId) => ({
      userId,
      amount: perPersonAmount,
    }));

    // Adjust rounding difference on first person
    const totalSplit = splitAmong.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.round((amountNum - totalSplit) * 100) / 100;
    const firstEntry = splitAmong[0];
    if (diff !== 0 && firstEntry) {
      firstEntry.amount = Math.round((firstEntry.amount + diff) * 100) / 100;
    }

    try {
      setLoading(true);
      const response = await groupService.createGroupExpense(
        groupId,
        {
          title: title.trim(),
          amount: amountNum,
          category: category.trim(),
          notes: notes.trim() || undefined,
          paidBy,
          splitAmong,
        },
        accessToken
      );

      if (response.success) {
        Alert.alert('Success', 'Group expense added successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error('Failed to add group expense');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while adding the expense';
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

  const handlePaidBySelect = (userId: string) => {
    setPaidBy(userId);
    setShowPaidByModal(false);
  };

  const toggleSplitMember = (userId: string) => {
    setSplitMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
    if (errors.split) {
      setErrors({ ...errors, split: undefined });
    }
  };

  const splitPerPerson = (): string => {
    if (!amount || splitMembers.size === 0) return '\u20B90.00';
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return '\u20B90.00';
    const perPerson = amountNum / splitMembers.size;
    return `\u20B9${perPerson.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <Text style={styles.headerTitle}>Add group expense</Text>
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
              if (errors.title) setErrors({ ...errors, title: undefined });
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
              const numericValue = text.replace(/[^0-9.]/g, '');
              setAmount(numericValue);
              if (errors.amount) setErrors({ ...errors, amount: undefined });
            }}
            error={errors.amount}
            keyboardType="decimal-pad"
          />

          {/* Category Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                errors.category && styles.pickerButtonError,
              ]}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}>
              {category ? (
                <View style={styles.pickerSelected}>
                  <FontAwesome6
                    name={selectedCategoryIcon as any}
                    size={18}
                    color={Theme.colors.primary}
                    solid
                  />
                  <Text style={styles.pickerSelectedText}>{category}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Select category</Text>
              )}
              <FontAwesome6
                name="chevron-down"
                size={16}
                color={Theme.colors.textSecondary}
                solid
              />
            </TouchableOpacity>
            {errors.category && (
              <Text style={styles.fieldErrorText}>{errors.category}</Text>
            )}
          </View>

          {/* Paid By Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Paid by</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPaidByModal(true)}
              activeOpacity={0.7}>
              <View style={styles.pickerSelected}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {getPaidByName().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pickerSelectedText}>{getPaidByName()}</Text>
              </View>
              <FontAwesome6
                name="chevron-down"
                size={16}
                color={Theme.colors.textSecondary}
                solid
              />
            </TouchableOpacity>
          </View>

          {/* Split Between */}
          <View style={styles.fieldContainer}>
            <View style={styles.splitHeader}>
              <Text style={styles.fieldLabel}>Split between</Text>
              <Text style={styles.splitInfo}>
                Equal split {'\u00B7'} {splitPerPerson()} each
              </Text>
            </View>
            <View style={styles.splitMembersList}>
              {members.map((member) => {
                const isSelected = splitMembers.has(member.userId);
                const isCurrentUser = member.userId === currentUserId;
                const displayName = isCurrentUser ? 'You' : member.name;

                return (
                  <TouchableOpacity
                    key={member.userId}
                    style={[
                      styles.splitMemberRow,
                      isSelected && styles.splitMemberRowSelected,
                    ]}
                    onPress={() => toggleSplitMember(member.userId)}
                    activeOpacity={0.7}>
                    <View style={styles.splitMemberInfo}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}>
                        {isSelected && (
                          <FontAwesome6
                            name="check"
                            size={10}
                            color={Theme.colors.white}
                            solid
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.splitMemberName,
                          isSelected && styles.splitMemberNameSelected,
                        ]}>
                        {displayName}
                      </Text>
                    </View>
                    {isSelected && amount && parseFloat(amount) > 0 && splitMembers.size > 0 && (
                      <Text style={styles.splitMemberAmount}>
                        {splitPerPerson()}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.split && (
              <Text style={styles.fieldErrorText}>{errors.split}</Text>
            )}
          </View>

          {/* Notes Input */}
          <Input
            label="Notes (Optional)"
            placeholder="Add any additional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.notesInput}
          />

          {/* Add Button */}
          <Button
            title="Add Group Expense"
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
              style={styles.modalList}
              showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => {
                const icon = getCategoryIcon(cat);
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.7}>
                    <View style={styles.modalItemContent}>
                      <View
                        style={[
                          styles.modalItemIcon,
                          isSelected && styles.modalItemIconSelected,
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
                          styles.modalItemText,
                          isSelected && styles.modalItemTextSelected,
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

      {/* Paid By Modal */}
      <Modal
        visible={showPaidByModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaidByModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who paid?</Text>
              <TouchableOpacity
                onPress={() => setShowPaidByModal(false)}
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
              style={styles.modalList}
              showsVerticalScrollIndicator={false}>
              {members.map((member) => {
                const isSelected = paidBy === member.userId;
                const isCurrentUser = member.userId === currentUserId;
                const displayName = isCurrentUser ? `You (${member.name})` : member.name;

                return (
                  <TouchableOpacity
                    key={member.userId}
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                    ]}
                    onPress={() => handlePaidBySelect(member.userId)}
                    activeOpacity={0.7}>
                    <View style={styles.modalItemContent}>
                      <View
                        style={[
                          styles.paidByAvatar,
                          isSelected && styles.paidByAvatarSelected,
                        ]}>
                        <Text
                          style={[
                            styles.paidByAvatarText,
                            isSelected && styles.paidByAvatarTextSelected,
                          ]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected && styles.modalItemTextSelected,
                        ]}>
                        {displayName}
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
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
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

  // Field containers
  fieldContainer: {
    marginBottom: Theme.spacing.md,
  },
  fieldLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  fieldErrorText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    marginTop: Theme.spacing.xs,
  },

  // Picker buttons
  pickerButton: {
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
  pickerButtonError: {
    borderColor: Theme.colors.error,
  },
  pickerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  pickerSelectedText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
  },
  pickerPlaceholder: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },

  // Member avatar
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },

  // Split section
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  splitInfo: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  splitMembersList: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
  },
  splitMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  splitMemberRowSelected: {
    backgroundColor: `${Theme.colors.primary}08`,
  },
  splitMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Theme.borderRadius.xs,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  splitMemberName: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  splitMemberNameSelected: {
    fontWeight: Theme.typography.fontWeight.semibold,
    color: Theme.colors.primary,
  },
  splitMemberAmount: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },

  // Notes & button
  notesInput: {
    minHeight: 80,
    paddingTop: Theme.spacing.md,
  },
  addButton: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },

  // Modals
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
  modalList: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
  },
  modalItemSelected: {
    backgroundColor: Theme.colors.lightGrey,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  modalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemIconSelected: {
    backgroundColor: Theme.colors.primary,
  },
  modalItemText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  modalItemTextSelected: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // Paid by avatar in modal
  paidByAvatar: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidByAvatarSelected: {
    backgroundColor: Theme.colors.primary,
  },
  paidByAvatarText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  paidByAvatarTextSelected: {
    color: Theme.colors.white,
  },
});

export default AddGroupExpenseScreen;
