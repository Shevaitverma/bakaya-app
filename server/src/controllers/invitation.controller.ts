import { getAuthUser } from "@/middleware/auth";
import {
  createInvitationSchema,
  listInvitationsQuerySchema,
} from "@/schemas/group.schema";
import * as invitationService from "@/services/invitation.service";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
} from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function createInvitationHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const body = await req.json();
    const input = createInvitationSchema.parse(body);

    const invitation = await invitationService.createInvitation(
      groupId,
      userId,
      input.email,
      input.message
    );
    return successResponse(invitation, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid invitation data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Only admins can invite members") return forbiddenResponse(error.message);
      if (error.message === "No registered user with that email") return notFoundResponse(error.message);
      if (error.message === "You cannot invite yourself") return badRequestResponse(error.message);
      if (error.message === "User is already a member") return badRequestResponse(error.message);
      if (error.message === "A pending invitation already exists for this user") {
        return badRequestResponse(error.message);
      }
    }
    logger.error("Create invitation error", { error });
    throw error;
  }
}

export async function listGroupInvitationsHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    if (!groupId) return badRequestResponse("Group ID is required");

    const url = new URL(req.url);
    const query = listInvitationsQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );

    const invitations = await invitationService.listGroupInvitations(
      groupId,
      userId,
      query
    );
    return successResponse(invitations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    if (error instanceof Error) {
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Only admins can view invitations") return forbiddenResponse(error.message);
    }
    logger.error("List group invitations error", { error });
    throw error;
  }
}

export async function cancelInvitationHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const groupId = params?.id;
    const invId = params?.invId;
    if (!groupId) return badRequestResponse("Group ID is required");
    if (!invId) return badRequestResponse("Invitation ID is required");

    const invitation = await invitationService.cancelInvitation(
      groupId,
      invId,
      userId
    );
    return successResponse(invitation);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") return notFoundResponse(error.message);
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "Invitation is no longer pending") return badRequestResponse(error.message);
      if (error.message === "Only the inviter or a group admin can cancel this invitation") {
        return forbiddenResponse(error.message);
      }
    }
    logger.error("Cancel invitation error", { error });
    throw error;
  }
}

export async function listMyInvitationsHandler(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = listInvitationsQuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );

    const invitations = await invitationService.listMyInvitations(userId, query);
    return successResponse(invitations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("List my invitations error", { error });
    throw error;
  }
}

export async function acceptInvitationHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const invId = params?.invId;
    if (!invId) return badRequestResponse("Invitation ID is required");

    const result = await invitationService.acceptInvitation(invId, userId);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") return notFoundResponse(error.message);
      if (error.message === "Group not found") return notFoundResponse(error.message);
      if (error.message === "This invitation is not for you") return forbiddenResponse(error.message);
      if (error.message === "Invitation is no longer pending") return badRequestResponse(error.message);
      if (error.message === "Invitation has expired") return badRequestResponse(error.message);
    }
    logger.error("Accept invitation error", { error });
    throw error;
  }
}

export async function declineInvitationHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const invId = params?.invId;
    if (!invId) return badRequestResponse("Invitation ID is required");

    const invitation = await invitationService.declineInvitation(invId, userId);
    return successResponse(invitation);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invitation not found") return notFoundResponse(error.message);
      if (error.message === "This invitation is not for you") return forbiddenResponse(error.message);
      if (error.message === "Invitation is no longer pending") return badRequestResponse(error.message);
      if (error.message === "Invitation has expired") return badRequestResponse(error.message);
    }
    logger.error("Decline invitation error", { error });
    throw error;
  }
}
