import { getAuthUser } from "@/middleware/auth";
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from "@/schemas/category.schema";
import * as categoryService from "@/services/category.service";
import { successResponse, badRequestResponse, notFoundResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

export async function getCategories(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") !== "false";

    // Lazy seed: if user has zero categories, seed defaults
    let categories = await categoryService.getUserCategories(userId, activeOnly);

    if (categories.length === 0) {
      await categoryService.seedDefaultCategories(userId);
      categories = await categoryService.getUserCategories(userId, activeOnly);
    }

    return successResponse({ categories });
  } catch (error) {
    logger.error("Get categories error", { error });
    throw error;
  }
}

export async function createCategoryHandler(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = createCategorySchema.parse(body);

    const category = await categoryService.createCategory(userId, input);
    return successResponse(category, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid category data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    if (error instanceof Error) {
      if (error.message.includes("Maximum of")) {
        return badRequestResponse(error.message);
      }
      if (error.message.includes("duplicate key")) {
        return badRequestResponse("A category with this name already exists");
      }
    }
    logger.error("Create category error", { error });
    throw error;
  }
}

export async function updateCategoryHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const categoryId = params?.id;
    if (!categoryId) return badRequestResponse("Category ID is required");

    const body = await req.json();
    const input = updateCategorySchema.parse(body);

    const category = await categoryService.updateCategory(userId, categoryId, input);
    if (!category) return notFoundResponse("Category not found");

    return successResponse(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid category data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return badRequestResponse("A category with this name already exists");
    }
    logger.error("Update category error", { error });
    throw error;
  }
}

export async function deleteCategoryHandler(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const categoryId = params?.id;
    if (!categoryId) return badRequestResponse("Category ID is required");

    const deleted = await categoryService.deleteCategory(userId, categoryId);
    if (!deleted) return notFoundResponse("Category not found");

    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Cannot delete the 'Other' category") {
        return badRequestResponse(error.message);
      }
    }
    logger.error("Delete category error", { error });
    throw error;
  }
}

export async function reorderCategoriesHandler(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = reorderCategoriesSchema.parse(body);

    const modifiedCount = await categoryService.reorderCategories(userId, input.categoryIds);
    return successResponse({ modifiedCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid reorder data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Reorder categories error", { error });
    throw error;
  }
}
