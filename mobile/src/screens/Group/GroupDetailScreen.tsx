/**
 * Group Detail Screen
 * Shows group balances, expenses, and settlements
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  useGroup,
  useGroupExpenses,
  useGroupBalances,
  useSettlements,
  useGroupInvitations,
  useCategories,
  useDeleteGroupExpense,
  useDeleteSettlement,
  useDeleteGroup,
  useRemoveGroupMember,
  useSendInvitation,
  useCancelInvitation,
} from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { formatCurrency } from '../../utils/currency';
import type { HomeStackParamList } from '../../navigation/types';
import type { GroupExpense, PopulatedUser } from '../../types/group';
import { getPopulatedUserName } from '../../types/group';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Data queries — everything under this group invalidates together
  const groupQuery = useGroup(groupId);
  const expensesQuery = useGroupExpenses(groupId);
  const balancesQuery = useGroupBalances(groupId);
  const settlementsQuery = useSettlements(groupId);
  // Admin-only endpoint; members just get no data back
  const invitationsQuery = useGroupInvitations(groupId, 'pending');
  const categoriesQuery = useCategories();

  const group = groupQuery.data ?? null;
  const expenses = expensesQuery.data?.expenses ?? [];
  const totalAmount = expensesQuery.data?.totalAmount ?? 0;
  const balances = balancesQuery.data?.balances ?? {};
  const settlements = settlementsQuery.data?.settlements ?? [];
  const pendingInvitations = invitationsQuery.data?.invitations ?? [];

  // Mutations
  const deleteExpense = useDeleteGroupExpense();
  const deleteSettlementMutation = useDeleteSettlement();
  const deleteGroupMutation = useDeleteGroup();
  const removeMember = useRemoveGroupMember();
  const sendInvitation = useSendInvitation();
  const cancelInvitation = useCancelInvitation();

  // Delete dialog
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);

  // Invite member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  // Cancel invitation dialog
  const [cancelInvitationDialogVisible, setCancelInvitationDialogVisible] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<{ id: string; email: string } | null>(null);

  // Remove member dialog
  const [removeMemberDialogVisible, setRemoveMemberDialogVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  // Delete settlement dialog
  const [deleteSettlementDialogVisible, setDeleteSettlementDialogVisible] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<{ id: string; description: string } | null>(null);

  // Delete group dialog
  const [deleteGroupDialogVisible, setDeleteGroupDialogVisible] = useState(false);

  // Map userId to a display name from group members.
  // Falls back to a generic "Unknown member" instead of echoing the raw ObjectId,
  // which the user would otherwise see when a member is no longer populated.
  const getMemberName = useCallback(
    (userId: string): string => {
      if (!group) return 'Unknown member';
      // Support both the correct populated shape ({ id, email, ... })
      // and the legacy bare-ObjectId fallback (string or { _id }).
      const member = group.members.find((m) => {
        const mu: any = m.userId;
        if (!mu) return false;
        if (typeof mu === 'string') return mu === userId;
        return mu.id === userId || mu._id === userId;
      });
      if (member) {
        return getPopulatedUserName(member.userId);
      }
      return 'Unknown member';
    },
    [group]
  );

  const getMembers = useCallback((): { userId: string; name: string }[] => {
    if (!group) return [];
    return group.members
      .map((m) => {
        const mu: any = m.userId;
        const userId: string | undefined =
          typeof mu === 'string' ? mu : mu?.id ?? mu?._id;
        if (!userId) return null;
        return {
          userId,
          name: getPopulatedUserName(m.userId),
        };
      })
      .filter((m): m is { userId: string; name: string } => m !== null);
  }, [group]);

  // The group, its expenses, balances and settlements load as one unit
  const loading =
    groupQuery.isLoading ||
    expensesQuery.isLoading ||
    balancesQuery.isLoading ||
    settlementsQuery.isLoading;

  const loadError =
    groupQuery.error ?? expensesQuery.error ?? balancesQuery.error ?? settlementsQuery.error;

  useEffect(() => {
    if (loadError) {
      Alert.alert('Error', loadError.message || 'Failed to load group details');
    }
  }, [loadError]);

  // Local flag so the pull-to-refresh spinner only shows for an actual pull,
  // not for the background refetches the cache does on its own.
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    ]);
    setRefreshing(false);
  }, [queryClient, groupId]);

  // Add/edit expense and settle-up still write through the service layer, so
  // returning from them has to invalidate. Drop this once they use mutations.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    }, [queryClient, groupId])
  );

  const handleDeleteExpense = (expenseId: string, title: string) => {
    setExpenseToDelete({ id: expenseId, title });
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!expenseToDelete) return;
    const target = expenseToDelete;

    // Optimistically drop the row from every cached expenses page.
    // The snapshot restores the exact previous list (and total) on failure.
    const expensesKey = queryKeys.groups.expenses(groupId);
    const snapshot = queryClient.getQueriesData({ queryKey: expensesKey });
    const deleted = expenses.find((e) => e._id === target.id);
    queryClient.setQueriesData({ queryKey: expensesKey }, (old: any) =>
      old?.expenses
        ? {
            ...old,
            expenses: old.expenses.filter((e: GroupExpense) => e._id !== target.id),
            totalAmount: old.totalAmount - (deleted?.amount ?? 0),
          }
        : old
    );
    setDeleteDialogVisible(false);
    setExpenseToDelete(null);

    deleteExpense.mutate(
      { groupId, expenseId: target.id },
      {
        onError: (err) => {
          snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
          Alert.alert('Error', err.message || 'Failed to delete expense');
        },
      }
    );
  };

  const handleCancelDelete = () => {
    if (!deleteExpense.isPending) {
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
      isAdmin: isGroupAdmin,
    });
  };

  const handleSettleUp = () => {
    navigation.navigate('SettleUp', {
      groupId,
      balances,
      members: getMembers(),
    });
  };

  const handleAddMember = () => {
    const trimmedEmail = memberEmail.trim();
    if (sendInvitation.isPending || !trimmedEmail) return;

    setAddMemberError('');
    sendInvitation.mutate(
      { groupId, email: trimmedEmail, message: inviteMessage },
      {
        onSuccess: () => {
          setMemberEmail('');
          setInviteMessage('');
          setShowAddMember(false);
          Alert.alert(
            'Invitation sent',
            `We've sent an invitation to ${trimmedEmail}.`,
            [{ text: 'OK' }]
          );
        },
        onError: (err) =>
          setAddMemberError(err.message || 'Unable to send invitation. Please try again.'),
      }
    );
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    setInvitationToCancel({ id: invitationId, email });
    setCancelInvitationDialogVisible(true);
  };

  const handleConfirmCancelInvitation = () => {
    if (!invitationToCancel) return;

    cancelInvitation.mutate(
      { groupId, invitationId: invitationToCancel.id },
      {
        onSuccess: () => {
          setCancelInvitationDialogVisible(false);
          setInvitationToCancel(null);
        },
        onError: (err) => Alert.alert('Error', err.message || 'Failed to cancel invitation'),
      }
    );
  };

  const handleCancelCancelInvitation = () => {
    if (!cancelInvitation.isPending) {
      setCancelInvitationDialogVisible(false);
      setInvitationToCancel(null);
    }
  };

  // Check if current user is the group creator
  const isGroupCreator = group?.createdBy?.id === user?.id;

  // Check if current user is an admin of the group (covers both creator and admin-role members)
  const isGroupAdmin = useMemo(() => {
    if (!group || !user?.id) return false;
    if (group.createdBy?.id === user.id) return true;
    return group.members.some(
      (m) => m.userId?.id === user.id && m.role === 'admin'
    );
  }, [group, user?.id]);

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberDialogVisible(true);
  };

  const handleConfirmRemoveMember = () => {
    if (!memberToRemove) return;

    removeMember.mutate(
      { groupId, memberId: memberToRemove.id },
      {
        onSuccess: () => {
          setRemoveMemberDialogVisible(false);
          setMemberToRemove(null);
        },
        onError: (err) => Alert.alert('Error', err.message || 'Failed to remove member'),
      }
    );
  };

  const handleCancelRemoveMember = () => {
    if (!removeMember.isPending) {
      setRemoveMemberDialogVisible(false);
      setMemberToRemove(null);
    }
  };

  // Leaving reuses the server's removeMember(self) path.
  const handleLeaveGroup = () => {
    if (!user?.id) return;
    Alert.alert(
      'Leave group',
      'Leave this group? Any outstanding balances will need to be resolved separately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            if (!user?.id) return;
            removeMember.mutate(
              { groupId, memberId: user.id },
              {
                onSuccess: () => navigation.goBack(),
                onError: (err) => Alert.alert('Error', err.message || 'Failed to leave group'),
              }
            );
          },
        },
      ]
    );
  };

  const handleDeleteSettlement = (settlementId: string, description: string) => {
    setSettlementToDelete({ id: settlementId, description });
    setDeleteSettlementDialogVisible(true);
  };

  const handleConfirmDeleteSettlement = () => {
    if (!settlementToDelete) return;

    deleteSettlementMutation.mutate(
      { groupId, settlementId: settlementToDelete.id },
      {
        onSuccess: () => {
          setDeleteSettlementDialogVisible(false);
          setSettlementToDelete(null);
        },
        onError: (err) => Alert.alert('Error', err.message || 'Failed to delete settlement'),
      }
    );
  };

  const handleCancelDeleteSettlement = () => {
    if (!deleteSettlementMutation.isPending) {
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

  const handleConfirmDeleteGroup = () => {
    deleteGroupMutation.mutate(groupId, {
      onSuccess: () => {
        setDeleteGroupDialogVisible(false);
        navigation.goBack();
      },
      onError: (err) => Alert.alert('Error', err.message || 'Failed to delete group'),
    });
  };

  const handleCancelDeleteGroup = () => {
    if (!deleteGroupMutation.isPending) {
      setDeleteGroupDialogVisible(false);
    }
  };

  // Prefer the freshest name from the fetched group over the route param
  const displayGroupName = group?.name ?? groupName;

  // Build category name -> emoji/color lookup map
  const categoryMap = useMemo(() => {
    const map: Record<string, { emoji: string; color: string }> = {};
    (categoriesQuery.data?.categories ?? [])
      .filter((cat) => cat.isActive)
      .forEach((cat) => {
        map[cat.name.toLowerCase()] = { emoji: cat.emoji, color: cat.color };
      });
    return map;
  }, [categoriesQuery.data]);

  const getSettlementUserName = (settlementUser: PopulatedUser): string => {
    return getPopulatedUserName(settlementUser);
  };

  const getPaidByName = (expense: GroupExpense): string => {
    if (expense.paidBy.firstName) {
      return expense.paidBy.firstName;
    }
    return getPopulatedUserName(expense.paidBy);
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
    const payerId = item.paidBy?.id;
    const isCurrentUserPayer = !!user?.id && payerId === user.id;
    const payerLabel = isCurrentUserPayer ? 'You' : getPaidByName(item);

    const userShare = user?.id
      ? item.splitAmong?.find((s) => s.userId === user.id)?.amount ?? 0
      : 0;
    const youPaid = isCurrentUserPayer ? item.amount : 0;
    const net = youPaid - userShare;
    const involved = isCurrentUserPayer || userShare > 0;

    let netLabel: string;
    let netAmount: string;
    let netColor: string;
    let netSign: string;
    if (!involved) {
      netLabel = 'not involved';
      netAmount = '';
      netColor = Theme.colors.textTertiary;
      netSign = '';
    } else if (net > 0.01) {
      netLabel = 'you lent';
      netAmount = formatCurrency(net);
      netColor = Theme.colors.success;
      netSign = '+';
    } else if (net < -0.01) {
      netLabel = 'you owe';
      netAmount = formatCurrency(Math.abs(net));
      netColor = Theme.colors.error;
      netSign = '−';
    } else {
      netLabel = 'settled';
      netAmount = '';
      netColor = Theme.colors.textSecondary;
      netSign = '';
    }

    const catData = item.category ? categoryMap[item.category.toLowerCase()] : undefined;

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseCardContent}>
          <View style={[styles.expenseIconWrapper, catData && { backgroundColor: catData.color + '20' }]}>
            {catData ? (
              <Text style={styles.expenseEmojiIcon}>{catData.emoji}</Text>
            ) : (
              <FontAwesome6
                name="receipt"
                size={16}
                color={Theme.colors.primary}
                solid
              />
            )}
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.expenseSubtext} numberOfLines={1}>
              <Text style={styles.expensePayerName}>{payerLabel}</Text>
              <Text> paid </Text>
              <Text style={styles.expensePayerAmount}>{formatCurrency(item.amount)}</Text>
            </Text>
            <Text style={styles.expenseMeta} numberOfLines={1}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            {netAmount ? (
              <Text style={[styles.expenseNetAmount, { color: netColor }]} numberOfLines={1}>
                {netSign}
                {netAmount}
              </Text>
            ) : null}
            <Text style={[styles.expenseNetLabel, { color: netColor }]} numberOfLines={1}>
              {netLabel}
            </Text>
            {(payerId === user?.id || isGroupAdmin) && (
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
            )}
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
                    disabled={transfer.from !== user?.id}
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
                      {transfer.from === user?.id && (
                        <FontAwesome6
                          name="chevron-right"
                          size={10}
                          color={Theme.colors.textTertiary}
                          solid
                        />
                      )}
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
            {isGroupAdmin && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => {
                  setShowAddMember(!showAddMember);
                  setAddMemberError('');
                  setMemberEmail('');
                  setInviteMessage('');
                }}
                activeOpacity={0.8}>
                <FontAwesome6
                  name={showAddMember ? 'xmark' : 'user-plus'}
                  size={14}
                  color={Theme.colors.white}
                  solid
                />
                <Text style={styles.addMemberButtonText}>
                  {showAddMember ? 'Cancel' : 'Invite Member'}
                </Text>
              </TouchableOpacity>
            )}
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
                  editable={!sendInvitation.isPending}
                />
                <TouchableOpacity
                  style={[
                    styles.addMemberSubmitButton,
                    (!memberEmail.trim() || sendInvitation.isPending) && styles.addMemberSubmitButtonDisabled,
                  ]}
                  onPress={handleAddMember}
                  disabled={!memberEmail.trim() || sendInvitation.isPending}
                  activeOpacity={0.8}>
                  {sendInvitation.isPending ? (
                    <ActivityIndicator size="small" color={Theme.colors.white} />
                  ) : (
                    <Text style={styles.addMemberSubmitButtonText}>Invite</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.addMemberInput, styles.addMemberMessageInput]}
                placeholder="Add a message (optional)"
                placeholderTextColor={Theme.colors.textTertiary}
                value={inviteMessage}
                onChangeText={setInviteMessage}
                multiline
                editable={!sendInvitation.isPending}
              />
            </View>
          )}

          {/* Members List */}
          {group?.members && group.members.length > 0 ? (
            <View style={styles.membersCard}>
              {group.members.map((member, index) => {
                const memberUserId = member.userId?.id ?? '';
                const displayName = getPopulatedUserName(member.userId) || 'Member';
                const email = member.userId?.email ?? '';
                const isAdmin = member.role === 'admin';

                return (
                  <View key={memberUserId || `member-${index}`} style={styles.memberRow}>
                    <View style={[styles.memberAvatar, { backgroundColor: `${Theme.colors.primary}20` }]}>
                      <Text style={[styles.memberAvatarText, { color: Theme.colors.primary }]}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
                      {email !== '' && (
                        <Text style={styles.memberEmail} numberOfLines={1}>{email}</Text>
                      )}
                    </View>
                    <View style={styles.memberActions}>
                      <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeMember]}>
                        <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextMember]}>
                          {member.role}
                        </Text>
                      </View>
                      {isGroupAdmin &&
                        memberUserId !== '' &&
                        memberUserId !== user?.id &&
                        memberUserId !== group?.createdBy?.id && (
                        <TouchableOpacity
                          style={styles.removeMemberButton}
                          onPress={() => handleRemoveMember(memberUserId, displayName)}
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

          {!isGroupCreator && user?.id && group?.members.some((m) => m.userId?.id === user.id) && (
            <TouchableOpacity
              onPress={handleLeaveGroup}
              activeOpacity={0.7}
              style={{
                marginTop: Theme.spacing.md,
                paddingVertical: Theme.spacing.sm,
                alignSelf: 'flex-end',
              }}
            >
              <Text
                style={{
                  color: Theme.colors.error,
                  fontFamily: Theme.typography.fontFamily,
                  fontWeight: Theme.typography.fontWeight.semibold,
                }}
              >
                Leave group
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Invitations Section (admin-only) */}
        {isGroupAdmin && pendingInvitations.length > 0 && (
          <View style={styles.pendingInvitationsSection}>
            <Text style={styles.sectionTitle}>Pending Invitations</Text>
            <View style={styles.pendingInvitationsCard}>
              {pendingInvitations.map((inv) => (
                <View key={inv._id} style={styles.pendingInvitationRow}>
                  <View style={styles.pendingInvitationIconWrapper}>
                    <FontAwesome6
                      name="envelope"
                      size={14}
                      color={Theme.colors.warning}
                      solid
                    />
                  </View>
                  <View style={styles.pendingInvitationInfo}>
                    <Text style={styles.pendingInvitationEmail} numberOfLines={1}>
                      {inv.invitedEmail}
                    </Text>
                    <Text style={styles.pendingInvitationDate}>
                      Invited {formatDate(inv.createdAt)}
                    </Text>
                    {inv.message ? (
                      <Text style={styles.pendingInvitationMessage} numberOfLines={2}>
                        {inv.message}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.pendingInvitationRight}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelInvitationButton}
                      onPress={() => handleCancelInvitation(inv._id, inv.invitedEmail)}
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
          </View>
        )}

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
          <Text style={styles.headerTitle} numberOfLines={1}>{displayGroupName}</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{displayGroupName}</Text>
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
      {totalAmount > 0 && (
        <View style={styles.totalExpenseContainer}>
          <Text style={styles.totalExpenseLabel}>Total Expense</Text>
          <Text style={styles.totalExpenseAmount}>{formatCurrency(totalAmount)}</Text>
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
        loading={deleteExpense.isPending}
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
        loading={removeMember.isPending}
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
        loading={deleteSettlementMutation.isPending}
        variant="danger"
      />

      {/* Delete Group Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteGroupDialogVisible}
        title="Delete Group"
        message={`Are you sure you want to delete "${displayGroupName}"? All expenses, settlements, and balances will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteGroup}
        onCancel={handleCancelDeleteGroup}
        loading={deleteGroupMutation.isPending}
        variant="danger"
      />

      {/* Cancel Invitation Confirmation Dialog */}
      <ConfirmationDialog
        visible={cancelInvitationDialogVisible}
        title="Cancel Invitation"
        message={
          invitationToCancel
            ? `Cancel the pending invitation to "${invitationToCancel.email}"?`
            : ''
        }
        confirmText="Cancel Invitation"
        cancelText="Keep"
        onConfirm={handleConfirmCancelInvitation}
        onCancel={handleCancelCancelInvitation}
        loading={cancelInvitation.isPending}
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
  addMemberMessageInput: {
    marginTop: Theme.spacing.sm,
    minHeight: 44,
    textAlignVertical: 'top',
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

  // Pending invitations section
  pendingInvitationsSection: {
    marginBottom: Theme.spacing.lg,
  },
  pendingInvitationsCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  pendingInvitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  pendingInvitationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: `${Theme.colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingInvitationInfo: {
    flex: 1,
  },
  pendingInvitationEmail: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  pendingInvitationDate: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 1,
  },
  pendingInvitationMessage: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pendingInvitationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  pendingBadge: {
    backgroundColor: `${Theme.colors.warning}15`,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  pendingBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.warning,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  cancelInvitationButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  expenseEmojiIcon: {
    fontSize: 18,
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
    marginTop: 2,
  },
  expensePayerName: {
    color: Theme.colors.textPrimary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  expensePayerAmount: {
    color: Theme.colors.textPrimary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  expenseMeta: {
    fontSize: Theme.typography.fontSize.xs ?? 11,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 84,
  },
  expenseAmount: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  expenseNetAmount: {
    fontSize: Theme.typography.fontSize.medium,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
  expenseNetLabel: {
    fontSize: Theme.typography.fontSize.xs ?? 11,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
