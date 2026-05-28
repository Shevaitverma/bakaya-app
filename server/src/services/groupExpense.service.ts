import { GroupExpense } from "@/models/GroupExpense";
import { Group } from "@/models/Group";
import { Settlement } from "@/models/Settlement";
import type { CreateGroupExpenseInput, UpdateGroupExpenseInput } from "@/schemas/groupExpense.schema";
import { createPaginationMeta } from "@/utils/pagination";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

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

  // math-audit #2.11 High: block expense creation in single-member groups (paidBy == splitAmong self)
  if (group.members.length < 2) {
    throw new Error("Cannot create group expenses in a single-member group");
  }

  // Default: split equally among all members if splitAmong not provided
  let splitAmong = input.splitAmong;
  if (!splitAmong || splitAmong.length === 0) {
    const n = group.members.length;
    // math-audit #2.2 High: reject auto-split when per-member share would round to 0
    if (input.amount / n < 0.01) {
      throw new Error("Expense amount is too small to split");
    }
    const baseAmount = Math.floor((input.amount / n) * 100) / 100;
    const remainder = Math.round((input.amount - baseAmount * n) * 100) / 100;
    splitAmong = group.members.map((m, i) => ({
      userId: m.userId.toString(),
      // math-audit #2.3 High: round baseAmount+remainder to avoid FP drift
      amount: i === 0 ? Math.round((baseAmount + remainder) * 100) / 100 : baseAmount,
    }));
  } else {
    // math-audit #2.10 High: reject duplicate userIds in splitAmong
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
  }

  const expense = await GroupExpense.create({
    groupId,
    paidBy,
    title: input.title,
    amount: input.amount,
    category: input.category,
    notes: input.notes,
    splitAmong,
  });

  logger.info("Group expense created", { groupId, expenseId: expense._id });
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

  // math-audit #2.5 Critical: only expense creator (paidBy) or group admin may update
  const isExpenseCreator = expense.paidBy.toString() === userId;
  const isAdmin = group.members.some(
    (m) => m.userId.toString() === userId && m.role === "admin"
  );
  if (!isExpenseCreator && !isAdmin) {
    throw new Error("Only the expense creator or a group admin can update this expense");
  }

  // logic-bug-hunt BUG-03 High: if paidBy is changing, verify the new payer is a group member
  if (input.paidBy) {
    const memberIds = new Set(group.members.map((m) => m.userId.toString()));
    if (!memberIds.has(input.paidBy)) {
      throw new Error(`User ${input.paidBy} is not a member of this group`);
    }
  }

  // If amount changed and splitAmong not provided, re-split across the EXISTING
  // splitAmong members (math-audit #2.4 Critical: previously re-split across all group members).
  if (input.amount !== undefined && !input.splitAmong) {
    const currentParticipants = expense.splitAmong.map((s) => s.userId.toString());
    const n = currentParticipants.length || group.members.length;
    if (input.amount / n < 0.01) {
      throw new Error("Expense amount is too small to split");
    }
    const baseAmount = Math.floor((input.amount / n) * 100) / 100;
    const remainder = Math.round((input.amount - baseAmount * n) * 100) / 100;
    const participants = currentParticipants.length > 0
      ? currentParticipants
      : group.members.map((m) => m.userId.toString());
    input.splitAmong = participants.map((uid, i) => ({
      userId: uid,
      // math-audit #2.3 High: round baseAmount+remainder to avoid FP drift
      amount: i === 0 ? Math.round((baseAmount + remainder) * 100) / 100 : baseAmount,
    }));
  } else if (input.splitAmong) {
    // math-audit #2.10 High: reject duplicate userIds in splitAmong
    const uniqueUserIds = new Set(input.splitAmong.map((s) => s.userId));
    if (uniqueUserIds.size !== input.splitAmong.length) {
      throw new Error("Duplicate users in splitAmong are not allowed");
    }
    // Validate splitAmong users are group members
    const memberIds = new Set(group.members.map((m) => m.userId.toString()));
    for (const split of input.splitAmong) {
      if (!memberIds.has(split.userId)) {
        throw new Error(`User ${split.userId} is not a member of this group`);
      }
    }
    // Validate splitAmong amounts sum to total
    const total = input.amount ?? expense.amount;
    const splitSum = input.splitAmong.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitSum - total) > 0.01) {
      throw new Error(`Split amounts (${splitSum}) must equal the expense total (${total})`);
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
  // logic-bug-hunt BUG-06 High: admins should be able to delete any expense;
  // and distinguish "not found" from "forbidden" for better client error mapping.
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

  return balances;
}
