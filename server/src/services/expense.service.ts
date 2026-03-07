import { Expense } from "@/models/Expense";
import type { CreateExpenseInput } from "@/schemas/expense.schema";
import mongoose from "mongoose";

export async function createExpense(userId: string, input: CreateExpenseInput) {
  return Expense.create({ ...input, userId });
}

export async function findExpensesByUser(
  userId: string,
  options: { page: number; limit: number; category?: string }
) {
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (options.category) {
    filter.category = options.category;
  }

  const [expenses, total, aggregation] = await Promise.all([
    Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalExpenseAmount: { $sum: "$amount" } } },
    ]),
  ]);

  const totalExpenseAmount = aggregation[0]?.totalExpenseAmount ?? 0;

  return { expenses, total, totalExpenseAmount };
}

export async function deleteExpense(userId: string, expenseId: string) {
  return Expense.findOneAndDelete({
    _id: expenseId,
    userId: new mongoose.Types.ObjectId(userId),
  });
}
