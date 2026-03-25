/**
 * Format amount as Indian Rupees consistently across the app.
 * Always shows 2 decimal places for amounts with paise,
 * no decimals for whole amounts.
 * Uses Indian number formatting (lakhs/crores).
 */
export function formatCurrency(amount: number): string {
  // For whole numbers, show no decimals: ₹1,000
  // For decimal numbers, show 2 decimals: ₹1,000.50
  const hasDecimals = amount % 1 !== 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format amount always with 2 decimal places (for split amounts, balances).
 */
export function formatCurrencyExact(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
