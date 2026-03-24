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
  ExpenseDetail: undefined;
  AddExpense: { profileId?: string } | undefined;
  EditExpense: { expenseId: string };
  CreateGroup: undefined;
  ProfileExpenses: { profileId: string; profileName: string; profileColor?: string };
  GroupDetail: { groupId: string; groupName: string };
  AddGroupExpense: { groupId: string; members: { userId: string; name: string }[] };
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
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AnalyticsTab: NavigatorScreenParams<AnalyticsStackParamList>;
  MeTab: NavigatorScreenParams<MeStackParamList>;
};

// Keep legacy MainStackParamList for backward compatibility
export type MainStackParamList = {
  Home: undefined;
  ExpenseDetail: undefined;
  AddExpense: { profileId?: string } | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
