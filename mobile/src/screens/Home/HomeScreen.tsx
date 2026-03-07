import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import GroupCard from '../../components/GroupCard';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { Group } from '../../interfaces/group';
import type { MainStackParamList } from '../../navigation/types';
import { groupService } from '../../services/groupService';
import type { GroupsResponse } from '../../types/group';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout, user, accessToken } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    if (!accessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response: GroupsResponse = await groupService.getGroups(
        1,
        20,
        accessToken
      );

      if (response.success && response.data) {
        // Map API groups to Group interface
        const apiGroups: Group[] = response.data.groups.map((group) => ({
          id: group._id,
          title: group.name,
          amount: 10, // Hardcoded as requested
          imageUri: undefined, // Hardcoded as requested
        }));

        // Add "My Expense" as the first item
        const myExpenseGroup: Group = {
          id: 'my-expense',
          title: 'My Expense',
          amount: 1111,
          imageUri: undefined,
        };

        setGroups([myExpenseGroup, ...apiGroups]);
      } else {
        throw new Error('Failed to fetch groups');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching groups';
      setError(errorMessage);
      console.error('Error fetching groups:', errorMessage);
      // Set default groups on error
      setGroups([
        {
          id: 'my-expense',
          title: 'My Expense',
          amount: 0.0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    // TODO: Implement add group functionality
    console.log('Add group pressed');
  };

  const handleGroupPress = (group: Group) => {
    if (group.title === 'My Expense') {
      navigation.navigate('ExpenseDetail');
    } else {
      // TODO: Implement navigation to other group details
      console.log('Group pressed:', group.id);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setShowLogoutDialog(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <GroupCard
      title={item.title}
      amount={item.amount}
      imageUri={item.imageUri}
      onPress={() => handleGroupPress(item)}
    />
  );

  const totalOwed = groups
    .filter((group) => group.title !== 'My Expense')
    .reduce((sum, group) => sum + group.amount, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Modern Header with Glassmorphism */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.greeting}>
              Hello{user?.firstName ? `, ${user.firstName}` : ''}
            </Text>
            <Text style={styles.title}>Your Groups</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddGroup}
              activeOpacity={0.8}>
              <FontAwesome6
                name="plus"
                size={18}
                color={Theme.colors.primary}
                style={styles.addIcon}
                solid
              />
              <Text style={styles.addButtonText}>New Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}>
              <FontAwesome6
                name="right-from-bracket"
                size={18}
                color={Theme.colors.textOnPrimary}
                solid
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrapper}>
            <View style={styles.summaryIconContainer}>
              <FontAwesome6
                name="wallet"
                size={18}
                color={Theme.colors.white}
                solid
              />
            </View>
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Owed</Text>
            <Text style={styles.summaryAmount}>₹{totalOwed.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentWrapper}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : error && groups.length === 0 ? (
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
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + Theme.spacing.lg }
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Expense Groups</Text>
                <Text style={styles.sectionSubtitle}>
                  {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={logoutLoading}
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
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    opacity: 0.9,
    marginBottom: Theme.spacing.xs,
  },
  title: {
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
  addIcon: {
    marginRight: -2,
  },
  addButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryIconWrapper: {
    marginRight: Theme.spacing.sm,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: 2,
    opacity: 0.9,
    letterSpacing: 0.1,
  },
  summaryAmount: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.4,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  listHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },
  listContent: {
    paddingTop: Theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
  },
  retryButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
});

export default HomeScreen;
