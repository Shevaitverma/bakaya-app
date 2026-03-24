export const CATEGORIES = [
  "Food",
  "Accessory",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Groceries",
  "Healthcare",
  "Education",
  "Travel",
  "Utilities",
  "Clothing",
  "Restaurant",
  "Gas",
  "Insurance",
  "Rent",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Emoji equivalents for category icons */
export const CATEGORY_EMOJI: Record<string, string> = {
  food: "\u{1F37D}\uFE0F",
  accessory: "\u{1F4F1}",
  transport: "\u{1F697}",
  shopping: "\u{1F6CD}\uFE0F",
  bills: "\u{1F9FE}",
  entertainment: "\u{1F3AC}",
  groceries: "\u{1F6D2}",
  healthcare: "\u{1F48A}",
  education: "\u{1F393}",
  travel: "\u2708\uFE0F",
  utilities: "\u26A1",
  clothing: "\u{1F455}",
  restaurant: "\u{1F374}",
  gas: "\u26FD",
  insurance: "\u{1F6E1}\uFE0F",
  rent: "\u{1F3E0}",
  other: "\u{1F4C4}",
};

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "\u{1F4C4}";
}
