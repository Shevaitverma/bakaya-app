/**
 * Settle Up Screen
 * Shows who owes whom and allows recording settlements
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
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
  const { groupId, members } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const [fetchLoading, setFetchLoading] = useState(true);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtEntry | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [notes, setNotes] = useState('');

  const currentUserId = user?.id || '';

  const getMemberName = useCallback((userId: string): string => {
    if (userId === currentUserId) return 'You';
    const member = members.find((m) => m.userId === userId);
    return member?.name || 'Unknown member';
  }, [currentUserId, members]);

  // The server computes the whole group's settlement plan (every pair, both
  // directions) — we just name the people in it.
  useEffect(() => {
    const fetchTransfers = async () => {
      // Guard inside the try so `finally` always clears the spinner.
      try {
        if (!accessToken) return;
        const response = await groupService.getSuggestedTransfers(groupId, accessToken);
        if (response.success && response.data) {
          setDebts(
            response.data.transfers.map((t) => ({
              from: t.from,
              fromName: getMemberName(t.from),
              to: t.to,
              toName: getMemberName(t.to),
              amount: t.amount,
            }))
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load the settlement plan';
        Alert.alert('Error', errorMessage);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTransfers();
  }, [accessToken, groupId, getMemberName]);

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
    // Only the current user's own debts can be settled — the server rejects
    // settlements where paidBy is not the authenticated user.
    const isMine = debt.from === currentUserId;

    return (
      <TouchableOpacity
        key={`${debt.from}-${debt.to}-${index}`}
        style={[
          styles.debtCard,
          isMine ? styles.debtCardMine : styles.debtCardOther,
          isSelected && styles.debtCardSelected,
        ]}
        onPress={() => handleSelectDebt(debt)}
        disabled={!isMine}
        activeOpacity={0.7}>
        {isMine && <Text style={styles.debtCardBadge}>You pay</Text>}
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

        {fetchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : debts.length === 0 ? (
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
            <Text style={styles.sectionTitle}>Suggested transfers</Text>
            <Text style={styles.sectionSubtext}>
              The whole group's plan. Tap one marked "You pay" to record a settlement.
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

  loadingContainer: {
    paddingVertical: Theme.spacing.xxxl,
    alignItems: 'center',
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
  debtCardMine: {
    borderColor: `${Theme.colors.primary}40`,
  },
  // Someone else's transfer — shown for context, not settleable here.
  debtCardOther: {
    opacity: 0.6,
  },
  debtCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: `${Theme.colors.primary}05`,
  },
  debtCardBadge: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginBottom: Theme.spacing.xs,
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
