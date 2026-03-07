/**
 * Category icon mapping utility
 * Maps category names to FontAwesome6 icon names
 */

export const getCategoryIcon = (category: string): string => {
  const categoryLower = category.toLowerCase();

  const iconMap: Record<string, string> = {
    food: 'utensils',
    accessory: 'mobile-screen-button',
    transport: 'car',
    shopping: 'bag-shopping',
    bills: 'file-invoice',
    entertainment: 'film',
    groceries: 'cart-shopping',
    healthcare: 'heart-pulse',
    education: 'graduation-cap',
    travel: 'plane',
    utilities: 'bolt',
    clothing: 'shirt',
    restaurant: 'utensils',
    gas: 'gas-pump',
    insurance: 'shield',
    rent: 'house',
    other: 'receipt',
  };

  return iconMap[categoryLower] || 'receipt';
};
