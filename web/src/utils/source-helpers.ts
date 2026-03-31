export const SOURCE_EMOJI: Record<string, string> = {
  salary: "\u{1F4B0}",
  freelance: "\u{1F4BB}",
  investment: "\u{1F4C8}",
  gift: "\u{1F381}",
  refund: "\u{1F504}",
  rental: "\u{1F3E0}",
  other: "\u{1F4B5}",
};

export const SOURCE_COLORS: Record<string, string> = {
  salary: "rgba(16, 185, 129, 0.15)",
  freelance: "rgba(99, 102, 241, 0.15)",
  investment: "rgba(34, 197, 94, 0.15)",
  gift: "rgba(244, 63, 94, 0.15)",
  refund: "rgba(59, 130, 246, 0.15)",
  rental: "rgba(139, 92, 246, 0.15)",
  other: "rgba(16, 185, 129, 0.15)",
};

export function getSourceEmoji(source: string): string {
  return SOURCE_EMOJI[source.toLowerCase()] ?? "\u{1F4B5}";
}

export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source.toLowerCase()] ?? "rgba(16, 185, 129, 0.15)";
}
