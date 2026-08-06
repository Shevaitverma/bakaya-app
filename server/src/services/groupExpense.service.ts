import { GroupExpense } from "@/models/GroupExpense";
import { Group } from "@/models/Group";
import { Settlement } from "@/models/Settlement";
import type { CreateGroupExpenseInput, UpdateGroupExpenseInput } from "@/schemas/groupExpense.schema";
import { createPaginationMeta } from "@/utils/pagination";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import { sendToUsers, getUserDisplayName } from "@/services/notification.service";

// Floor every share to paise and hand the leftover paise to the first member,
// so the parts always add up to `amount` exactly. All arithmetic is in whole
// paise: flooring a binary float shaves a paise off shares that are exact in
// decimal (`(0.58 / 2) * 100 === 28.999999999999996`).
export function splitEqually(amount: number, userIds: string[]) {
  const n = userIds.length;
  const totalPaise = Math.round(amount * 100);
  if (totalPaise < n) {
    throw new Error("Expense amount is too small to split");
  }
  const basePaise = Math.floor(totalPaise / n);
  const remainderPaise = totalPaise - basePaise * n;
  return userIds.map((userId, i) => ({
    userId,
    amount: (i === 0 ? basePaise + remainderPaise : basePaise) / 100,
  }));
}

// Same floor-plus-remainder trick, driven by stored percentages instead of an
// even share. Percentages are carried through so an edit can reopen them.
export function splitByPercentage(
  amount: number,
  entries: Array<{ userId: string; percentage: number }>
) {
  const totalPaise = Math.round(amount * 100);
  const splits = entries.map((e) => ({
    userId: e.userId,
    percentage: e.percentage,
    // Snap the product to 1e-6 of a paise before flooring, for the same reason.
    amount: Math.floor(Math.round(totalPaise * e.percentage * 1e4) / 1e6) / 100,
  }));
  const assigned = splits.reduce((sum, s) => sum + s.amount, 0);
  const remainder = Math.round((amount - assigned) * 100) / 100;
  if (splits[0]) {
    splits[0].amount = Math.round((splits[0].amount + remainder) * 100) / 100;
  }
  return splits;
}

export interface SuggestedTransfer {
  from: string;
  to: string;
  amount: number;
}

// Greedy largest-debtor / largest-creditor matching: at most N-1 transfers, but
// NOT the provably minimum-cashflow plan (that problem is NP-hard). Mirrors the
// matcher the mobile client has always used.
export function suggestTransfers(balances: Record<string, number>): SuggestedTransfer[] {
  const debtors: Array<{ userId: string; amount: number }> = [];
  const creditors: Array<{ userId: string; amount: number }> = [];

  // ±0.01 tolerance so FP drift around zero doesn't produce ghost rows.
  for (const [userId, amount] of Object.entries(balances)) {
    if (amount < -0.01) debtors.push({ userId, amount: -amount });
    else if (amount > 0.01) creditors.push({ userId, amount });
  }

  // Largest debts/credits matched first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SuggestedTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > 0.01) {
      transfers.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transfers;
}

export async function createGroupExpense(
  groupId: string,
  paidBy: string,
  input: CreateGroupExpenseInput
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isMember = group.members.some(
    (m) => m.userId.toString() === paidBy
  );
  if (!isMember) throw new Error("Not a member of this group");

  if (group.members.length < 2) {
    throw new Error("Cannot create group expenses in a single-member group");
  }

  // Default: split equally among all members if splitAmong not provided
  let splitAmong = input.splitAmong;
  // An explicit splitAmong with no declared type is a set of exact amounts.
  let splitType = input.splitType ?? "exact";
  if (!splitAmong || splitAmong.length === 0) {
    splitType = "equal";
    splitAmong = splitEqually(input.amount, group.members.map((m) => m.userId.toString()));
  } else {
    const uniqueUserIds = new Set(splitAmong.map((s) => s.userId));
    if (uniqueUserIds.size !== splitAmong.length) {
      throw new Error("Duplicate users in splitAmong are not allowed");
    }
    // Validate splitAmong users are group members
    const memberIds = new Set(group.members.map((m) => m.userId.toString()));
    for (const split of splitAmong) {
      if (!memberIds.has(split.userId)) {
        throw new Error(`User ${split.userId} is not a member of this group`);
      }
    }
    // Validate splitAmong amounts sum to total
    const splitSum = splitAmong.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitSum - input.amount) > 0.01) {
      throw new Error(`Split amounts (${splitSum}) must equal the expense total (${input.amount})`);
    }
    // Percentages only mean something on a percentage split — drop stale ones.
    if (splitType !== "percentage") {
      splitAmong = splitAmong.map(({ userId, amount }) => ({ userId, amount }));
    }
  }

  const expense = await GroupExpense.create({
    groupId,
    paidBy,
    title: input.title,
    amount: input.amount,
    category: input.category,
    notes: input.notes,
    splitType,
    splitAmong,
  });

  logger.info("Group expense created", { groupId, expenseId: expense._id });

  // Fire-and-forget push to every other member of the group.
  void (async () => {
    const payerName = await getUserDisplayName(paidBy);
    const recipients = group.members
      .map((m) => m.userId.toString())
      .filter((id) => id !== paidBy);
    await sendToUsers(recipients, {
      title: group.name,
      body: `${payerName} added ${input.title} (₹${input.amount}) in ${group.name}`,
      data: { type: "group", groupId: group._id.toString() },
    });
  })().catch((error) => logger.error("Group expense push failed", { error }));

  return expense;
}

export async function findGroupExpenses(
  groupId: string,
  options: { page: number; limit: number }
) {
  const filter = { groupId: new mongoose.Types.ObjectId(groupId) };

  const [expenses, total, aggregation] = await Promise.all([
    GroupExpense.find(filter)
      .populate("paidBy", "email firstName lastName name")
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    GroupExpense.countDocuments(filter),
    GroupExpense.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]),
  ]);

  const totalAmount = aggregation[0]?.totalAmount ?? 0;

  return {
    expenses,
    total,
    totalAmount,
    pagination: createPaginationMeta(options.page, options.limit, total),
  };
}

export async function findGroupExpenseById(
  groupId: string,
  expenseId: string
) {
  return GroupExpense.findOne({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
  }).populate("paidBy", "email firstName lastName name");
}

export async function updateGroupExpense(
  groupId: string,
  expenseId: string,
  userId: string,
  input: UpdateGroupExpenseInput
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const isMember = group.members.some(
    (m) => m.userId.toString() === userId
  );
  if (!isMember) throw new Error("Not a member of this group");

  const expense = await GroupExpense.findOne({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
  });
  if (!expense) return null;

  const isExpenseCreator = expense.paidBy.toString() === userId;
  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isExpenseCreator && !isAdmin) {
    throw new Error("Only the expense creator or a group admin can update this expense");
  }

  if (input.paidBy) {
    const memberIds = new Set(group.members.map((m) => m.userId.toString()));
    if (!memberIds.has(input.paidBy)) {
      throw new Error(`User ${input.paidBy} is not a member of this group`);
    }
  }

  // If amount changed and splitAmong not provided, re-split across the
  // EXISTING participants, not all group members.
  if (input.amount !== undefined && !input.splitAmong) {
    const currentParticipants = expense.splitAmong.map((s) => s.userId.toString());
    const participants = currentParticipants.length > 0
      ? currentParticipants
      : group.members.map((m) => m.userId.toString());
    // A percentage split keeps its percentages when the total changes.
    if (expense.splitType === "percentage" && expense.splitAmong.every((s) => typeof s.percentage === "number")) {
      input.splitAmong = splitByPercentage(
        input.amount,
        expense.splitAmong.map((s) => ({ userId: s.userId.toString(), percentage: s.percentage! }))
      );
    } else {
      input.splitAmong = splitEqually(input.amount, participants);
      input.splitType = "equal";
    }
  } else if (input.splitAmong) {
    const uniqueUserIds = new Set(input.splitAmong.map((s) => s.userId));
    if (uniqueUserIds.size !== input.splitAmong.length) {
      throw new Error("Duplicate users in splitAmong are not allowed");
    }
    // Validate splitAmong users are group members or existing participants
    // (grandfather members who left the group after this expense was created)
    const allowedIds = new Set([
      ...group.members.map((m) => m.userId.toString()),
      ...expense.splitAmong.map((s) => s.userId.toString()),
    ]);
    for (const split of input.splitAmong) {
      if (!allowedIds.has(split.userId)) {
        throw new Error(`User ${split.userId} is not a member of this group`);
      }
    }
    // Validate splitAmong amounts sum to total
    const total = input.amount ?? expense.amount;
    const splitSum = input.splitAmong.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitSum - total) > 0.01) {
      throw new Error(`Split amounts (${splitSum}) must equal the expense total (${total})`);
    }
    // An explicit splitAmong with no declared type is a set of exact amounts.
    input.splitType = input.splitType ?? "exact";
    // Percentages only mean something on a percentage split — drop stale ones.
    if (input.splitType !== "percentage") {
      input.splitAmong = input.splitAmong.map(({ userId, amount }) => ({ userId, amount }));
    }
  }

  const updated = await GroupExpense.findOneAndUpdate(
    { _id: expenseId, groupId: new mongoose.Types.ObjectId(groupId) },
    { $set: input },
    { new: true, runValidators: true }
  ).populate("paidBy", "email firstName lastName name");

  if (updated) logger.info("Group expense updated", { groupId, expenseId });
  return updated;
}

export async function deleteGroupExpense(
  groupId: string,
  expenseId: string,
  userId: string
) {
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  const expense = await GroupExpense.findOne({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
  });
  if (!expense) return null;

  const isExpenseCreator = expense.paidBy.toString() === userId;
  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isExpenseCreator && !isAdmin) {
    throw new Error("Only the expense creator or a group admin can delete this expense");
  }

  return GroupExpense.findOneAndDelete({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
  });
}

export async function getGroupBalances(groupId: string) {
  const groupObjectId = new mongoose.Types.ObjectId(groupId);
  const match = { groupId: groupObjectId };

  // All aggregations return at most N rows (N = distinct users in the group),
  // not one row per expense — memory footprint is independent of expense count.
  const [paidTotals, splitTotals, settlementTotals] = await Promise.all([
    // Credits: amount each user paid as the expense payer
    GroupExpense.aggregate<{ _id: mongoose.Types.ObjectId; total: number }>([
      { $match: match },
      { $group: { _id: "$paidBy", total: { $sum: "$amount" } } },
    ]),
    // Debits: amount each user owes from being in splitAmong
    GroupExpense.aggregate<{ _id: mongoose.Types.ObjectId; total: number }>([
      { $match: match },
      { $unwind: "$splitAmong" },
      { $group: { _id: "$splitAmong.userId", total: { $sum: "$splitAmong.amount" } } },
    ]),
    // Settlements: payer's debt decreases, receiver's credit decreases
    Settlement.aggregate<{
      paid: Array<{ _id: mongoose.Types.ObjectId; total: number }>;
      received: Array<{ _id: mongoose.Types.ObjectId; total: number }>;
    }>([
      { $match: match },
      {
        $facet: {
          paid: [{ $group: { _id: "$paidBy", total: { $sum: "$amount" } } }],
          received: [{ $group: { _id: "$paidTo", total: { $sum: "$amount" } } }],
        },
      },
    ]),
  ]);

  const balances: Record<string, number> = {};
  const add = (userId: mongoose.Types.ObjectId, delta: number) => {
    const key = userId.toString();
    balances[key] = (balances[key] || 0) + delta;
  };

  for (const row of paidTotals) add(row._id, row.total);
  for (const row of splitTotals) add(row._id, -row.total);

  const settlement = settlementTotals[0];
  if (settlement) {
    for (const row of settlement.paid) add(row._id, row.total);
    for (const row of settlement.received) add(row._id, -row.total);
  }

  for (const key of Object.keys(balances)) {
    balances[key] = Math.round(balances[key]! * 100) / 100 || 0;
  }

  return balances;
}
