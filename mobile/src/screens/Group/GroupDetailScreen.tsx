/**
 * Group Detail Screen
 * Shows group balances, expenses, and settlements
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { formatCurrency } from '../../utils/currency';
import type { HomeStackParamList } from '../../navigation/types';
import type {
  GroupData,
  GroupExpense,
  GroupBalance,
  Settlement,
} from '../../types/group';

type GroupDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'GroupDetail'>;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ navigation, route }) => {
  const { groupId, groupName } = route.params;
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  // Data states
  const [group, setGroup] = useState<GroupData | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<GroupBalance>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Delete dialog
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  // Remove member dialog
  const [removeMemberDialogVisible, setRemoveMemberDialogVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);

  // Delete settlement dialog
  const [deleteSettlementDialogVisible, setDeleteSettlementDialogVisible] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<{ id: string; description: string } | null>(null);
  const [deleteSettlementLoading, setDeleteSettlementLoading] = useState(false);

  // Delete group dialog
  const [deleteGroupDialogVisible, setDeleteGroupDialogVisible] = useState(false);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);

  // Map userId to a display name from group members
  const getMemberName = useCallback(
    (userId: string): string => {
      if (!group) return userId;
      const member = group.members.find((m) => m.userId._id === userId);
      if (member) {
        return member.userId.email.split('@')[0] || member.userId.email;
      }
      return userId;
    },
    [group]
  );

  const getMembers = useCallback((): { userId: string; name: string }[] => {
    if (!group) return [];
    return group.members.map((m) => ({
      userId: m.userId._id,
      name: m.userId.email.split('@')[0] || m.userId.email,
    }));
  }, [group]);

  const lastFetchTime = useRef<number>(0);

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    if (Date.now() - lastFetchTime.current < 30000) return;

    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        groupService.getGroup(groupId, accessToken),
        groupService.getGroupExpenses(groupId, 1, 50, accessToken),
        groupService.getGroupBalances(groupId, accessToken),
        groupService.getSettlements(groupId, accessToken),
      ]);

      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data);
      }
      if (expensesRes.success && expensesRes.data) {
        setExpenses(expensesRes.data.expenses);
      }
      if (balancesRes.success && balancesRes.data) {
        setBalances(balancesRes.data.balances);
      }
      if (settlementsRes.success && settlementsRes.data) {
        setSettlements(settlementsRes.data.settlements);
      }
      lastFetchTime.current = Date.now();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load group details';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accessToken, groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchTime.current = 0;
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const handleDeleteExpense = (expenseId: string, title: string) => {
    setExpenseToDelete({ id: expenseId, title });
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !expenseToDelete) return;

    setDeleteLoading(true);

    // Optimistically remove from list
    const deletedExpense = expenses.find((e) => e._id === expenseToDelete.id);
    setExpenses((prev) => prev.filter((e) => e._id !== expenseToDelete.id));
    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    try {
      await groupService.deleteGroupExpense(groupId, expenseToDelete.id, accessToken);
      // Refresh balances after deletion
      const balancesRes = await groupService.getGroupBalances(groupId, accessToken);
      if (balancesRes.success && balancesRes.data) {
        setBalances(balancesRes.data.balances);
      }
    } catch (err) {
      // Revert optimistic removal
      if (deletedExpense) {
        setExpenses((prev) => [deletedExpense, ...prev]);
      }
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete expense';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (!deleteLoading) {
      setDeleteDialogVisible(false);
      setExpenseToDelete(null);
    }
  };

  const handleEditExpense = (expenseId: string) => {
    navigation.navigate('EditGroupExpense', {
      groupId,
      expenseId,
      members: getMembers(),
    });
  };

  const handleAddExpense = () => {
    navigation.navigate('AddGroupExpense', {
      groupId,
      members: getMembers(),
    });
  };

  const handleSettleUp = () => {
    navigation.navigate('SettleUp', {
      groupId,
      balances,
      members: getMembers(),
    });
  };

  const handleAddMember = async () => {
    if (!accessToken || isAddingMember || !memberEmail.trim()) return;

    setIsAddingMember(true);
    setAddMemberError('');

    try {
      const res = await groupService.addMember(groupId, memberEmail.trim(), accessToken);
      if (res.success && res.data) {
        setGroup(res.data);
      }
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to add member. Please try again.';
      setAddMemberError(errorMessage);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Check if current user is the group creator
  const isGroupCreator = group?.createdBy._id === user?.id;

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberDialogVisible(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!accessToken || !memberToRemove) return;

    setRemoveMemberLoading(true);
    try {
      await groupService.removeMember(groupId, memberToRemove.id, accessToken);
      setRemoveMemberDialogVisible(false);
      setMemberToRemove(null);
      // Refresh group data
      const groupRes = await groupService.getGroup(groupId, accessToken);
      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove member';
      Alert.alert('Error', errorMessage);
    } finally {
      setRemoveMemberLoading(false);
    }
  };

  const handleCancelRemoveMember = () => {
    if (!removeMemberLoading) {
      setRemoveMemberDialogVisible(false);
      setMemberToRemove(null);
    }
  };

  const handleDeleteSettlement = (settlementId: string, description: string) => {
    setSettlementToDelete({ id: settlementId, description });
    setDeleteSettlementDialogVisible(true);
  };

  const handleConfirmDeleteSettlement = async () => {
    if (!accessToken || !settlementToDelete) return;

    setDeleteSettlementLoading(true);
    try {
      await groupService.deleteSettlement(groupId, settlementToDelete.id, accessToken);
      setDeleteSettlementDialogVisible(false);
      setSettlementToDelete(null);
      // Refresh settlements and balances
      const [settlementsRes, balancesRes] = await Promise.all([
        groupService.getSettlements(groupId, accessToken),
        groupService.getGroupBalances(groupId, accessToken),
      ]);
      if (settlementsRes.success && settlementsRes.data) {
        setSettlements(settlementsRes.data.settlements);
      }
      if (balancesRes.success && balancesRes.data) {
        setBalances(balancesRes.data.balances);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete settlement';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteSettlementLoading(false);
    }
  };

  const handleCancelDeleteSettlement = () => {
    if (!deleteSettlementLoading) {
      setDeleteSettlementDialogVisible(false);
      setSettlementToDelete(null);
    }
  };

  const handleEditGroup = () => {
    navigation.navigate('EditGroup', { groupId });
  };

  const handleDeleteGroup = () => {
    setDeleteGroupDialogVisible(true);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!accessToken) return;

    setDeleteGroupLoading(true);
    try {
      const response = await groupService.deleteGroup(groupId, accessToken);
      if (response.success) {
        setDeleteGroupDialogVisible(false);
        navigation.goBack();
      } else {
        throw new Error('Failed to delete group');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete group';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleteGroupLoading(false);
    }
  };

  const handleCancelDeleteGroup = () => {
    if (!deleteGroupLoading) {
      setDeleteGroupDialogVisible(false);
    }
  };

  // Calculate group total expense
  const groupTotalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const getSettlementUserName = (settlementUser: { _id: string; email: string; name?: string }): string => {
    if (settlementUser.name) return settlementUser.name;
    return settlementUser.email.split('@')[0] || settlementUser.email;
  };

  const getPaidByName = (expense: GroupExpense): string => {
    if (expense.paidBy.firstName) {
      return expense.paidBy.firstName;
    }
    if (expense.paidBy.name) {
      return expense.paidBy.name;
    }
    return expense.paidBy.email.split('@')[0] || expense.paidBy.email;
  };

  // Calculate balance summary entries from the balances object
  const balanceEntries = useMemo(
    () =>
      Object.entries(balances).map(([userId, amount]) => ({
        userId,
        name: getMemberName(userId),
        amount: amount as number,
      })),
    [balances, getMemberName]
  );

  // Compute the current user's net balance
  const netBalance = useMemo((): number => {
    if (!user?.id) return 0;
    return (balances[user.id] as number) ?? 0;
  }, [balances, user?.id]);

  // Compute suggested minimum transfers using greedy algorithm
  const suggestedTransfers = useMemo((): { from: string; fromName: string; to: string; toName: string; amount: number }[] => {
    const transfers: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, amt]) => {
      const amount = amt as number;
      if (amount < -0.01) {
        debtors.push({ userId, amount: Math.abs(amount) });
      } else if (amount > 0.01) {
        creditors.push({ userId, amount });
      }
    });

    // Sort largest first for greedy matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]!;
      const creditor = creditors[j]!;
      const transferAmount = Math.min(debtor.amount, creditor.amount);
      if (transferAmount > 0.01) {
        transfers.push({
          from: debtor.userId,
          fromName: debtor.userId === user?.id ? 'You' : getMemberName(debtor.userId),
          to: creditor.userId,
          toName: creditor.userId === user?.id ? 'You' : getMemberName(creditor.userId),
          amount: Math.round(transferAmount * 100) / 100,
        });
      }
      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return transfers;
  }, [balances, getMemberName, user?.id]);

  // Navigate to SettleUp screen (tapping a suggested transfer)
  const handleSuggestedTransferTap = () => {
    navigation.navigate('SettleUp', {
      groupId,
      balances,
      members: getMembers(),
    });
  };

  // Avatar color palette for balance entries
  const avatarColors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];
  const getAvatarColor = (index: number): string => avatarColors[index % avatarColors.length]!;

  const renderBalanceItem = (item: { userId: string; name: string; amount: number }, index: number, maxAbsAmount: number) => {
    const isCurrentUser = item.userId === user?.id;
    const displayName = isCurrentUser ? 'You' : item.name;
    const isPositive = item.amount > 0;
    const isZero = item.amount === 0;
    const avatarBgColor = getAvatarColor(index);
    const barWidth = maxAbsAmount > 0 ? Math.abs(item.amount) / maxAbsAmount : 0;

    return (
      <View key={item.userId} style={styles.balanceRow}>
        <View style={[styles.balanceAvatar, { backgroundColor: avatarBgColor + '25' }]}>
          <Text style={[styles.balanceAvatarText, { color: avatarBgColor }]}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceName} numberOfLines={1}>{displayName}</Text>
            <Text
              style={[
                styles.balanceAmount,
                {
                  color: isPositive
                    ? Theme.colors.success
                    : isZero
                      ? Theme.colors.textSecondary
                      : Theme.colors.error,
                },
              ]}>
              {isPositive ? `gets back ${formatCurrency(Math.abs(item.amount))}` : isZero ? 'settled up' : `owes ${formatCurrency(Math.abs(item.amount))}`}
            </Text>
          </View>
          {!isZero && (
            <View style={styles.balanceBarTrack}>
              <View
                style={[
                  styles.balanceBarFill,
                  {
                    width: `${Math.max(barWidth * 100, 4)}%`,
                    backgroundColor: isPositive ? Theme.colors.success : Theme.colors.error,
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderExpenseItem = ({ item }: { item: GroupExpense }) => {
    const paidByName = getPaidByName(item);
    const splitCount = item.splitAmong?.length ?? 0;

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseCardContent}>
          <View style={styles.expenseIconWrapper}>
            <FontAwesome6
              name="receipt"
              size={16}
              color={Theme.colors.primary}
              solid
            />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.expenseSubtext}>
              {paidByName} paid {'\u00B7'} split {splitCount} {splitCount === 1 ? 'way' : 'ways'} {'\u00B7'} {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: Theme.colors.error }]}>{formatCurrency(item.amount)}</Text>
            <View style={styles.expenseActions}>
              <TouchableOpacity
                style={styles.expenseActionButton}
                onPress={() => handleEditExpense(item._id)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome6
                  name="pen-to-square"
                  size={14}
                  color={Theme.colors.blue}
                  solid
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.expenseActionButton}
                onPress={() => handleDeleteExpense(item._id, item.title)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome6
                  name="trash-can"
                  size={14}
                  color={Theme.colors.error}
                  solid
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderListHeader = () => {
    const hasBalances = balanceEntries.length > 0;
    const memberCount = group?.members.length ?? 0;
    const maxAbsAmount = balanceEntries.reduce((max, e) => Math.max(max, Math.abs(e.amount)), 0);

    return (
      <View>
        {/* Balances Section */}
        <View style={styles.balancesSection}>
          <View style={styles.balancesSectionHeader}>
            <Text style={styles.sectionTitle}>Balances</Text>
            {hasBalances && (
              <TouchableOpacity
                style={styles.settleUpButton}
                onPress={handleSettleUp}
                activeOpacity={0.8}>
                <FontAwesome6
                  name="handshake"
                  size={14}
                  color={Theme.colors.white}
                  solid
                />
                <Text style={styles.settleUpButtonText}>Settle Up</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Net Summary Card */}
          {hasBalances && (
            <View
              style={[
                styles.netSummaryCard,
                {
                  backgroundColor:
                    netBalance > 0.01
                      ? '#f0fdf4'
                      : netBalance < -0.01
                        ? '#fef2f2'
                        : '#f3f4f6',
                  borderColor:
                    netBalance > 0.01
                      ? '#bbf7d0'
                      : netBalance < -0.01
                        ? '#fecaca'
                        : '#e5e7eb',
                },
              ]}>
              <FontAwesome6
                name={
                  netBalance > 0.01
                    ? 'arrow-trend-up'
                    : netBalance < -0.01
                      ? 'arrow-trend-down'
                      : 'check-circle'
                }
                size={18}
                color={
                  netBalance > 0.01
                    ? Theme.colors.success
                    : netBalance < -0.01
                      ? Theme.colors.error
                      : '#6B7280'
                }
                solid
              />
              <Text
                style={[
                  styles.netSummaryText,
                  {
                    color:
                      netBalance > 0.01
                        ? Theme.colors.success
                        : netBalance < -0.01
                          ? Theme.colors.error
                          : '#6B7280',
                  },
                ]}>
                {netBalance > 0.01
                  ? `You are owed ${formatCurrency(Math.abs(netBalance))}`
                  : netBalance < -0.01
                    ? `You owe ${formatCurrency(Math.abs(netBalance))}`
                    : 'All settled up'}
              </Text>
            </View>
          )}

          {hasBalances ? (
            <View style={styles.balancesCard}>
              {balanceEntries.map((item, index) => renderBalanceItem(item, index, maxAbsAmount))}
            </View>
          ) : (
            <View style={styles.emptyBalancesCard}>
              <FontAwesome6
                name="scale-balanced"
                size={24}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyBalancesText}>No balances yet</Text>
            </View>
          )}

          {/* Suggested Transfers */}
          {suggestedTransfers.length > 0 && (
            <View style={styles.suggestedTransfersSection}>
              <Text style={styles.suggestedTransfersTitle}>Suggested Transfers</Text>
              <View style={styles.suggestedTransfersCard}>
                {suggestedTransfers.map((transfer, index) => (
                  <TouchableOpacity
                    key={`${transfer.from}-${transfer.to}-${index}`}
                    style={styles.suggestedTransferRow}
                    onPress={handleSuggestedTransferTap}
                    activeOpacity={0.7}>
                    <View style={styles.suggestedTransferContent}>
                      <Text style={styles.suggestedTransferName} numberOfLines={1}>
                        {transfer.fromName}
                      </Text>
                      <FontAwesome6
                        name="arrow-right"
                        size={12}
                        color={Theme.colors.primary}
                        solid
                      />
                      <Text style={styles.suggestedTransferName} numberOfLines={1}>
                        {transfer.toName}
                      </Text>
                    </View>
                    <View style={styles.suggestedTransferRight}>
                      <Text style={styles.suggestedTransferAmount}>
                        {formatCurrency(transfer.amount)}
                      </Text>
                      <FontAwesome6
                        name="chevron-right"
                        size={10}
                        color={Theme.colors.textTertiary}
                        solid
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Settlements Section */}
        <View style={styles.settlementsSection}>
          <Text style={styles.sectionTitle}>Settlements</Text>
          {settlements.length === 0 ? (
            <View style={styles.emptySettlementsCard}>
              <FontAwesome6
                name="handshake"
                size={24}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptySettlementsText}>No settlements yet</Text>
              <Text style={styles.emptySettlementsSubtext}>
                Settlements will appear here when members settle their balances
              </Text>
            </View>
          ) : (
            <View style={styles.settlementsCard}>
              {settlements.map((s) => (
                <View key={s._id} style={styles.settlementRow}>
                  <View style={styles.settlementIconWrapper}>
                    <FontAwesome6
                      name="handshake"
                      size={14}
                      color={Theme.colors.success}
                      solid
                    />
                  </View>
                  <View style={styles.settlementInfo}>
                    <Text style={styles.settlementText} numberOfLines={1}>
                      <Text style={styles.settlementBold}>{getSettlementUserName(s.paidBy)}</Text>
                      {' paid '}
                      <Text style={styles.settlementBold}>{getSettlementUserName(s.paidTo)}</Text>
                    </Text>
                    <Text style={styles.settlementMeta}>
                      {formatDate(s.createdAt)}
                      {s.notes ? ` \u00B7 ${s.notes}` : ''}
                    </Text>
                  </View>
                  <View style={styles.settlementRight}>
                    <Text style={styles.settlementAmount}>{formatCurrency(s.amount)}</Text>
                    <TouchableOpacity
                      style={styles.settlementDeleteButton}
                      onPress={() => handleDeleteSettlement(s._id, `${getSettlementUserName(s.paidBy)} paid ${getSettlementUserName(s.paidTo)}`)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <FontAwesome6
                        name="trash-can"
                        size={13}
                        color={Theme.colors.error}
                        solid
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.membersSection}>
          <View style={styles.membersSectionHeader}>
            <Text style={styles.sectionTitle}>
              Members{memberCount > 0 ? ` (${memberCount})` : ''}
            </Text>
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={() => {
                setShowAddMember(!showAddMember);
                setAddMemberError('');
                setMemberEmail('');
              }}
              activeOpacity={0.8}>
              <FontAwesome6
                name={showAddMember ? 'xmark' : 'user-plus'}
                size={14}
                color={Theme.colors.white}
                solid
              />
              <Text style={styles.addMemberButtonText}>
                {showAddMember ? 'Cancel' : 'Add Member'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inline Add Member Form */}
          {showAddMember && (
            <View style={styles.addMemberForm}>
              {addMemberError !== '' && (
                <View style={styles.addMemberErrorContainer}>
                  <Text style={styles.addMemberErrorText}>{addMemberError}</Text>
                </View>
              )}
              <View style={styles.addMemberRow}>
                <TextInput
                  style={styles.addMemberInput}
                  placeholder="Enter email address"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAddingMember}
                />
                <TouchableOpacity
                  style={[
                    styles.addMemberSubmitButton,
                    (!memberEmail.trim() || isAddingMember) && styles.addMemberSubmitButtonDisabled,
                  ]}
                  onPress={handleAddMember}
                  disabled={!memberEmail.trim() || isAddingMember}
                  activeOpacity={0.8}>
                  {isAddingMember ? (
                    <ActivityIndicator size="small" color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.addMemberSubmitButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Members List */}
          {group?.members && group.members.length > 0 ? (
            <View style={styles.membersCard}>
              {group.members.map((member) => {
                const displayName = member.userId.email.split('@')[0] || member.userId.email;
                const isAdmin = member.role === 'admin';

                return (
                  <View key={member.userId._id} style={styles.memberRow}>
                    <View style={[styles.memberAvatar, { backgroundColor: `${Theme.colors.primary}20` }]}>
                      <Text style={[styles.memberAvatarText, { color: Theme.colors.primary }]}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>{member.userId.email}</Text>
                    </View>
                    <View style={styles.memberActions}>
                      <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeMember]}>
                        <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextMember]}>
                          {member.role}
                        </Text>
                      </View>
                      {isGroupCreator && member.userId._id !== user?.id && (
                        <TouchableOpacity
                          style={styles.removeMemberButton}
                          onPress={() => handleRemoveMember(member.userId._id, displayName)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <FontAwesome6
                            name="xmark"
                            size={14}
                            color={Theme.colors.error}
                            solid
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyMembersCard}>
              <FontAwesome6
                name="users"
                size={24}
                color={Theme.colors.textTertiary}
                solid
              />
              <Text style={styles.emptyMembersText}>No members yet</Text>
            </View>
          )}
        </View>

        {/* Expenses Section Header */}
        <View style={styles.expensesSectionHeader}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <Text style={styles.expenseCount}>
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyExpenses = () => (
    <View style={styles.emptyExpensesCard}>
      <FontAwesome6
        name="receipt"
        size={32}
        color={Theme.colors.textTertiary}
        solid
      />
      <Text style={styles.emptyExpensesText}>No expenses yet</Text>
      <Text style={styles.emptyExpensesSubtext}>
        Tap the button below to add your first group expense
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
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
          <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.textOnPrimary} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
        {isGroupCreator ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleEditGroup}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome6
                name="pen-to-square"
                size={16}
                color={Theme.colors.textOnPrimary}
                solid
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDeleteGroup}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome6
                name="trash-can"
                size={16}
                color={Theme.colors.textOnPrimary}
                solid
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
      </View>

      {/* Group Total Expense */}
      {groupTotalExpense > 0 && (
        <View style={styles.totalExpenseContainer}>
          <Text style={styles.totalExpenseLabel}>Total Expense</Text>
          <Text style={styles.totalExpenseAmount}>{formatCurrency(groupTotalExpense)}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyExpenses}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        />

        {/* FAB - Add Expense */}
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + Theme.spacing.lg }]}
          onPress={handleAddExpense}
          activeOpacity={0.85}>
          <FontAwesome6
            name="plus"
            size={20}
            color={Theme.colors.white}
            solid
          />
          <Text style={styles.fabText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Expense Confirmation Dialog */}
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

      {/* Remove Member Confirmation Dialog */}
      <ConfirmationDialog
        visible={removeMemberDialogVisible}
        title="Remove Member"
        message={
          memberToRemove
            ? `Are you sure you want to remove "${memberToRemove.name}" from this group? This action cannot be undone.`
            : ''
        }
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirmRemoveMember}
        onCancel={handleCancelRemoveMember}
        loading={removeMemberLoading}
        variant="danger"
      />

      {/* Delete Settlement Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteSettlementDialogVisible}
        title="Delete Settlement"
        message={
          settlementToDelete
            ? `Are you sure you want to delete the settlement "${settlementToDelete.description}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteSettlement}
        onCancel={handleCancelDeleteSettlement}
        loading={deleteSettlementLoading}
        variant="danger"
      />

      {/* Delete Group Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteGroupDialogVisible}
        title="Delete Group"
        message={`Are you sure you want to delete "${groupName}"? All expenses, settlements, and balances will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={handleCancelDeleteGroup}
        loading={deleteGroupLoading}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  totalExpenseContainer: {
    alignItems: 'center',
    paddingBottom: Theme.spacing.md,
  },
  totalExpenseLabel: {
    fontSize: Theme.typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  totalExpenseAmount: {
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
  },

  // Balances section
  balancesSection: {
    marginBottom: Theme.spacing.lg,
  },
  balancesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  settleUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.success,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.xs,
    ...Theme.shadows.small,
  },
  settleUpButtonText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  balancesCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  // Net summary card
  netSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: Theme.spacing.sm,
  },
  netSummaryText: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  balanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAvatarText: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  balanceDetails: {
    flex: 1,
    gap: 4,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceName: {
    flex: 1,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  balanceAmount: {
    fontSize: Theme.typography.fontSize.small,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  balanceBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  balanceBarFill: {
    height: 4,
    borderRadius: 2,
  },
  // Suggested transfers
  suggestedTransfersSection: {
    marginTop: Theme.spacing.sm,
  },
  suggestedTransfersTitle: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestedTransfersCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  suggestedTransferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  suggestedTransferContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  suggestedTransferName: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    flexShrink: 1,
  },
  suggestedTransferRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  suggestedTransferAmount: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  emptyBalancesCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyBalancesText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },

  // Settlements section
  settlementsSection: {
    marginBottom: Theme.spacing.lg,
  },
  settlementsCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  settlementIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: `${Theme.colors.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementInfo: {
    flex: 1,
  },
  settlementText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  settlementBold: {
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  settlementMeta: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    marginTop: 2,
  },
  settlementRight: {
    alignItems: 'flex-end',
    gap: Theme.spacing.xs,
  },
  settlementAmount: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  settlementDeleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySettlementsCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptySettlementsText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  emptySettlementsSubtext: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Members section
  membersSection: {
    marginBottom: Theme.spacing.lg,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.xs,
    ...Theme.shadows.small,
  },
  addMemberButtonText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  addMemberForm: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  addMemberErrorContainer: {
    backgroundColor: `${Theme.colors.error}10`,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  addMemberErrorText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  addMemberInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  addMemberSubmitButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  addMemberSubmitButtonDisabled: {
    opacity: 0.5,
  },
  addMemberSubmitButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  membersCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  memberEmail: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    marginTop: 1,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  removeMemberButton: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: `${Theme.colors.error}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  roleBadgeAdmin: {
    backgroundColor: `${Theme.colors.primary}15`,
  },
  roleBadgeMember: {
    backgroundColor: `${Theme.colors.grey}15`,
  },
  roleBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  roleBadgeTextAdmin: {
    color: Theme.colors.primary,
  },
  roleBadgeTextMember: {
    color: Theme.colors.grey,
  },
  emptyMembersCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyMembersText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },

  // Expenses section
  expensesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  expenseCount: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  expenseCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  expenseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  expenseIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  expenseSubtext: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: Theme.spacing.xs,
  },
  expenseAmount: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  expenseActionButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyExpensesCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: Theme.spacing.sm,
  },
  emptyExpensesText: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  emptyExpensesSubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    gap: Theme.spacing.sm,
    ...Theme.shadows.large,
  },
  fabText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default GroupDetailScreen;
