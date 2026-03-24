import { Expense } from "@/models/Expense";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/schemas/expense.schema";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

export async function createExpense(userId: string, input: CreateExpenseInput) {
  return Expense.create({ ...input, userId });
}

export async function findExpenseById(expenseId: string) {
  return Expense.findById(expenseId);
}

export async function findExpensesByUser(
  userId: string,
  options: {
    page: number;
    limit: number;
    category?: string;
    profileId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

  if (options.category) {
    filter.category = options.category;
  }

  if (options.profileId) {
    filter.profileId = new mongoose.Types.ObjectId(options.profileId);
  }

  if (options.startDate || options.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (options.startDate) {
      dateFilter.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    filter.createdAt = dateFilter;
  }

  const [expenses, total, aggregation] = await Promise.all([
    Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, totalExpenseAmount: { $sum: "$amount" } } },
    ]),
  ]);

  const totalExpenseAmount = aggregation[0]?.totalExpenseAmount ?? 0;

  return { expenses, total, totalExpenseAmount };
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput
) {
  const updated = await Expense.findOneAndUpdate(
    {
      _id: expenseId,
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: input },
    { new: true, runValidators: true }
  );

  if (updated) logger.info("Expense updated", { expenseId, userId });
  return updated;
}

export async function deleteExpense(userId: string, expenseId: string) {
  return Expense.findOneAndDelete({
    _id: expenseId,
    userId: new mongoose.Types.ObjectId(userId),
  });
}
