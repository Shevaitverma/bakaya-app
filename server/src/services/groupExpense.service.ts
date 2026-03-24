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

  // Default: split equally among all members if splitAmong not provided
  let splitAmong = input.splitAmong;
  if (!splitAmong || splitAmong.length === 0) {
    const n = group.members.length;
    const baseAmount = Math.floor((input.amount / n) * 100) / 100;
    const remainder = Math.round((input.amount - baseAmount * n) * 100) / 100;
    splitAmong = group.members.map((m, i) => ({
      userId: m.userId.toString(),
      amount: i === 0 ? baseAmount + remainder : baseAmount,
    }));
  } else {
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
      .limit(options.limit),
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

  // If amount changed and splitAmong not provided, recalculate equal split
  if (input.amount !== undefined && !input.splitAmong) {
    const n = group.members.length;
    const baseAmount = Math.floor((input.amount / n) * 100) / 100;
    const remainder = Math.round((input.amount - baseAmount * n) * 100) / 100;
    input.splitAmong = group.members.map((m, i) => ({
      userId: m.userId.toString(),
      amount: i === 0 ? baseAmount + remainder : baseAmount,
    }));
  } else if (input.splitAmong) {
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
  return GroupExpense.findOneAndDelete({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
    paidBy: userId,
  });
}

export async function getGroupBalances(groupId: string) {
  const groupObjectId = new mongoose.Types.ObjectId(groupId);

  const [expenses, settlements] = await Promise.all([
    GroupExpense.find({ groupId: groupObjectId }),
    Settlement.find({ groupId: groupObjectId }),
  ]);

  // Calculate how much each person paid and how much they owe
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    const payerId = expense.paidBy.toString();
    // Payer gets credit for the full amount
    balances[payerId] = (balances[payerId] || 0) + expense.amount;

    // Each person in splitAmong owes their share
    for (const split of expense.splitAmong) {
      const debtor = split.userId.toString();
      balances[debtor] = (balances[debtor] || 0) - split.amount;
    }
  }

  // Factor in settlements
  for (const settlement of settlements) {
    const paidById = settlement.paidBy.toString();
    const paidToId = settlement.paidTo.toString();
    // The payer reduces their debt (or increases their credit)
    balances[paidById] = (balances[paidById] || 0) + settlement.amount;
    // The receiver's credit is reduced (they received what was owed)
    balances[paidToId] = (balances[paidToId] || 0) - settlement.amount;
  }

  return balances;
}
