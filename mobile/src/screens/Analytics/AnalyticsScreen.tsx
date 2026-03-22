/**
 * Analytics Screen - Spending analytics placeholder
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';

const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.placeholderContainer}>
          <View style={styles.iconContainer}>
            <FontAwesome6
              name="chart-pie"
              size={48}
              color={Theme.colors.textTertiary}
              solid
            />
          </View>
          <Text style={styles.placeholderTitle}>Coming Soon</Text>
          <Text style={styles.placeholderSubtext}>
            Spending analytics will be available here.{'\n'}
            Track your expenses by profile, category, and monthly trends.
          </Text>
        </View>
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
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  placeholderTitle: {
    fontSize: Theme.typography.fontSize.title,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  placeholderSubtext: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AnalyticsScreen;
