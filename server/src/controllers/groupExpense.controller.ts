import { getAuthUser } from "@/middleware/auth";
import { createGroupExpenseSchema, updateGroupExpenseSchema, groupExpenseQuerySchema } from "@/schemas/groupExpense.schema";
import * as groupExpenseService from "@/services/groupExpense.service";
import * as groupService from "@/services/group.service";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

async function validateGroupMembership(groupId: string, userId: string): Promise<Response | null> {
  const group = await groupService.findGroupById(groupId);
  if (!group) return notFoundResponse("Group not found");

  const isMember = group.members.some(
    (m: any) => (m.userId?._id || m.userId)?.toString() === userId
  );
  if (!isMember) return forbiddenResponse("Not a member of this group");

  return null;
}

// Split/validation errors thrown by the service that should surface as 400s.
function isSplitValidationError(message: string): boolean {
  return (
    message.startsWith("Duplicate users") ||
    message.startsWith("Cannot create group expenses") ||
    message.startsWith("Expense amount is too small") ||
    message.startsWith("Split amounts") ||
    message.includes("is not a member of this group")
  );
}

export async function getGroupExpenses(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

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

    // Validate group membership first (both to block non-members and to reuse for admin check)
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    // Only the authenticated user (or a group admin logging on someone's
    // behalf) may be set as paidBy.
    let paidBy = input.paidBy || userId;
    if (paidBy !== userId) {
      const group = await groupService.findGroupById(groupId);
      const isAdmin = !!group?.members.some(
        (m: any) =>
          ((m.userId?._id || m.userId)?.toString() === userId) && m.role === "admin"
      );
      if (!isAdmin) {
        return forbiddenResponse("You can only create expenses you paid for");
      }
    }

    const expense = await groupExpenseService.createGroupExpense(groupId, paidBy, input);

    return successResponse(expense, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid expense data");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Not a member of this group") return forbiddenResponse(error.message);
      if (isSplitValidationError(error.message)) return badRequestResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Create group expense error", { error });
    throw error;
  }
}

export async function getGroupExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const expenseId = params?.expenseId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!expenseId) return badRequestResponse("Expense ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const expense = await groupExpenseService.findGroupExpenseById(groupId, expenseId);
    if (!expense) return notFoundResponse("Expense not found");

    return successResponse(expense);
  } catch (error) {
    logger.error("Get group expense error", { error });
    throw error;
  }
}

export async function updateGroupExpense(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const expenseId = params?.expenseId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!expenseId) return badRequestResponse("Expense ID is required");

    const body = await req.json();
    const input = updateGroupExpenseSchema.parse(body);

    const expense = await groupExpenseService.updateGroupExpense(groupId, expenseId, userId, input);
    if (!expense) return notFoundResponse("Expense not found");

    return successResponse(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid expense data");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Not a member of this group") return forbiddenResponse(error.message);
      if (error.message === "Only the expense creator or a group admin can update this expense") {
        return forbiddenResponse(error.message);
      }
      if (isSplitValidationError(error.message)) return badRequestResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Update group expense error", { error });
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

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const deleted = await groupExpenseService.deleteGroupExpense(groupId, expenseId, userId);
    if (!deleted) return notFoundResponse("Expense not found");

    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Only the expense creator or a group admin can delete this expense") {
        return forbiddenResponse(error.message);
      }
    }
    logger.error("Delete group expense error", { error });
    throw error;
  }
}

export async function getGroupBalances(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const balances = await groupExpenseService.getGroupBalances(groupId);

    return successResponse({ balances });
  } catch (error) {
    logger.error("Get group balances error", { error });
    throw error;
  }
}

// Full settlement plan for the group — every pair, both directions, not just
// the caller's own debts.
export async function getSuggestedTransfers(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const balances = await groupExpenseService.getGroupBalances(groupId);

    return successResponse({ transfers: groupExpenseService.suggestTransfers(balances) });
  } catch (error) {
    logger.error("Get suggested transfers error", { error });
    throw error;
  }
}
