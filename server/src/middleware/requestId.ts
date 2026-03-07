import { randomUUID } from "crypto";

export function getOrCreateRequestId(req: Request): string {
  return req.headers.get("x-request-id") || randomUUID();
}

export function addRequestIdHeader(
  response: Response,
  requestId: string
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
