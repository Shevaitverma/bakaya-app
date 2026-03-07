import { GroupExpense } from "@/models/GroupExpense";
import { Group } from "@/models/Group";
import type { CreateGroupExpenseInput } from "@/schemas/groupExpense.schema";
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
    const perPerson = input.amount / group.members.length;
    splitAmong = group.members.map((m) => ({
      userId: m.userId.toString(),
      amount: Math.round(perPerson * 100) / 100,
    }));
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

export async function deleteGroupExpense(
  groupId: string,
  expenseId: string,
  userId: string
) {
  return GroupExpense.findOneAndDelete({
    _id: expenseId,
    groupId: new mongoose.Types.ObjectId(groupId),
  });
}

export async function getGroupBalances(groupId: string) {
  const expenses = await GroupExpense.find({
    groupId: new mongoose.Types.ObjectId(groupId),
  });

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

  return balances;
}
