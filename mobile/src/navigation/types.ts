/**
 * Navigation type definitions
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ExpenseDetail: { category?: string } | undefined;
  AddExpense: { profileId?: string; type?: 'income' | 'expense' } | undefined;
  EditExpense: { expenseId: string };
  CreateGroup: undefined;
  ProfileExpenses: { profileId: string; profileName: string; profileColor?: string };
  GroupDetail: { groupId: string; groupName: string };
  AddGroupExpense: { groupId: string; members: { userId: string; name: string }[] };
  EditGroupExpense: { groupId: string; expenseId: string; members: { userId: string; name: string }[] };
  EditGroup: { groupId: string };
  SettleUp: { groupId: string; balances: Record<string, number>; members: { userId: string; name: string }[] };
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string; groupName: string };
  CreateGroup: undefined;
  AddGroupExpense: { groupId: string; members: { userId: string; name: string }[] };
  EditGroupExpense: { groupId: string; expenseId: string; members: { userId: string; name: string }[] };
  EditGroup: { groupId: string };
  SettleUp: { groupId: string; balances: Record<string, number>; members: { userId: string; name: string }[] };
};

export type AnalyticsStackParamList = {
  Analytics: undefined;
};

export type MeStackParamList = {
  Profiles: undefined;
  AddProfile: { profileId?: string } | undefined;
  EditProfile: { profileId: string; profileName: string; profileColor?: string };
  ProfileExpenses: { profileId: string; profileName: string; profileColor?: string };
  Categories: undefined;
  Settings: undefined;
  Invitations: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList>;
  AnalyticsTab: NavigatorScreenParams<AnalyticsStackParamList>;
  MeTab: NavigatorScreenParams<MeStackParamList>;
};

// Keep legacy MainStackParamList for backward compatibility
export type MainStackParamList = {
  Home: undefined;
  ExpenseDetail: { category?: string } | undefined;
  AddExpense: { profileId?: string; type?: 'income' | 'expense' } | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
