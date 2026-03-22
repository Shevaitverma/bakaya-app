import { getAuthUser } from "@/middleware/auth";
import { analyticsQuerySchema } from "@/schemas/analytics.schema";
import * as analyticsService from "@/services/analytics.service";
import { successResponse, badRequestResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getAnalyticsSummary(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams));

    const data = await analyticsService.getSummary(userId, query);

    return successResponse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get analytics summary error", { error });
    throw error;
  }
}

export async function getAnalyticsByProfile(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams));

    const data = await analyticsService.getByProfile(userId, query);

    return successResponse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get analytics by profile error", { error });
    throw error;
  }
}

export async function getAnalyticsByCategory(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams));

    const data = await analyticsService.getByCategory(userId, query);

    return successResponse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get analytics by category error", { error });
    throw error;
  }
}

export async function getAnalyticsTrends(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(url.searchParams));

    const data = await analyticsService.getTrends(userId, query);

    return successResponse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid query parameters");
    }
    logger.error("Get analytics trends error", { error });
    throw error;
  }
}
