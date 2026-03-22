import { Expense } from "@/models/Expense";
import mongoose from "mongoose";
import type { AnalyticsQueryInput } from "@/schemas/analytics.schema";

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(query: AnalyticsQueryInput): DateRange {
  if (query.startDate && query.endDate) {
    return {
      start: new Date(query.startDate),
      end: new Date(query.endDate),
    };
  }

  // Default: current month (1st of month to now)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end: now };
}

function buildMatchStage(
  userId: string,
  query: AnalyticsQueryInput
): Record<string, unknown> {
  const { start, end } = getDateRange(query);

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: start, $lte: end },
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
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
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
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
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
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    },
  };
}

export async function getTrends(userId: string, query: AnalyticsQueryInput) {
  // For trends, default to last 6 months if no date range provided
  const hasCustomRange = query.startDate && query.endDate;

  let start: Date;
  let end: Date;

  if (hasCustomRange) {
    start = new Date(query.startDate!);
    end = new Date(query.endDate!);
  } else {
    end = new Date();
    start = new Date(end.getFullYear(), end.getMonth() - 5, 1); // 6 months back
  }

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: start, $lte: end },
  };

  if (query.profileId) {
    match.profileId = new mongoose.Types.ObjectId(query.profileId);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
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
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    },
  };
}
