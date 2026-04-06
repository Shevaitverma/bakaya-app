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

  // For custom date ranges (historical), use the period end directly;
  // for default (current month), cap at today so future days aren't counted as elapsed
  const hasCustomRange = query.startDate && query.endDate;
  const effectiveEnd = hasCustomRange ? end : new Date(Math.min(end.getTime(), Date.now()));
  const daysPassed = Math.max(
    1,
    Math.ceil(
      (effectiveEnd.getTime() - start.getTime()) / 86400000
    )
  );

  // For budget calculation, use end-of-month as the period end
  // so there are remaining days to budget against
  const periodEnd = query.startDate && query.endDate
    ? end
    : (() => {
        const nowStr = toISTDateStr(new Date());
        const y = parseInt(nowStr.slice(0, 4));
        const m = parseInt(nowStr.slice(5, 7));
        const lastDay = new Date(y, m, 0); // last day of current month
        lastDay.setHours(23, 59, 59, 999);
        return lastDay;
      })();

  const daysInPeriod = Math.max(
    1,
    Math.ceil((periodEnd.getTime() - start.getTime()) / 86400000)
  );
  const dailySpendingRate = Math.round((totalExpenses / daysPassed) * 100) / 100;
  const daysRemaining = Math.max(0, daysInPeriod - daysPassed);
  const dailyBudgetRate =
    daysRemaining > 0 && balance > 0
      ? Math.round((balance / daysRemaining) * 100) / 100
      : 0;

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
    const endStr = toISTDateStr(end);
    const ey = parseInt(endStr.slice(0, 4));
    const em = parseInt(endStr.slice(5, 7));
    // Subtract 5 months (current month + 5 previous = 6 months total)
    const startMonth = em - 5;
    const startYear = ey + Math.floor((startMonth - 1) / 12);
    const normMonth = ((((startMonth - 1) % 12) + 12) % 12) + 1;
    const startStr = `${startYear}-${String(normMonth).padStart(2, "0")}-01`;
    start = parseISTDate(startStr);
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
