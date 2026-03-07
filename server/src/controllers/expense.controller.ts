import { getAuthUser } from "@/middleware/auth";
import { createExpenseSchema, expenseQuerySchema } from "@/schemas/expense.schema";
import * as expenseService from "@/services/expense.service";
import { successResponse, badRequestResponse, notFoundResponse } from "@/utils/response";
import { createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getPersonalExpenses(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = expenseQuerySchema.parse(Object.fromEntries(url.searchParams));

    const { expenses, total, totalExpenseAmount } = await expenseService.findExpensesByUser(userId, query);

    return successResponse({
      expenses,
      totalExpenseAmount,
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

export async function createPersonalExpense(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = createExpenseSchema.parse(body);

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
