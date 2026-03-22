/**
 * Shared expense categories constant
 * Used in AddExpenseScreen and filters
 */

export const CATEGORIES = [
  'Food',
  'Accessory',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Groceries',
  'Healthcare',
  'Education',
  'Travel',
  'Utilities',
  'Clothing',
  'Restaurant',
  'Gas',
  'Insurance',
  'Rent',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];
