import type { PaginationParams } from "@/types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePaginationParams(url: URL): PaginationParams {
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");

  let page = pageParam ? parseInt(pageParam, 10) : DEFAULT_PAGE;
  let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

  // Validate and clamp values
  page = Math.max(1, isNaN(page) ? DEFAULT_PAGE : page);
  limit = Math.min(MAX_LIMIT, Math.max(1, isNaN(limit) ? DEFAULT_LIMIT : limit));

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
