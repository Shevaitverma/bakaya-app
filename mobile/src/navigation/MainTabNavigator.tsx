/**
 * Main Tab Navigator (Authenticated screens with bottom tabs)
 */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { useMyInvitations } from '../hooks/queries';
import type {
  MainTabParamList,
  HomeStackParamList,
  GroupsStackParamList,
  AnalyticsStackParamList,
  InvitationsStackParamList,
  MeStackParamList,
} from './types';

const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
  animationDuration: 280,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  contentStyle: { backgroundColor: Theme.colors.white },
};

// Home stack screens
import HomeScreen from '../screens/Home/HomeScreen';
import GroupsListScreen from '../screens/Group/GroupsListScreen';
import ExpenseDetailScreen from '../screens/Expense/ExpenseDetailScreen';
import AddExpenseScreen from '../screens/Expense/AddExpenseScreen';
import EditExpenseScreen from '../screens/Expense/EditExpenseScreen';
import GroupDetailScreen from '../screens/Group/GroupDetailScreen';
import CreateGroupScreen from '../screens/Group/CreateGroupScreen';
import AddGroupExpenseScreen from '../screens/Group/AddGroupExpenseScreen';
import EditGroupExpenseScreen from '../screens/Group/EditGroupExpenseScreen';
import EditGroupScreen from '../screens/Group/EditGroupScreen';
import SettleUpScreen from '../screens/Group/SettleUpScreen';
import ProfileExpensesScreen from '../screens/Profile/ProfileExpensesScreen';

// Analytics stack screens
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';

// Me stack screens
import ProfilesScreen from '../screens/Profile/ProfilesScreen';
import AddProfileScreen from '../screens/Profile/AddProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MeProfileExpensesScreen from '../screens/Profile/ProfileExpensesScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CategoriesScreen from '../screens/Category/CategoriesScreen';
import InvitationsScreen from '../screens/Invitations/InvitationsScreen';

// ── Home Stack ──────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <HomeStack.Screen name="EditExpense" component={EditExpenseScreen} />
      <HomeStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <HomeStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <HomeStack.Screen name="AddGroupExpense" component={AddGroupExpenseScreen} />
      <HomeStack.Screen name="EditGroupExpense" component={EditGroupExpenseScreen} />
      <HomeStack.Screen name="EditGroup" component={EditGroupScreen} />
      <HomeStack.Screen name="SettleUp" component={SettleUpScreen} />
      <HomeStack.Screen name="ProfileExpenses" component={ProfileExpensesScreen} />
      <HomeStack.Screen name="EditProfile" component={EditProfileScreen as any} />
    </HomeStack.Navigator>
  );
};

// ── Groups Stack ────────────────────────────────────────────────────────────

const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

const GroupsStackNavigator: React.FC = () => {
  return (
    <GroupsStack.Navigator
      screenOptions={stackScreenOptions}>
      <GroupsStack.Screen name="GroupsList" component={GroupsListScreen} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <GroupsStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <GroupsStack.Screen name="AddGroupExpense" component={AddGroupExpenseScreen} />
      <GroupsStack.Screen name="EditGroupExpense" component={EditGroupExpenseScreen} />
      <GroupsStack.Screen name="EditGroup" component={EditGroupScreen} />
      <GroupsStack.Screen name="SettleUp" component={SettleUpScreen} />
    </GroupsStack.Navigator>
  );
};

// ── Analytics Stack ─────────────────────────────────────────────────────────

const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();

const AnalyticsStackNavigator: React.FC = () => {
  return (
    <AnalyticsStack.Navigator
      screenOptions={stackScreenOptions}>
      <AnalyticsStack.Screen name="Analytics" component={AnalyticsScreen} />
    </AnalyticsStack.Navigator>
  );
};

// ── Me Stack ────────────────────────────────────────────────────────────────

const MeStack = createNativeStackNavigator<MeStackParamList>();

const MeStackNavigator: React.FC = () => {
  return (
    <MeStack.Navigator
      screenOptions={stackScreenOptions}>
      <MeStack.Screen name="Profiles" component={ProfilesScreen} />
      <MeStack.Screen name="AddProfile" component={AddProfileScreen} />
      <MeStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MeStack.Screen name="ProfileExpenses" component={MeProfileExpensesScreen as any} />
      <MeStack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: false }} />
      <MeStack.Screen name="Settings" component={SettingsScreen} />
    </MeStack.Navigator>
  );
};

// ── Invitations Stack ───────────────────────────────────────────────────────

const InvitationsStack = createNativeStackNavigator<InvitationsStackParamList>();

const InvitationsStackNavigator: React.FC = () => {
  return (
    <InvitationsStack.Navigator
      screenOptions={stackScreenOptions}>
      <InvitationsStack.Screen name="Invitations" component={InvitationsScreen} />
    </InvitationsStack.Navigator>
  );
};

// ── Bottom Tab Navigator ────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { data: invitations } = useMyInvitations();
  const pendingCount = invitations?.invitations?.length ?? 0;

  // Bottom padding = the device inset, but floored and capped so it looks right
  // everywhere: Android edge-to-edge can under-report (needs the 12 floor), and
  // iOS reports the full 34px home-indicator inset which a tab bar doesn't need
  // (cap at 22 so labels clear the indicator without a big empty band).
  const bottomGap = Math.min(Math.max(insets.bottom, 12), 22);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: [
          styles.tabBar,
          {
            height: 52 + bottomGap,
            paddingBottom: bottomGap,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name="house" size={20} color={color} solid={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStackNavigator}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name="people-group" size={20} color={color} solid={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="InvitationsTab"
        component={InvitationsStackNavigator}
        options={{
          tabBarLabel: 'Invitations',
          tabBarBadge:
            pendingCount > 0 ? (pendingCount > 99 ? '99+' : pendingCount) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name="envelope" size={20} color={color} solid={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name="chart-simple" size={20} color={color} solid={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeStackNavigator}
        options={{
          tabBarLabel: 'Profiles',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6 name="user" size={20} color={color} solid={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginTop: 2,
  },
  tabBarIcon: {
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
});
