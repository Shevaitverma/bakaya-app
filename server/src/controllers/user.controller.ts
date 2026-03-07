import { userService } from "@/services/user.service";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "@/schemas/user.schema";
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse,
} from "@/utils/response";
import { logger } from "@/utils/logger";
import { ZodError } from "zod";

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}

export async function getUsers(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const query = userQuerySchema.parse(queryParams);

    const { users, pagination } = await userService.findMany(query);

    return successResponse(users, pagination);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(formatZodErrors(error));
    }
    logger.error("Error fetching users", { error });
    throw error;
  }
}

export async function getUser(
  _req: Request,
  params?: Record<string, string>
): Promise<Response> {
  const id = params?.id;

  if (!id) {
    return badRequestResponse("User ID is required");
  }

  const user = await userService.findById(id);

  if (!user) {
    return notFoundResponse("User not found");
  }

  return successResponse(user);
}

export async function createUser(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = createUserSchema.parse(body);

    const user = await userService.create(input);

    return successResponse(user, undefined, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(formatZodErrors(error));
    }
    if (error instanceof Error && error.message === "Email already exists") {
      return badRequestResponse("Email already exists");
    }
    logger.error("Error creating user", { error });
    throw error;
  }
}

export async function updateUser(
  req: Request,
  params?: Record<string, string>
): Promise<Response> {
  try {
    const id = params?.id;

    if (!id) {
      return badRequestResponse("User ID is required");
    }

    const body = await req.json();
    const input = updateUserSchema.parse(body);

    const user = await userService.update(id, input);

    if (!user) {
      return notFoundResponse("User not found");
    }

    return successResponse(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(formatZodErrors(error));
    }
    logger.error("Error updating user", { error });
    throw error;
  }
}

export async function deleteUser(
  _req: Request,
  params?: Record<string, string>
): Promise<Response> {
  const id = params?.id;

  if (!id) {
    return badRequestResponse("User ID is required");
  }

  const deleted = await userService.delete(id);

  if (!deleted) {
    return notFoundResponse("User not found");
  }

  return successResponse({ message: "User deleted successfully" });
}
