/**
 * Main Tab Navigator (Authenticated screens with bottom tabs)
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';
import type {
  MainTabParamList,
  HomeStackParamList,
  AnalyticsStackParamList,
  MeStackParamList,
} from './types';

// Home stack screens
import HomeScreen from '../screens/Home/HomeScreen';
import ExpenseDetailScreen from '../screens/Expense/ExpenseDetailScreen';
import AddExpenseScreen from '../screens/Expense/AddExpenseScreen';
import EditExpenseScreen from '../screens/Expense/EditExpenseScreen';
import GroupDetailScreen from '../screens/Group/GroupDetailScreen';
import CreateGroupScreen from '../screens/Group/CreateGroupScreen';
import AddGroupExpenseScreen from '../screens/Group/AddGroupExpenseScreen';
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

// ── Home Stack ──────────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <HomeStack.Screen name="EditExpense" component={EditExpenseScreen} />
      <HomeStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <HomeStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <HomeStack.Screen name="AddGroupExpense" component={AddGroupExpenseScreen} />
      <HomeStack.Screen name="SettleUp" component={SettleUpScreen} />
      <HomeStack.Screen name="ProfileExpenses" component={ProfileExpensesScreen} />
    </HomeStack.Navigator>
  );
};

// ── Analytics Stack ─────────────────────────────────────────────────────────

const AnalyticsStack = createNativeStackNavigator<AnalyticsStackParamList>();

const AnalyticsStackNavigator: React.FC = () => {
  return (
    <AnalyticsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AnalyticsStack.Screen name="Analytics" component={AnalyticsScreen} />
    </AnalyticsStack.Navigator>
  );
};

// ── Me Stack ────────────────────────────────────────────────────────────────

const MeStack = createNativeStackNavigator<MeStackParamList>();

const MeStackNavigator: React.FC = () => {
  return (
    <MeStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <MeStack.Screen name="Profiles" component={ProfilesScreen} />
      <MeStack.Screen name="AddProfile" component={AddProfileScreen} />
      <MeStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MeStack.Screen name="ProfileExpenses" component={MeProfileExpensesScreen as any} />
      <MeStack.Screen name="Settings" component={SettingsScreen} />
    </MeStack.Navigator>
  );
};

// ── Bottom Tab Navigator ────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} solid />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsStackNavigator}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="chart-simple" size={size} color={color} solid />
          ),
        }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeStackNavigator}
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="user" size={size} color={color} solid />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.lightGrey,
    paddingTop: Theme.spacing.xs,
    height: 60,
    ...Theme.shadows.small,
  },
  tabBarLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  tabBarIcon: {
    marginTop: 2,
  },
});
