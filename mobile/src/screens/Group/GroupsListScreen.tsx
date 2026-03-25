/**
 * Groups List Screen - Dedicated screen for listing and managing all groups
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import type { GroupData, GroupsResponse } from '../../types/group';
import type { GroupsStackParamList } from '../../navigation/types';

type GroupsListScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupsList'>;

// Color palette for member avatars - picked by hashing the name
const AVATAR_COLORS = [
  '#D81B60', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

const hashName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getAvatarColor = (name: string): string => {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length] ?? '#D81B60';
};

// Group icon colors based on group name
const GROUP_ICON_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#06B6D4', '#EF4444', '#6366F1',
];

const getGroupIconColor = (name: string): string => {
  return GROUP_ICON_COLORS[hashName(name) % GROUP_ICON_COLORS.length] ?? '#3B82F6';
};

const GroupsListScreen: React.FC<GroupsListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { accessToken, refreshSession, logout } = useAuth();

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  const fetchGroups = useCallback(async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    if (Date.now() - lastFetchTime.current < 30000) return;

    try {
      setLoading(true);
      setError(null);
      const response: GroupsResponse = await groupService.getGroups(1, 50, accessToken);

      if (response.success && response.data) {
        setGroups(response.data.groups);
      } else {
        throw new Error('Failed to fetch groups');
      }
      lastFetchTime.current = Date.now();
    } catch (err: any) {
      if (err?.statusCode === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          await logout();
          return;
        }
        // Token refreshed, next focus will re-fetch
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching groups';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshSession, logout]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchTime.current = 0;
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  const handleGroupPress = (group: GroupData) => {
    navigation.navigate('GroupDetail', {
      groupId: group._id,
      groupName: group.name,
    });
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const getMemberNames = (group: GroupData): string[] => {
    return group.members?.map((m) => m.userId?.email?.split('@')[0] ?? 'User') ?? [];
  };

  const renderGroupItem = ({ item, index }: { item: GroupData; index: number }) => {
    const memberNames = getMemberNames(item);
    const memberCount = item.members?.length ?? 0;
    const visibleNames = memberNames.slice(0, 4);
    const overflowCount = memberNames.length - 4;
    const iconColor = getGroupIconColor(item.name);
    const description = item.description || '';

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => handleGroupPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupCardContent}>
          {/* Group Icon */}
          <View style={[styles.groupIcon, { backgroundColor: iconColor + '15' }]}>
            <FontAwesome6
              name="users"
              size={20}
              color={iconColor}
              solid
            />
          </View>

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.name}
            </Text>

            {description.length > 0 && (
              <Text style={styles.groupDescription} numberOfLines={1}>
                {description}
              </Text>
            )}

            {/* Member Avatars Row */}
            <View style={styles.memberRow}>
              {visibleNames.map((name, idx) => (
                <View
                  key={name + idx}
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: getAvatarColor(name) },
                    idx > 0 && { marginLeft: -8 },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {overflowCount > 0 && (
                <View style={[styles.avatarCircle, styles.avatarOverflow, { marginLeft: -8 }]}>
                  <Text style={styles.avatarOverflowText}>+{overflowCount}</Text>
                </View>
              )}
              <Text style={styles.memberCountText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {/* Chevron */}
          <View style={styles.chevronContainer}>
            <FontAwesome6
              name="chevron-right"
              size={14}
              color={Theme.colors.textTertiary}
              solid
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <FontAwesome6
          name="users"
          size={40}
          color={Theme.colors.textTertiary}
          solid
        />
      </View>
      <Text style={styles.emptyTitle}>No groups yet</Text>
      <Text style={styles.emptySubtext}>
        Create a group to split expenses with friends, family, or roommates.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={handleCreateGroup}
        activeOpacity={0.85}
      >
        <FontAwesome6
          name="plus"
          size={14}
          color={Theme.colors.textOnPrimary}
          solid
        />
        <Text style={styles.emptyCtaText}>Create your first group</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Full-screen loading state ---
  if (loading && groups.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Groups</Text>
          </View>
        </View>
        <View style={styles.contentWrapper}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        </View>
      </View>
    );
  }

  // --- Full-screen error state ---
  if (error && groups.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />
        <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Groups</Text>
          </View>
        </View>
        <View style={styles.contentWrapper}>
          <View style={styles.errorContainer}>
            <FontAwesome6
              name="triangle-exclamation"
              size={48}
              color={Theme.colors.error}
              solid
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Groups</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateGroup}
            activeOpacity={0.8}
          >
            <FontAwesome6
              name="plus"
              size={18}
              color={Theme.colors.primary}
              solid
            />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Theme.spacing.xxl },
            groups.length === 0 && styles.listContentEmpty,
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
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },

  // --- Header ---
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.medium,
    gap: Theme.spacing.xs,
  },
  addButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Content ---
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: Theme.spacing.md + 4,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },

  // --- Group Card ---
  groupCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  groupDescription: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    marginBottom: 4,
  },

  // --- Member Avatars ---
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  avatarOverflow: {
    backgroundColor: Theme.colors.lightGrey,
  },
  avatarOverflowText: {
    color: Theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600' as const,
  },
  memberCountText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    marginLeft: Theme.spacing.sm,
  },
  chevronContainer: {
    marginLeft: Theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Loading State ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
  },

  // --- Error State ---
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
  },
  retryButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xxxl,
    gap: Theme.spacing.md,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  emptySubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    ...Theme.shadows.medium,
  },
  emptyCtaText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default GroupsListScreen;
