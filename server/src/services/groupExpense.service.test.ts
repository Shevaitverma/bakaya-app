import { expect, test } from "bun:test";
import mongoose from "mongoose";
import { splitEqually, splitByPercentage, suggestTransfers } from "./groupExpense.service";
import { pairwiseOwed } from "./settlement.service";
import { GroupExpense } from "@/models/GroupExpense";
import { createGroupExpenseSchema } from "@/schemas/groupExpense.schema";

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

test("splitEqually gives the indivisible remainder to the first member", () => {
  const splits = splitEqually(100, ["a", "b", "c"]);
  expect(splits).toEqual([
    { userId: "a", amount: 33.34 },
    { userId: "b", amount: 33.33 },
    { userId: "c", amount: 33.33 },
  ]);
  expect(sum(splits.map((s) => s.amount))).toBe(100);
});

test("splitEqually rejects amounts too small to split into paise", () => {
  expect(() => splitEqually(0.02, ["a", "b", "c"])).toThrow("too small to split");
  // Exactly one paise each is splittable — 0.03 / 3 is 0.009999999999999998 in
  // binary FP, so a naive `amount / n < 0.01` guard rejects it.
  expect(splitEqually(0.03, ["a", "b", "c"]).map((s) => s.amount)).toEqual([0.01, 0.01, 0.01]);
});

test("splitEqually does not lose a paise to float floor", () => {
  // (0.58 / 2) * 100 === 28.999999999999996, so flooring gives 0.28 and dumps
  // the "remainder" on the first member: 0.30 / 0.28 instead of 0.29 / 0.29.
  expect(splitEqually(0.58, ["a", "b"]).map((s) => s.amount)).toEqual([0.29, 0.29]);
  // 50.01 / 3 is exactly 16.67; nobody should be short-changed.
  expect(splitEqually(50.01, ["a", "b", "c"]).map((s) => s.amount)).toEqual([16.67, 16.67, 16.67]);
});

test("splitByPercentage does not lose a paise to float floor", () => {
  expect(splitByPercentage(0.58, [
    { userId: "a", percentage: 50 },
    { userId: "b", percentage: 50 },
  ]).map((s) => s.amount)).toEqual([0.29, 0.29]);
  expect(splitByPercentage(1.14, [
    { userId: "a", percentage: 50 },
    { userId: "b", percentage: 50 },
  ]).map((s) => s.amount)).toEqual([0.57, 0.57]);
});

test("a 33.33/33.33/33.34 split round-trips through save → edit → save", () => {
  const entries = [
    { userId: "a", percentage: 33.33 },
    { userId: "b", percentage: 33.33 },
    { userId: "c", percentage: 33.34 },
  ];
  const first = splitByPercentage(100, entries);
  expect(first.map((s) => s.amount)).toEqual([33.33, 33.33, 33.34]);

  // Reload: percentages come back off the stored splits, unchanged.
  const reopened = first.map((s) => ({ userId: s.userId, percentage: s.percentage }));
  expect(splitByPercentage(100, reopened)).toEqual(first);
  // And again, to prove there is no per-save drift.
  expect(splitByPercentage(100, reopened.map((s) => ({ ...s })))).toEqual(first);
});

test("every equal and percentage split sums to the total exactly", () => {
  for (let paise = 2; paise <= 3000; paise++) {
    const amount = paise / 100;
    for (const n of [2, 3, 5, 7]) {
      if (paise < n) continue;
      const ids = Array.from({ length: n }, (_, i) => `u${i}`);
      expect(sum(splitEqually(amount, ids).map((s) => s.amount))).toBe(amount);
    }
    const pct = splitByPercentage(amount, [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
      { userId: "c", percentage: 33.34 },
    ]);
    expect(sum(pct.map((s) => s.amount))).toBe(amount);
  }
});

test("splitByPercentage sums to the total and keeps the percentages", () => {
  const splits = splitByPercentage(100.01, [
    { userId: "a", percentage: 60 },
    { userId: "b", percentage: 40 },
  ]);
  expect(sum(splits.map((s) => s.amount))).toBe(100.01);
  expect(splits.map((s) => s.percentage)).toEqual([60, 40]);
});

test("createGroupExpenseSchema accepts a percentage split summing to 100", () => {
  const parsed = createGroupExpenseSchema.parse({
    title: "Dinner",
    amount: 100,
    splitType: "percentage",
    splitAmong: [
      { userId: "a", amount: 60, percentage: 60 },
      { userId: "b", amount: 40, percentage: 40 },
    ],
  });
  expect(parsed.splitType).toBe("percentage");
  expect(parsed.splitAmong?.[0]?.percentage).toBe(60);
});

test("createGroupExpenseSchema rejects percentages that miss 100", () => {
  const result = createGroupExpenseSchema.safeParse({
    title: "Dinner",
    amount: 100,
    splitType: "percentage",
    splitAmong: [
      { userId: "a", amount: 60, percentage: 60 },
      { userId: "b", amount: 40, percentage: 30 },
    ],
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.message).toContain("must add up to 100");
});

test("createGroupExpenseSchema rejects exact amounts that miss the total", () => {
  const result = createGroupExpenseSchema.safeParse({
    title: "Dinner",
    amount: 100,
    splitType: "exact",
    splitAmong: [
      { userId: "a", amount: 60 },
      { userId: "b", amount: 30 },
    ],
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.message).toContain("must equal the expense total");
});

test("suggestTransfers settles everyone and nets to zero", () => {
  const balances = { a: 60, b: -20, c: -40 };
  const transfers = suggestTransfers(balances);

  const net = { ...balances } as Record<string, number>;
  for (const t of transfers) {
    net[t.from] = (net[t.from] ?? 0) + t.amount;
    net[t.to] = (net[t.to] ?? 0) - t.amount;
  }
  for (const value of Object.values(net)) expect(Math.abs(value)).toBeLessThan(0.01);
});

test("suggestTransfers returns nothing for an already-settled group", () => {
  expect(suggestTransfers({ a: 0, b: 0, c: 0.004, d: -0.004 })).toEqual([]);
});

test("suggestTransfers breaks a multi-party cycle without over-paying", () => {
  // a owes b, b owes c, c owes a — net: a -10, b 0, c 10
  const balances = { a: -10, b: 0, c: 10 };
  const transfers = suggestTransfers(balances);
  expect(transfers).toEqual([{ from: "a", to: "c", amount: 10 }]);
});

test("suggested transfers never move more than the sum of positive balances", () => {
  const cases: Record<string, number>[] = [
    { a: 60, b: -20, c: -40 },
    { a: -10, b: 0, c: 10 },
    { a: 33.34, b: -33.33, c: -0.01 },
    { a: 100, b: 50, c: -75, d: -75 },
    { a: 0, b: 0 },
  ];
  for (const balances of cases) {
    const moved = sum(suggestTransfers(balances).map((t) => t.amount));
    const owed = sum(Object.values(balances).filter((v) => v > 0));
    expect(moved).toBeLessThanOrEqual(owed + 0.01);
  }
});

// Random balance sheets that net to zero, the way a real group's do.
function randomBalances(seed: number, n: number): Record<string, number> {
  let s = seed;
  const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const balances: Record<string, number> = {};
  let running = 0;
  for (let i = 0; i < n - 1; i++) {
    const v = Math.round((rand() * 2000 - 1000) * 100) / 100;
    balances[`u${i}`] = v;
    running = Math.round((running + v) * 100) / 100;
  }
  balances[`u${n - 1}`] = Math.round(-running * 100) / 100;
  return balances;
}

test("suggestTransfers never emits a zero, negative or self transfer", () => {
  for (let seed = 1; seed <= 500; seed++) {
    const balances = randomBalances(seed, 2 + (seed % 7));
    for (const t of suggestTransfers(balances)) {
      expect(t.amount).toBeGreaterThan(0);
      expect(t.from).not.toBe(t.to);
    }
  }
});

test("suggestTransfers settles every group to within a paise and terminates", () => {
  for (let seed = 1; seed <= 500; seed++) {
    const balances = randomBalances(seed, 2 + (seed % 7));
    const net = { ...balances };
    for (const t of suggestTransfers(balances)) {
      net[t.from] = (net[t.from] ?? 0) + t.amount;
      net[t.to] = (net[t.to] ?? 0) - t.amount;
    }
    for (const value of Object.values(net)) expect(Math.abs(value)).toBeLessThan(0.011);
  }
});

test("a suggested transfer is never rejected by the settlement overpayment cap", () => {
  // settlement.service rejects when `amount - pairwiseOwed > 0.01`. If the plan
  // could exceed that, the app would suggest a payment it then refuses.
  for (let seed = 1; seed <= 500; seed++) {
    const balances = randomBalances(seed, 2 + (seed % 7));
    for (const t of suggestTransfers(balances)) {
      expect(t.amount - pairwiseOwed(balances, t.from, t.to)).toBeLessThanOrEqual(0.01);
    }
  }
});

test("a legacy expense with no splitType reopens as exact, not equal", () => {
  // Mongoose fills schema defaults in on hydration, so the edit screens never
  // see `undefined` — the model's default alone decides how old expenses reopen.
  // "equal" would re-split a stored 70/30 evenly on the next save.
  const legacy = GroupExpense.hydrate({
    _id: new mongoose.Types.ObjectId(),
    groupId: new mongoose.Types.ObjectId(),
    paidBy: new mongoose.Types.ObjectId(),
    title: "Old dinner",
    amount: 100,
    splitAmong: [
      { userId: new mongoose.Types.ObjectId(), amount: 70 },
      { userId: new mongoose.Types.ObjectId(), amount: 30 },
    ],
  });
  expect(legacy.splitType).toBe("exact");
});
