/**
 * Invitations Screen - List of pending group invitations for the current user
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Theme } from '../../constants/theme';
import {
  useMyInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../hooks/queries';
import { queryClient } from '../../lib/queryClient';
import { queryKeys } from '../../lib/queryKeys';
import type { ApiError } from '../../lib/authedFetch';
import { Button } from '../../components/Button';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import type { InvitationsStackParamList, MainTabParamList } from '../../navigation/types';
import type { GroupInvitation } from '../../types/invitation';

type InvitationsScreenProps = NativeStackScreenProps<InvitationsStackParamList, 'Invitations'>;

const formatInviterName = (invitedBy: GroupInvitation['invitedBy']): string => {
  if (invitedBy.firstName || invitedBy.lastName) {
    return `${invitedBy.firstName ?? ''} ${invitedBy.lastName ?? ''}`.trim();
  }
  return invitedBy.email.split('@')[0] || invitedBy.email;
};

const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { data, isLoading, error, refetch } = useMyInvitations();
  const invitations = data?.invitations ?? [];

  // Local flag so the pull-to-refresh spinner only shows for an actual pull,
  // not for the background refetches the cache does on its own.
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Invitations arrive from outside the app (push), so pick up new ones on focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const processingId = acceptInvitation.isPending
    ? acceptInvitation.variables
    : declineInvitation.isPending
      ? declineInvitation.variables
      : undefined;

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error.message || 'Failed to load invitations');
    }
  }, [error]);

  const respond = (invitation: GroupInvitation, action: 'accept' | 'decline') => {
    if (processingId) return;
    const mutation = action === 'accept' ? acceptInvitation : declineInvitation;
    mutation.mutate(invitation._id, {
      onSuccess: (response) => {
        if (action !== 'accept') return;
        const group = response.data?.group;
        const groupName = group?.name ?? invitation.groupId.name;
        Alert.alert('Joined', `You've joined ${groupName}`, [
          { text: 'Later', style: 'cancel' },
          {
            text: 'View group',
            onPress: () =>
              navigation
                .getParent<BottomTabNavigationProp<MainTabParamList>>()
                ?.navigate('GroupsTab', {
                  screen: 'GroupDetail',
                  params: { groupId: group?._id ?? invitation.groupId._id, groupName },
                }),
          },
        ]);
      },
      onError: (err) => {
        // Stale invitation: drop it from the list instead of leaving a dead row
        const status = (err as ApiError).statusCode;
        if (status === 400 || status === 403 || status === 404) {
          queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
        }
        Alert.alert('Error', err.message || `Failed to ${action} invitation`);
      },
    });
  };

  const renderInvitation = ({ item }: { item: GroupInvitation }) => {
    const inviterName = formatInviterName(item.invitedBy);
    const isProcessing = processingId === item._id;

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={styles.groupIconWrapper}>
            <FontAwesome6
              name="people-group"
              size={18}
              color={Theme.colors.primary}
              solid
            />
          </View>
          <View style={styles.invitationHeaderText}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.groupId.name}
            </Text>
            <Text style={styles.invitedBy} numberOfLines={1}>
              Invited by {inviterName}
            </Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText} numberOfLines={3}>
              &ldquo;{item.message}&rdquo;
            </Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            title="Decline"
            variant="outline"
            onPress={() => respond(item, 'decline')}
            loading={isProcessing && declineInvitation.isPending}
            disabled={isProcessing}
            style={styles.declineButton}
          />
          <Button
            title="Accept"
            variant="primary"
            onPress={() => respond(item, 'accept')}
            loading={isProcessing && acceptInvitation.isPending}
            disabled={isProcessing}
            style={styles.acceptButton}
          />
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View>
      {[1, 2, 3].map((n) => (
        <View key={n} style={styles.invitationCard}>
          <View style={styles.invitationHeader}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: Theme.spacing.sm, gap: 6 }}>
              <SkeletonLoader width={'60%'} height={16} />
              <SkeletonLoader width={'40%'} height={12} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Theme.spacing.sm, marginTop: Theme.spacing.md }}>
            <SkeletonLoader width={'48%'} height={44} borderRadius={12} />
            <SkeletonLoader width={'48%'} height={44} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome6
        name="envelope-open-text"
        size={48}
        color={Theme.colors.textTertiary}
        solid
      />
      <Text style={styles.emptyText}>No pending invitations</Text>
      <Text style={styles.emptySubtext}>
        When someone invites you to a group, it&rsquo;ll show up here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Invitations
        </Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        {isLoading ? (
          <View style={styles.listContent}>{renderSkeleton()}</View>
        ) : (
          <FlatList
            data={invitations}
            renderItem={renderInvitation}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.listContent,
              invitations.length === 0 && styles.listContentEmpty,
              { paddingBottom: insets.bottom + Theme.spacing.xl },
            ]}
            ListEmptyComponent={renderEmpty}
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
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.xxlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
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
  listContentEmpty: {
    flexGrow: 1,
  },
  invitationCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.shadows.small,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  groupIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: `${Theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationHeaderText: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  invitedBy: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  messageContainer: {
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  messageText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  declineButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: Theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: Theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
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
    paddingHorizontal: Theme.spacing.xl,
    lineHeight: 20,
  },
});

export default InvitationsScreen;
