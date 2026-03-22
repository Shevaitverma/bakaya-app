export const CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Entertainment',
  'Bills', 'Health', 'Gift', 'Other'
] as const;

export type Category = typeof CATEGORIES[number];
