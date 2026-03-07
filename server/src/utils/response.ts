import type { ApiResponse, ApiError, ResponseMeta } from "@/types";

export function successResponse<T>(
  data: T,
  meta?: Partial<ResponseMeta>,
  status = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(response, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): Response {
  const error: ApiError = {
    code,
    message,
    details,
  };

  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(response, { status });
}

export function notFoundResponse(message = "Resource not found"): Response {
  return errorResponse("NOT_FOUND", message, 404);
}

export function badRequestResponse(
  message = "Bad request",
  details?: Record<string, unknown>
): Response {
  return errorResponse("BAD_REQUEST", message, 400, details);
}

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return errorResponse("UNAUTHORIZED", message, 401);
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return errorResponse("FORBIDDEN", message, 403);
}

export function internalErrorResponse(
  message = "Internal server error"
): Response {
  return errorResponse("INTERNAL_ERROR", message, 500);
}

export function validationErrorResponse(
  errors: Record<string, string[]>
): Response {
  return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
    errors,
  });
}
