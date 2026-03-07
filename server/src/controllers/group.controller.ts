import { getAuthUser } from "@/middleware/auth";
import { createGroupSchema, updateGroupSchema, addMemberSchema, groupQuerySchema } from "@/schemas/group.schema";
import * as groupService from "@/services/group.service";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/utils/response";
import { createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getGroups(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = groupQuerySchema.parse(Object.fromEntries(url.searchParams));

    const { groups, total } = await groupService.findGroupsByMember(userId, query);

    return successResponse({
      groups,
      pagination: createPaginationMeta(query.page, query.limit, total),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get groups error", { error });
    throw error;
  }
}

export async function getGroup(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const group = await groupService.findGroupById(groupId);
    if (!group) return notFoundResponse("Group not found");

    const isMember = group.members.some(
      (m: any) => (m.userId?._id || m.userId)?.toString() === userId
    );
    if (!isMember) return forbiddenResponse("Not a member of this group");

    return successResponse(group);
  } catch (error) {
    logger.error("Get group error", { error });
    throw error;
  }
}

export async function createGroup(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = createGroupSchema.parse(body);

    const group = await groupService.createGroup(userId, input);
    return successResponse(group, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid group data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Create group error", { error });
    throw error;
  }
}

export async function updateGroup(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const body = await req.json();
    const input = updateGroupSchema.parse(body);

    const group = await groupService.updateGroup(groupId, userId, input);
    if (!group) return notFoundResponse("Group not found");

    return successResponse(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid group data");
    }
    if (error instanceof Error && error.message === "Only admins can update the group") {
      return forbiddenResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Update group error", { error });
    throw error;
  }
}

export async function deleteGroup(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const deleted = await groupService.deleteGroup(groupId, userId);
    if (!deleted) return notFoundResponse("Group not found");

    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Only the creator can delete the group") {
      return forbiddenResponse(error.message);
    }
    logger.error("Delete group error", { error });
    throw error;
  }
}

export async function addMember(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const body = await req.json();
    const input = addMemberSchema.parse(body);

    const group = await groupService.addMember(groupId, userId, input.email);
    return successResponse(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid member data");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Only admins can add members") return forbiddenResponse(error.message);
      if (error.message === "User not found with that email") return notFoundResponse(error.message);
      if (error.message === "User is already a member") return badRequestResponse(error.message);
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Add member error", { error });
    throw error;
  }
}

export async function removeMember(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const memberId = params?.memberId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!memberId) return badRequestResponse("Member ID is required");

    await groupService.removeMember(groupId, userId, memberId);
    return successResponse({ removed: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Only admins can remove other members") return forbiddenResponse(error.message);
      if (error.message === "Cannot remove the group creator") return badRequestResponse(error.message);
    }
    logger.error("Remove member error", { error });
    throw error;
  }
}
