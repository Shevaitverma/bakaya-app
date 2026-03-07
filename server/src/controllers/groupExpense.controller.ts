import { getAuthUser } from "@/middleware/auth";
import { createGroupExpenseSchema, groupExpenseQuerySchema } from "@/schemas/groupExpense.schema";
import * as groupExpenseService from "@/services/groupExpense.service";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getGroupExpenses(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const url = new URL(req.url);
    const query = groupExpenseQuerySchema.parse(Object.fromEntries(url.searchParams));

    const result = await groupExpenseService.findGroupExpenses(groupId, query);

    return successResponse({
      expenses: result.expenses,
      totalAmount: result.totalAmount,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get group expenses error", { error });
    throw error;
  }
}

export async function createGroupExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const body = await req.json();
    const input = createGroupExpenseSchema.parse(body);

    const expense = await groupExpenseService.createGroupExpense(groupId, userId, input);

    return successResponse(expense, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid expense data");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Not a member of this group") return forbiddenResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Create group expense error", { error });
    throw error;
  }
}

export async function deleteGroupExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const expenseId = params?.expenseId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!expenseId) return badRequestResponse("Expense ID is required");

    const deleted = await groupExpenseService.deleteGroupExpense(groupId, expenseId, userId);
    if (!deleted) return notFoundResponse("Expense not found");

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("Delete group expense error", { error });
    throw error;
  }
}

export async function getGroupBalances(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const balances = await groupExpenseService.getGroupBalances(groupId);

    return successResponse({ balances });
  } catch (error) {
    logger.error("Get group balances error", { error });
    throw error;
  }
}
