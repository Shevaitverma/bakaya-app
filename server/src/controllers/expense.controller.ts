import { getAuthUser } from "@/middleware/auth";
import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema, type ExpenseQueryInput } from "@/schemas/expense.schema";
import * as expenseService from "@/services/expense.service";
import { createDefaultProfile, findProfileById } from "@/services/profile.service";
import { User } from "@/models/User";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/utils/response";
import { createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getPersonalExpenses(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = expenseQuerySchema.parse(Object.fromEntries(url.searchParams));

    const { expenses, total, totalExpenseAmount, totalIncome, totalExpenses, balance } = await expenseService.findExpensesByUser(userId, query);

    return successResponse({
      expenses,
      totalExpenseAmount,
      totalIncome,
      totalExpenses,
      balance,
      pagination: createPaginationMeta(query.page, query.limit, total),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get personal expenses error", { error });
    throw error;
  }
}

export async function getPersonalExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const expenseId = params?.id;
    if (!expenseId) return badRequestResponse("Expense ID is required");

    const expense = await expenseService.findExpenseById(expenseId);
    if (!expense) return notFoundResponse("Expense not found");

    // Validate ownership
    if (expense.userId.toString() !== userId) {
      return forbiddenResponse("Not authorized to access this expense");
    }

    return successResponse(expense);
  } catch (error) {
    logger.error("Get personal expense error", { error });
    throw error;
  }
}

export async function createPersonalExpense(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = createExpenseSchema.parse(body);

    // If no profileId provided, auto-assign to default profile (create if needed)
    if (!input.profileId) {
      const user = await User.findById(userId).select("firstName lastName name");
      const userName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined;
      const defaultProfile = await createDefaultProfile(userId, userName);
      input.profileId = defaultProfile._id.toString();
    } else {
      // Validate that the profileId belongs to the authenticated user
      const profile = await findProfileById(input.profileId);
      if (!profile) {
        return notFoundResponse("Profile not found");
      }
      if (profile.userId.toString() !== userId) {
        return forbiddenResponse("Not authorized to use this profile");
      }
    }

    const expense = await expenseService.createExpense(userId, input);

    logger.info("Expense created", { userId, expenseId: expense._id });

    return successResponse(expense.toJSON(), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid expense data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Create expense error", { error });
    throw error;
  }
}

export async function updatePersonalExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const expenseId = params?.id;
    if (!expenseId) return badRequestResponse("Expense ID is required");

    const body = await req.json();
    const input = updateExpenseSchema.parse(body);

    // Validate profileId ownership if provided
    if (input.profileId) {
      const profile = await findProfileById(input.profileId);
      if (!profile) {
        return notFoundResponse("Profile not found");
      }
      if (profile.userId.toString() !== userId) {
        return forbiddenResponse("Not authorized to use this profile");
      }
    }

    const expense = await expenseService.updateExpense(userId, expenseId, input);
    if (!expense) return notFoundResponse("Expense not found");

    logger.info("Expense updated", { userId, expenseId });

    return successResponse(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid expense data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Update expense error", { error });
    throw error;
  }
}

export async function deletePersonalExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const expenseId = params?.id;

    if (!expenseId) {
      return badRequestResponse("Expense ID is required");
    }

    const deleted = await expenseService.deleteExpense(userId, expenseId);

    if (!deleted) {
      return notFoundResponse("Expense not found");
    }

    logger.info("Expense deleted", { userId, expenseId });

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("Delete expense error", { error });
    throw error;
  }
}

export async function exportExpensesCSVHandler(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = expenseQuerySchema.parse(Object.fromEntries(url.searchParams));

    const expenses = await expenseService.exportExpensesCSV(userId, {
      type: query.type,
      category: query.category,
      profileId: query.profileId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const csvHeaders = "Date,Type,Title,Amount,Category,Source,Profile,Notes";
    const csvRows = expenses.map((e) => {
      const date = e.createdAt.toISOString().split("T")[0];
      const type = e.type || "expense";
      const title = csvEscape(e.title);
      const amount = e.amount;
      const category = csvEscape(e.category || "");
      const source = csvEscape(e.source || "");
      const profile = csvEscape(
        (e.profileId && typeof e.profileId === "object" && "name" in e.profileId)
          ? (e.profileId as unknown as { name: string }).name
          : ""
      );
      const notes = csvEscape(e.notes || "");
      return `${date},${type},${title},${amount},${category},${source},${profile},${notes}`;
    });

    const csv = [csvHeaders, ...csvRows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="bakaya-export.csv"',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Export expenses CSV error", { error });
    throw error;
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
