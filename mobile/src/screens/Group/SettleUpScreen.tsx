/**
 * Settle Up Screen
 * Shows who owes whom and allows recording settlements
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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Theme } from '../../constants/theme';
import { groupService } from '../../services/groupService';
import { formatCurrency } from '../../utils/currency';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type SettleUpScreenProps = NativeStackScreenProps<HomeStackParamList, 'SettleUp'>;

interface DebtEntry {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

const SettleUpScreen: React.FC<SettleUpScreenProps> = ({ navigation, route }) => {
  const { groupId, balances, members } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtEntry | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [notes, setNotes] = useState('');

  const currentUserId = user?.id || '';

  const getMemberName = (userId: string): string => {
    if (userId === currentUserId) return 'You';
    const member = members.find((m) => m.userId === userId);
    return member?.name || userId;
  };

  // Calculate simplified debts from balances
  // Negative balance = owes money, Positive balance = is owed money
  const calculateDebts = (): DebtEntry[] => {
    const debts: DebtEntry[] = [];
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, amount]) => {
      if (amount < 0) {
        debtors.push({ userId, amount: Math.abs(amount) });
      } else if (amount > 0) {
        creditors.push({ userId, amount });
      }
    });

    // Sort so largest debts/credits are matched first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Greedy matching
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]!;
      const creditor = creditors[j]!;
      const debtAmount = Math.min(debtor.amount, creditor.amount);
      if (debtAmount > 0.01) {
        debts.push({
          from: debtor.userId,
          fromName: getMemberName(debtor.userId),
          to: creditor.userId,
          toName: getMemberName(creditor.userId),
          amount: Math.round(debtAmount * 100) / 100,
        });
      }
      debtor.amount -= debtAmount;
      creditor.amount -= debtAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return debts;
  };

  const allDebts = calculateDebts();
  // Only show debts where the current user is the debtor (from),
  // since the server only allows settlements where paidBy === authenticated user
  const debts = allDebts.filter((debt) => debt.from === currentUserId);

  const handleSelectDebt = (debt: DebtEntry) => {
    setSelectedDebt(debt);
    setSettleAmount(debt.amount.toString());
    setNotes('');
  };

  const handleCancelSelection = () => {
    setSelectedDebt(null);
    setSettleAmount('');
    setNotes('');
  };

  const handleSettle = async () => {
    if (!selectedDebt) return;

    if (!settleAmount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountNum = parseFloat(settleAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }

    if (amountNum > selectedDebt.amount) {
      Alert.alert('Error', `Amount cannot exceed ${formatCurrency(selectedDebt.amount)}`);
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoading(true);
      const response = await groupService.createSettlement(
        groupId,
        {
          paidBy: selectedDebt.from,
          paidTo: selectedDebt.to,
          amount: amountNum,
          notes: notes.trim() || undefined,
        },
        accessToken
      );

      if (response.success) {
        Alert.alert('Success', 'Settlement recorded successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error('Failed to record settlement');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while recording the settlement';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderDebtCard = (debt: DebtEntry, index: number) => {
    const isSelected = selectedDebt?.from === debt.from && selectedDebt?.to === debt.to;

    return (
      <TouchableOpacity
        key={`${debt.from}-${debt.to}-${index}`}
        style={[styles.debtCard, isSelected && styles.debtCardSelected]}
        onPress={() => handleSelectDebt(debt)}
        activeOpacity={0.7}>
        <View style={styles.debtCardContent}>
          {/* From */}
          <View style={styles.debtPerson}>
            <View style={[styles.debtAvatar, { backgroundColor: `${Theme.colors.error}20` }]}>
              <Text style={[styles.debtAvatarText, { color: Theme.colors.error }]}>
                {debt.fromName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.debtPersonName} numberOfLines={1}>
              {debt.fromName}
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.debtArrowContainer}>
            <FontAwesome6
              name="arrow-right"
              size={14}
              color={Theme.colors.textTertiary}
              solid
            />
            <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
          </View>

          {/* To */}
          <View style={styles.debtPerson}>
            <View style={[styles.debtAvatar, { backgroundColor: `${Theme.colors.success}20` }]}>
              <Text style={[styles.debtAvatarText, { color: Theme.colors.success }]}>
                {debt.toName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.debtPersonName} numberOfLines={1}>
              {debt.toName}
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <FontAwesome6
              name="check-circle"
              size={16}
              color={Theme.colors.primary}
              solid
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Settle up</Text>
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

        {debts.length === 0 ? (
          <View style={styles.allSettledCard}>
            <FontAwesome6
              name="circle-check"
              size={48}
              color={Theme.colors.success}
              solid
            />
            <Text style={styles.allSettledTitle}>All settled up!</Text>
            <Text style={styles.allSettledSubtext}>
              No outstanding balances in this group
            </Text>
          </View>
        ) : (
          <>
            {/* Debts List */}
            <Text style={styles.sectionTitle}>Outstanding balances</Text>
            <Text style={styles.sectionSubtext}>
              Tap a balance to record a settlement
            </Text>
            <View style={styles.debtsList}>
              {debts.map((debt, index) => renderDebtCard(debt, index))}
            </View>

            {/* Settlement Form */}
            {selectedDebt && (
              <View style={styles.settlementForm}>
                <View style={styles.settlementHeader}>
                  <Text style={styles.settlementTitle}>Record settlement</Text>
                  <TouchableOpacity
                    onPress={handleCancelSelection}
                    activeOpacity={0.7}>
                    <FontAwesome6
                      name="xmark"
                      size={18}
                      color={Theme.colors.textSecondary}
                      solid
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.settlementDescription}>
                  {selectedDebt.fromName} pays {selectedDebt.toName}
                </Text>

                <Input
                  label="Amount"
                  placeholder={`Max ${formatCurrency(selectedDebt.amount)}`}
                  value={settleAmount}
                  onChangeText={(text) => {
                    let numericValue = text.replace(/[^0-9.]/g, '');
                    // Remove all but the first decimal point
                    const parts = numericValue.split('.');
                    if (parts.length > 2) {
                      numericValue = parts[0] + '.' + parts.slice(1).join('');
                    }
                    setSettleAmount(numericValue);
                  }}
                  keyboardType="decimal-pad"
                />

                <Input
                  label="Notes (Optional)"
                  placeholder="e.g. Paid via UPI"
                  value={notes}
                  onChangeText={setNotes}
                />

                <Button
                  title="Record Settlement"
                  onPress={handleSettle}
                  loading={loading}
                  style={styles.settleButton}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
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

  // All settled state
  allSettledCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    gap: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.shadows.small,
    marginTop: Theme.spacing.xl,
  },
  allSettledTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  allSettledSubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
  },

  // Section headers
  sectionTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
    marginBottom: Theme.spacing.xs,
  },
  sectionSubtext: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.md,
  },

  // Debts list
  debtsList: {
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  debtCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.shadows.small,
  },
  debtCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: `${Theme.colors.primary}05`,
  },
  debtCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtPerson: {
    alignItems: 'center',
    flex: 1,
    gap: Theme.spacing.xs,
  },
  debtAvatar: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtAvatarText: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  debtPersonName: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  debtArrowContainer: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  debtAmount: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Theme.spacing.sm,
    right: Theme.spacing.sm,
  },

  // Settlement form
  settlementForm: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.shadows.medium,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  settlementTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  settlementDescription: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.md,
  },
  settleButton: {
    marginTop: Theme.spacing.sm,
  },
});

export default SettleUpScreen;
