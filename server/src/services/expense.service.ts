import { Expense } from "@/models/Expense";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/schemas/expense.schema";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import { parseISTDate } from "@/utils/date";

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
    type?: string;
    source?: string;
    search?: string;
    category?: string;
    profileId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

  if (options.type) {
    filter.type = options.type;
  }

  if (options.source) {
    filter.source = options.source;
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.profileId) {
    filter.profileId = new mongoose.Types.ObjectId(options.profileId);
  }

  if (options.startDate || options.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (options.startDate) {
      dateFilter.$gte = parseISTDate(options.startDate);
    }
    if (options.endDate) {
      dateFilter.$lte = parseISTDate(options.endDate, true);
    }
    filter.createdAt = dateFilter;
  }

  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { notes: { $regex: escaped, $options: "i" } },
    ];
  }

  const [expenses, total, incomeAgg, expenseAgg] = await Promise.all([
    Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: { ...filter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { ...filter, type: { $ne: "income" } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total ?? 0;
  const totalExpenses = expenseAgg[0]?.total ?? 0;

  return {
    expenses,
    total,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    totalExpenseAmount: totalExpenses,
  };
}

export async function exportExpensesCSV(
  userId: string,
  options: {
    type?: string;
    category?: string;
    profileId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

  if (options.type) {
    filter.type = options.type;
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.profileId) {
    filter.profileId = new mongoose.Types.ObjectId(options.profileId);
  }

  if (options.startDate || options.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (options.startDate) {
      dateFilter.$gte = parseISTDate(options.startDate);
    }
    if (options.endDate) {
      dateFilter.$lte = parseISTDate(options.endDate, true);
    }
    filter.createdAt = dateFilter;
  }

  return Expense.find(filter)
    .sort({ createdAt: -1 })
    .populate("profileId", "name");
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
