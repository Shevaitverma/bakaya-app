/**
 * BalanceCard component
 * Displays income, expenses, balance summary with a progress bar
 * and daily spending/budget rate information.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { formatCurrency } from '../utils/currency';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  dailySpendingRate: number;
  dailyBudgetRate: number;
  daysRemaining: number;
}

const getBalanceColor = (balance: number): string => {
  if (balance > 0) return Theme.colors.success;
  if (balance < 0) return Theme.colors.error;
  return Theme.colors.textSecondary;
};

const getProgressColor = (percentage: number): string => {
  if (percentage <= 50) return Theme.colors.success;
  if (percentage <= 75) return Theme.colors.warning;
  return Theme.colors.error;
};

const BalanceCard: React.FC<BalanceCardProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  spentPercentage,
  dailySpendingRate,
  dailyBudgetRate,
  daysRemaining,
}) => {
  const clampedPercentage = Math.min(Math.max(spentPercentage, 0), 100);
  const progressColor = getProgressColor(clampedPercentage);
  const balanceColor = getBalanceColor(balance);

  return (
    <View style={styles.card}>
      {/* Summary Row: Income | Expenses | Balance */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, styles.incomeValue]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>
            {formatCurrency(totalExpenses)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, { color: balanceColor }]}>
            {formatCurrency(Math.abs(balance))}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${clampedPercentage}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: progressColor }]}>
          {Math.round(clampedPercentage)}% spent
        </Text>
      </View>

      {/* Daily Rates */}
      <View style={styles.ratesRow}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Daily spending</Text>
          <Text style={styles.rateValue}>
            {formatCurrency(dailySpendingRate)}/day
          </Text>
        </View>
        <View style={styles.rateItem}>
          <Text style={[styles.rateLabel, styles.rateAlignRight]}>Daily budget</Text>
          <Text style={[styles.rateValue, styles.rateAlignRight]}>
            {formatCurrency(dailyBudgetRate)}/day
          </Text>
        </View>
      </View>

      {/* Days Remaining */}
      {daysRemaining > 0 && (
        <Text style={styles.daysRemaining}>
          {daysRemaining} days remaining this month
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.cardBackground,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  summaryLabel: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: Theme.typography.fontSize.large,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  incomeValue: {
    color: Theme.colors.success,
  },
  expenseValue: {
    color: Theme.colors.error,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: Theme.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: Theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
  },
  progressText: {
    fontSize: Theme.typography.fontSize.small,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    textAlign: 'right',
  },

  // Daily Rates
  ratesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  rateItem: {
    flex: 1,
  },
  rateLabel: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    marginBottom: 2,
  },
  rateAlignRight: {
    textAlign: 'right',
  },
  rateValue: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // Days Remaining
  daysRemaining: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
});

export default BalanceCard;
