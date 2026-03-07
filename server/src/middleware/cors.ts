import { env } from "@/config/env";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Request-ID",
  "X-Requested-With",
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = env.CORS_ORIGIN === "*"
    ? "*"
    : origin && env.CORS_ORIGIN.split(",").includes(origin)
      ? origin
      : env.CORS_ORIGIN.split(",")[0]!;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }
  return null;
}

export function addCorsHeaders(response: Response, req: Request): Response {
  const origin = req.headers.get("origin");
  const headers = new Headers(response.headers);

  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    headers.set(key, value as string);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
