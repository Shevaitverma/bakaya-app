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

/**
 * Format amount in abbreviated form for chart labels.
 * Uses Indian conventions: L for lakhs, K for thousands.
 *  - >= 10,00,000 (10 lakhs): "₹15L", "₹1.2L"
 *  - >= 1,000: "₹2.5K", "₹1K"
 *  - Otherwise: full formatted amount "₹500"
 * Trailing ".0" is trimmed (e.g., "₹2.0K" becomes "₹2K").
 */
export function formatCurrencyAbbreviated(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1000000) {
    // 10,00,000+ => lakhs
    const lakhs = abs / 100000;
    const formatted = lakhs % 1 === 0
      ? `${lakhs}`
      : `${parseFloat(lakhs.toFixed(1))}`;
    return `${sign}₹${formatted}L`;
  }

  if (abs >= 1000) {
    const thousands = abs / 1000;
    const formatted = thousands % 1 === 0
      ? `${thousands}`
      : `${parseFloat(thousands.toFixed(1))}`;
    return `${sign}₹${formatted}K`;
  }

  return formatCurrency(amount);
}
