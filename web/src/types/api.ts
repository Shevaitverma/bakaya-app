export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  meta?: ResponseMeta;
}

export interface ApiErrorBody {
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
