import { verifyAccessToken, type JwtPayload } from "@/utils/jwt";
import { unauthorizedResponse } from "@/utils/response";

const authStore = new WeakMap<Request, JwtPayload>();

export async function authenticateRequest(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    authStore.set(req, payload);
    return null; // success — no error response
  } catch {
    return unauthorizedResponse("Invalid or expired token");
  }
}

export function getAuthUser(req: Request): JwtPayload {
  const user = authStore.get(req);
  if (!user) {
    throw new Error("No authenticated user found — was authenticateRequest called?");
  }
  return user;
}
