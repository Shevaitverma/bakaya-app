import { Expense } from "@/models/Expense";
import mongoose from "mongoose";
import type { AnalyticsQueryInput } from "@/schemas/analytics.schema";
import { toISTDateStr, parseISTDate } from "@/utils/date";

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(query: AnalyticsQueryInput): DateRange {
  if (query.startDate && query.endDate) {
    return {
      start: parseISTDate(query.startDate),
      end: parseISTDate(query.endDate, true),
    };
  }

  // Default: current month (1st of month to now) in IST
  const now = new Date();
  const nowStr = toISTDateStr(now);
  const y = nowStr.slice(0, 4);
  const m = nowStr.slice(5, 7);
  return {
    start: parseISTDate(`${y}-${m}-01`),
    end: now,
  };
}

function buildMatchStage(
  userId: string,
  query: AnalyticsQueryInput
): Record<string, unknown> {
  const { start, end } = getDateRange(query);

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: start, $lte: end },
    type: { $ne: "income" },
  };

  if (query.profileId) {
    match.profileId = new mongoose.Types.ObjectId(query.profileId);
  }

  return match;
}

export async function getSummary(userId: string, query: AnalyticsQueryInput) {
  const match = buildMatchStage(userId, query);
  const { start, end } = getDateRange(query);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: "$profileId",
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "_id",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        profileId: "$_id",
        profileName: { $ifNull: ["$profile.name", "Unknown"] },
        total: 1,
      },
    },
    { $sort: { total: -1 as const } },
  ];

  const byProfile = await Expense.aggregate(pipeline);
  const totalSpent = byProfile.reduce(
    (sum: number, p: { total: number }) => sum + p.total,
    0
  );

  return {
    totalSpent,
    byProfile,
    period: {
      start: toISTDateStr(start),
      end: toISTDateStr(end),
    },
  };
}

export async function getByProfile(
  userId: string,
  query: AnalyticsQueryInput
) {
  const match = buildMatchStage(userId, query);
  const { start, end } = getDateRange(query);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: "$profileId",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "_id",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        profileId: "$_id",
        profileName: { $ifNull: ["$profile.name", "Unknown"] },
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 as const } },
  ];

  const profiles = await Expense.aggregate(pipeline);
  const totalSpent = profiles.reduce(
    (sum: number, p: { total: number }) => sum + p.total,
    0
  );

  return {
    profiles,
    totalSpent,
    period: {
      start: toISTDateStr(start),
      end: toISTDateStr(end),
    },
  };
}

export async function getByCategory(
  userId: string,
  query: AnalyticsQueryInput
) {
  const match = buildMatchStage(userId, query);
  const { start, end } = getDateRange(query);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$category", "Uncategorized"] },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 as const } },
  ];

  const categories = await Expense.aggregate(pipeline);
  const totalSpent = categories.reduce(
    (sum: number, c: { total: number }) => sum + c.total,
    0
  );

  return {
    categories,
    totalSpent,
    period: {
      start: toISTDateStr(start),
      end: toISTDateStr(end),
    },
  };
}

export async function getBalance(userId: string, query: AnalyticsQueryInput) {
  const { start, end } = getDateRange(query);
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: start, $lte: end },
  };
  if (query.profileId) {
    match.profileId = new mongoose.Types.ObjectId(query.profileId);
  }

  const results = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$type", "expense"] },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byType = Object.fromEntries(
    results.map((r: { _id: string; total: number; count: number }) => [
      r._id,
      { total: r.total, count: r.count },
    ])
  );
  const totalIncome = byType.income?.total ?? 0;
  const totalExpenses = byType.expense?.total ?? 0;
  const balance = totalIncome - totalExpenses;

  const daysPassed = Math.max(
    1,
    Math.ceil(
      (Math.min(end.getTime(), Date.now()) - start.getTime()) / 86400000
    )
  );
  const daysInPeriod = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86400000)
  );
  const dailySpendingRate = Math.round((totalExpenses / daysPassed) * 100) / 100;
  const dailyBudgetRate =
    totalIncome > 0 ? Math.round((totalIncome / daysInPeriod) * 100) / 100 : 0;
  const daysRemaining = Math.max(0, daysInPeriod - daysPassed);

  return {
    totalIncome,
    totalExpenses,
    balance,
    expenseCount: byType.expense?.count ?? 0,
    incomeCount: byType.income?.count ?? 0,
    spentPercentage:
      totalIncome > 0
        ? Math.round((totalExpenses / totalIncome) * 100)
        : totalExpenses > 0
          ? 100
          : 0,
    dailySpendingRate,
    dailyBudgetRate,
    daysRemaining,
    period: {
      start: toISTDateStr(start),
      end: toISTDateStr(end),
    },
  };
}

export async function getTrends(userId: string, query: AnalyticsQueryInput) {
  // For trends, default to last 6 months if no date range provided
  const hasCustomRange = query.startDate && query.endDate;

  let start: Date;
  let end: Date;

  if (hasCustomRange) {
    start = parseISTDate(query.startDate!);
    end = parseISTDate(query.endDate!, true);
  } else {
    end = new Date();
    // 6 months back, 1st of that month, IST midnight
    const istEnd = new Date(end.getTime() + 5.5 * 60 * 60 * 1000);
    const sm = istEnd.getUTCMonth() - 5; // may be negative, Date.UTC handles it
    start = new Date(Date.UTC(istEnd.getUTCFullYear(), sm, 1) - 5.5 * 60 * 60 * 1000);
  }

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: start, $lte: end },
    type: { $ne: "income" },
  };

  if (query.profileId) {
    match.profileId = new mongoose.Types.ObjectId(query.profileId);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: { date: "$createdAt", timezone: "Asia/Kolkata" } },
          month: { $month: { date: "$createdAt", timezone: "Asia/Kolkata" } },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        total: 1,
        count: 1,
      },
    },
    { $sort: { year: 1 as const, month: 1 as const } },
  ];

  const months = await Expense.aggregate(pipeline);

  return {
    months,
    period: {
      start: toISTDateStr(start),
      end: toISTDateStr(end),
    },
  };
}
