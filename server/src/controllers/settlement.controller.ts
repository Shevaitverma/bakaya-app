import { getAuthUser } from "@/middleware/auth";
import { createSettlementSchema, settlementQuerySchema } from "@/schemas/settlement.schema";
import * as settlementService from "@/services/settlement.service";
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

export async function getSettlements(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const url = new URL(req.url);
    const query = settlementQuerySchema.parse(Object.fromEntries(url.searchParams));

    const result = await settlementService.findSettlementsByGroup(groupId, query);

    return successResponse({
      settlements: result.settlements,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get settlements error", { error });
    throw error;
  }
}

export async function createSettlement(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const body = await req.json();
    const input = createSettlementSchema.parse(body);

    // Enforce that only the authenticated user can record settlements they made
    if (input.paidBy !== userId) {
      return forbiddenResponse("You can only record settlements you made");
    }

    const settlement = await settlementService.createSettlement(groupId, input);

    return successResponse(settlement, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid settlement data");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "paidBy user is not a member of this group") return forbiddenResponse(error.message);
      if (error.message === "paidTo user is not a member of this group") return forbiddenResponse(error.message);
      if (error.message === "paidBy and paidTo cannot be the same user") return badRequestResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Create settlement error", { error });
    throw error;
  }
}

export async function deleteSettlement(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const settlementId = params?.settlementId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!settlementId) return badRequestResponse("Settlement ID is required");

    // Validate group membership
    const membershipError = await validateGroupMembership(groupId, userId);
    if (membershipError) return membershipError;

    const deleted = await settlementService.deleteSettlement(settlementId, groupId);
    if (!deleted) return notFoundResponse("Settlement not found");

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("Delete settlement error", { error });
    throw error;
  }
}
