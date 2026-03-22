import { getAuthUser } from "@/middleware/auth";
import { createProfileSchema, updateProfileSchema, profileQuerySchema } from "@/schemas/profile.schema";
import * as profileService from "@/services/profile.service";
import { successResponse, badRequestResponse, notFoundResponse, forbiddenResponse } from "@/utils/response";
import { createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getProfiles(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = profileQuerySchema.parse(Object.fromEntries(url.searchParams));

    const { profiles, total } = await profileService.findProfilesByUser(userId, query);

    return successResponse({
      profiles,
      pagination: createPaginationMeta(query.page, query.limit, total),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get profiles error", { error });
    throw error;
  }
}

export async function getProfile(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const profileId = params?.id;
    if (!profileId) return badRequestResponse("Profile ID is required");

    const profile = await profileService.findProfileById(profileId);
    if (!profile) return notFoundResponse("Profile not found");

    // Validate ownership
    if (profile.userId.toString() !== userId) {
      return forbiddenResponse("Not authorized to access this profile");
    }

    return successResponse(profile);
  } catch (error) {
    logger.error("Get profile error", { error });
    throw error;
  }
}

export async function createProfile(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = createProfileSchema.parse(body);

    const profile = await profileService.createProfile(userId, input);
    return successResponse(profile, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid profile data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return badRequestResponse("A profile with this name already exists");
    }
    logger.error("Create profile error", { error });
    throw error;
  }
}

export async function updateProfile(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const profileId = params?.id;
    if (!profileId) return badRequestResponse("Profile ID is required");

    const body = await req.json();
    const input = updateProfileSchema.parse(body);

    const profile = await profileService.updateProfile(profileId, userId, input);
    if (!profile) return notFoundResponse("Profile not found");

    return successResponse(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid profile data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return badRequestResponse("A profile with this name already exists");
    }
    logger.error("Update profile error", { error });
    throw error;
  }
}

export async function deleteProfile(req: Request, params?: Record<string, string>): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const profileId = params?.id;
    if (!profileId) return badRequestResponse("Profile ID is required");

    const deleted = await profileService.deleteProfile(profileId, userId);
    if (!deleted) return notFoundResponse("Profile not found");

    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Cannot delete the default profile") {
        return badRequestResponse(error.message);
      }
      if (error.message === "Cannot delete profile with linked expenses") {
        return badRequestResponse(error.message);
      }
    }
    logger.error("Delete profile error", { error });
    throw error;
  }
}
