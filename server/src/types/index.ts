import type { Server } from "bun";

export interface AppContext {
  server: Server<unknown>;
  startTime: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

export interface RouteHandler {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  handler: (req: Request, params?: Record<string, string>) => Promise<Response>;
  protected?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
