/**
 * Add Group Expense Screen
 * Form to create a new expense in a group with equal split
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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Theme } from '../../constants/theme';
import { groupService } from '../../services/groupService';
import { categoryService } from '../../services/categoryService';
import { formatCurrencyExact } from '../../utils/currency';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { Category } from '../../types/category';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaidByModal, setShowPaidByModal] = useState(false);

  // Paid by - default to current user
  const currentUserId = user?.id || '';
  const [paidBy, setPaidBy] = useState(currentUserId);

  // Split type: "equal" | "exact" | "percentage"
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');

  // Split between - default all members selected
  const [splitMembers, setSplitMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );

  // Exact split amounts per member (userId -> string value)
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // Percentage split per member (userId -> string value)
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    split?: string;
  }>({});

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!accessToken) return;
      try {
        const response = await categoryService.getCategories(accessToken);
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories.filter((c) => c.isActive));
        }
      } catch (err) {
        console.warn('Failed to load categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [accessToken]);

  const getPaidByName = (): string => {
    if (paidBy === currentUserId) return 'You';
    const member = members.find((m) => m.userId === paidBy);
    return member?.name || 'Select';
  };

  /**
   * Initial for the "Paid by" avatar.
   * When the selected payer is the current user we want the first letter of
   * their real name / email — NOT "Y" from the literal label "You".
   */
  const getPaidByInitial = (): string => {
    if (paidBy === currentUserId) {
      const source =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.email ||
        'You';
      return source.charAt(0).toUpperCase();
    }
    const member = members.find((m) => m.userId === paidBy);
    return (member?.name || 'M').charAt(0).toUpperCase();
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
    } else if (splitType === 'exact') {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum) && amountNum > 0) {
        const exactTotal = getExactTotal();
        if (Math.abs(exactTotal - amountNum) > 0.01) {
          newErrors.split = `Split amounts must equal the total. Currently ${formatCurrencyExact(exactTotal)} of ${formatCurrencyExact(amountNum)} allocated.`;
        }
      }
    } else if (splitType === 'percentage') {
      const pctTotal = getPercentageTotal();
      if (Math.abs(pctTotal - 100) > 0.01) {
        newErrors.split = `Percentages must add up to 100%. Currently ${pctTotal.toFixed(1)}% allocated.`;
      }
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
    const splitMemberIds = Array.from(splitMembers);

    let splitAmong: { userId: string; amount: number }[];

    if (splitType === 'exact') {
      splitAmong = splitMemberIds.map((userId) => ({
        userId,
        amount: Math.round(parseFloat(exactAmounts[userId] || '0') * 100) / 100,
      }));
    } else if (splitType === 'percentage') {
      // Convert percentages to amounts; assign rounding remainder to first member
      const rawAmounts = splitMemberIds.map((userId) => {
        const pct = parseFloat(percentages[userId] || '0');
        return Math.floor(((amountNum * pct) / 100) * 100) / 100;
      });
      const rawTotal = rawAmounts.reduce((s, a) => s + a, 0);
      const diff = Math.round((amountNum - rawTotal) * 100) / 100;
      splitAmong = splitMemberIds.map((userId, i) => ({
        userId,
        amount: i === 0 ? Math.round(((rawAmounts[i] ?? 0) + diff) * 100) / 100 : (rawAmounts[i] ?? 0),
      }));
    } else {
      // Equal split
      const splitCount = splitMembers.size;
      const baseAmount = Math.floor((amountNum / splitCount) * 100) / 100;
      const remainder = Math.round((amountNum - baseAmount * splitCount) * 100) / 100;
      splitAmong = splitMemberIds.map((userId, i) => ({
        userId,
        amount: i === 0 ? baseAmount + remainder : baseAmount,
      }));
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
        // Clean up custom amounts when deselecting
        setExactAmounts((ea) => {
          const n = { ...ea };
          delete n[userId];
          return n;
        });
        setPercentages((p) => {
          const n = { ...p };
          delete n[userId];
          return n;
        });
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
    if (errors.split) {
      setErrors({ ...errors, split: undefined });
    }
  };

  /** Handle exact amount input change for a member */
  const handleExactAmountChange = (userId: string, value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setExactAmounts((prev) => ({ ...prev, [userId]: cleaned }));
    if (errors.split) {
      setErrors({ ...errors, split: undefined });
    }
  };

  /** Handle percentage input change for a member */
  const handlePercentageChange = (userId: string, value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setPercentages((prev) => ({ ...prev, [userId]: cleaned }));
    if (errors.split) {
      setErrors({ ...errors, split: undefined });
    }
  };

  /** Calculate total of exact amounts for selected members */
  const getExactTotal = (): number => {
    return Array.from(splitMembers).reduce((sum, id) => {
      const val = parseFloat(exactAmounts[id] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  /** Calculate total percentage for selected members */
  const getPercentageTotal = (): number => {
    return Array.from(splitMembers).reduce((sum, id) => {
      const val = parseFloat(percentages[id] || '0');
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  /** Get amount from percentage for a member */
  const getAmountFromPercentage = (userId: string): number => {
    const total = parseFloat(amount);
    const pct = parseFloat(percentages[userId] || '0');
    if (isNaN(total) || isNaN(pct) || total <= 0) return 0;
    return Math.round(((total * pct) / 100) * 100) / 100;
  };

  const splitPerPerson = (): string => {
    if (!amount || splitMembers.size === 0) return formatCurrencyExact(0);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return formatCurrencyExact(0);
    const perPerson = Math.floor((amountNum / splitMembers.size) * 100) / 100;
    return formatCurrencyExact(perPerson);
  };

  const selectedCat = categories.find((c) => c.name === category);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
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
          { paddingBottom: insets.bottom + Theme.spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
              let numericValue = text.replace(/[^0-9.]/g, '');
              // Remove all but the first decimal point
              const parts = numericValue.split('.');
              if (parts.length > 2) {
                numericValue = parts[0] + '.' + parts.slice(1).join('');
              }
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
                  <View style={[styles.categoryEmojiCircle, selectedCat?.color ? { backgroundColor: selectedCat.color + '20' } : undefined]}>
                    <Text style={styles.categoryEmoji}>{selectedCat?.emoji || '📦'}</Text>
                  </View>
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
                  <Text style={styles.memberAvatarText}>{getPaidByInitial()}</Text>
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
            <Text style={styles.fieldLabel}>Split between</Text>
            <View style={styles.selectAllRow}>
              <TouchableOpacity
                style={[
                  styles.selectAllButton,
                  splitMembers.size === members.length && styles.selectAllButtonActive,
                ]}
                onPress={() => {
                  setSplitMembers(new Set(members.map((m) => m.userId)));
                  if (errors.split) setErrors({ ...errors, split: undefined });
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.selectAllButtonText,
                    splitMembers.size === members.length && styles.selectAllButtonTextActive,
                  ]}>
                  Select All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectAllButton,
                  splitMembers.size === 0 && styles.selectAllButtonActive,
                ]}
                onPress={() => {
                  setSplitMembers(new Set());
                  setExactAmounts({});
                  setPercentages({});
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.selectAllButtonText,
                    splitMembers.size === 0 && styles.selectAllButtonTextActive,
                  ]}>
                  Deselect All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Split type tabs */}
            <View style={styles.splitTypeTabs}>
              {(['equal', 'exact', 'percentage'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.splitTypeTab,
                    splitType === type && styles.splitTypeTabActive,
                  ]}
                  onPress={() => {
                    setSplitType(type);
                    if (errors.split) setErrors({ ...errors, split: undefined });
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.splitTypeTabText,
                      splitType === type && styles.splitTypeTabTextActive,
                    ]}>
                    {type === 'equal' ? 'Equal' : type === 'exact' ? 'Exact' : 'Percentage'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Equal mode info */}
            {splitType === 'equal' && (
              <View style={styles.splitHeader}>
                <Text style={styles.splitInfo}>
                  Equal split {'\u00B7'} {splitPerPerson()} each
                </Text>
              </View>
            )}

            {/* Allocation indicator for Exact mode */}
            {splitType === 'exact' && splitMembers.size > 0 && amount && parseFloat(amount) > 0 && (() => {
              const total = parseFloat(amount);
              const allocated = getExactTotal();
              const diff = Math.round((total - allocated) * 100) / 100;
              const isMatch = Math.abs(diff) <= 0.01;
              const isOver = diff < -0.01;
              const progressRatio = total > 0 ? Math.min(allocated / total, 1.5) : 0;
              return (
                <View
                  style={[
                    styles.allocationIndicator,
                    isMatch
                      ? styles.allocationOk
                      : isOver
                      ? styles.allocationError
                      : styles.allocationWarning,
                  ]}>
                  <Text
                    style={[
                      styles.allocationText,
                      isMatch
                        ? styles.allocationTextOk
                        : isOver
                        ? styles.allocationTextError
                        : styles.allocationTextWarning,
                    ]}>
                    {isMatch
                      ? `Remaining: ${formatCurrencyExact(0)}`
                      : isOver
                      ? `Over by: ${formatCurrencyExact(Math.abs(diff))}`
                      : `Remaining: ${formatCurrencyExact(diff)}`}
                  </Text>
                  <View style={styles.allocationBarTrack}>
                    <View
                      style={[
                        styles.allocationBarFill,
                        {
                          width: `${Math.min(progressRatio * 100, 100)}%`,
                          backgroundColor: isMatch
                            ? '#15803d'
                            : isOver
                            ? '#dc2626'
                            : '#15803d',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.allocationSubtext,
                      isMatch
                        ? styles.allocationTextOk
                        : isOver
                        ? styles.allocationTextError
                        : styles.allocationTextWarning,
                    ]}>
                    {formatCurrencyExact(allocated)} of {formatCurrencyExact(total)} allocated
                  </Text>
                </View>
              );
            })()}

            {/* Allocation indicator for Percentage mode */}
            {splitType === 'percentage' && splitMembers.size > 0 && (() => {
              const pctTotal = getPercentageTotal();
              const diff = Math.round((100 - pctTotal) * 100) / 100;
              const isMatch = Math.abs(diff) <= 0.01;
              const isOver = diff < -0.01;
              const progressRatio = Math.min(pctTotal / 100, 1.5);
              return (
                <View
                  style={[
                    styles.allocationIndicator,
                    isMatch
                      ? styles.allocationOk
                      : isOver
                      ? styles.allocationError
                      : styles.allocationWarning,
                  ]}>
                  <Text
                    style={[
                      styles.allocationText,
                      isMatch
                        ? styles.allocationTextOk
                        : isOver
                        ? styles.allocationTextError
                        : styles.allocationTextWarning,
                    ]}>
                    {pctTotal.toFixed(1)}% allocated
                  </Text>
                  <View style={styles.allocationBarTrack}>
                    <View
                      style={[
                        styles.allocationBarFill,
                        {
                          width: `${Math.min(progressRatio * 100, 100)}%`,
                          backgroundColor: isMatch
                            ? '#15803d'
                            : isOver
                            ? '#dc2626'
                            : '#b45309',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.allocationSubtext,
                      isMatch
                        ? styles.allocationTextOk
                        : isOver
                        ? styles.allocationTextError
                        : styles.allocationTextWarning,
                    ]}>
                    {isMatch
                      ? '100% of 100% allocated'
                      : isOver
                      ? `${Math.abs(diff).toFixed(1)}% over budget`
                      : `${diff.toFixed(1)}% remaining`}
                  </Text>
                </View>
              );
            })()}

            <View style={styles.splitMembersList}>
              {members.map((member, index) => {
                const isSelected = splitMembers.has(member.userId);
                const isCurrentUser = member.userId === currentUserId;
                const displayName = isCurrentUser ? 'You' : member.name;
                const isLast = index === members.length - 1;

                return (
                  <View key={member.userId}>
                    <TouchableOpacity
                      style={[
                        styles.splitMemberRow,
                        isLast && styles.splitMemberRowLast,
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

                      {/* Equal mode: show per-person amount */}
                      {splitType === 'equal' &&
                        isSelected &&
                        amount &&
                        parseFloat(amount) > 0 &&
                        splitMembers.size > 0 && (
                          <Text style={styles.splitMemberAmount}>{splitPerPerson()}</Text>
                        )}

                      {/* Exact mode: show amount input */}
                      {splitType === 'exact' && isSelected && (
                        <View style={styles.splitInputGroup}>
                          <Text style={styles.splitInputPrefix}>{'\u20B9'}</Text>
                          <TextInput
                            style={styles.splitInlineInput}
                            placeholder="0.00"
                            placeholderTextColor={Theme.colors.textTertiary}
                            value={exactAmounts[member.userId] || ''}
                            onChangeText={(text) => handleExactAmountChange(member.userId, text)}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      )}

                      {/* Percentage mode: show percentage input + calculated amount */}
                      {splitType === 'percentage' && isSelected && (
                        <View style={styles.splitInputGroup}>
                          <TextInput
                            style={styles.splitInlineInput}
                            placeholder="0"
                            placeholderTextColor={Theme.colors.textTertiary}
                            value={percentages[member.userId] || ''}
                            onChangeText={(text) => handlePercentageChange(member.userId, text)}
                            keyboardType="decimal-pad"
                          />
                          <Text style={styles.splitInputSuffix}>%</Text>
                          {getAmountFromPercentage(member.userId) > 0 && (
                            <Text style={styles.splitInputCalculated}>
                              ({formatCurrencyExact(getAmountFromPercentage(member.userId))})
                            </Text>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
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
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat.name)}
                    activeOpacity={0.7}>
                    <View style={styles.modalItemContent}>
                      <View
                        style={[
                          styles.modalItemIcon,
                          { backgroundColor: isSelected ? cat.color : (cat.color + '20') },
                        ]}>
                        <Text style={styles.modalItemEmoji}>{cat.emoji}</Text>
                      </View>
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected && styles.modalItemTextSelected,
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
                          {(member.name || 'M').charAt(0).toUpperCase()}
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
    backgroundColor: Theme.colors.primary,
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

  // Split type tabs
  splitTypeTabs: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  splitTypeTab: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs + 2,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitTypeTabActive: {
    backgroundColor: Theme.colors.primary,
  },
  splitTypeTabText: {
    fontSize: Theme.typography.fontSize.small,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    color: Theme.colors.textSecondary,
  },
  splitTypeTabTextActive: {
    color: Theme.colors.white,
  },

  // Select All / Deselect All
  selectAllRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  selectAllButton: {
    paddingHorizontal: Theme.spacing.sm + 2,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  selectAllButtonActive: {
    backgroundColor: Theme.colors.primary + '15',
    borderColor: Theme.colors.primary + '40',
  },
  selectAllButtonText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    color: Theme.colors.textSecondary,
  },
  selectAllButtonTextActive: {
    color: Theme.colors.primary,
  },

  // Allocation indicator
  allocationIndicator: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    alignItems: 'center',
    gap: 6,
  },
  allocationOk: {
    backgroundColor: '#f0fdf4',
  },
  allocationWarning: {
    backgroundColor: '#fffbeb',
  },
  allocationError: {
    backgroundColor: '#fef2f2',
  },
  allocationText: {
    fontSize: Theme.typography.fontSize.small,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  allocationTextOk: {
    color: '#15803d',
  },
  allocationTextWarning: {
    color: '#b45309',
  },
  allocationTextError: {
    color: '#dc2626',
  },
  allocationBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  allocationBarFill: {
    height: 6,
    borderRadius: 3,
  },
  allocationSubtext: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },

  // Inline split inputs
  splitInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  splitInputPrefix: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  splitInputSuffix: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  splitInlineInput: {
    width: 80,
    minHeight: 44,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.white,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: Theme.borderRadius.sm,
    textAlign: 'right',
  },
  splitInputCalculated: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8C8C8',
  },
  splitMemberRowLast: {
    borderBottomWidth: 0,
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
  modalItemEmoji: {
    fontSize: 18,
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
