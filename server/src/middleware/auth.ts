import { verifyAccessToken, type JwtPayload } from "@/utils/jwt";
import { unauthorizedResponse, forbiddenResponse } from "@/utils/response";
import { User } from "@/models/User";

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

/**
 * Authorises admin-only routes. Must run after `authenticateRequest`.
 *
 * The role is read from the database rather than the JWT on purpose: a token
 * issued before a demotion would otherwise keep admin access until it expired.
 * These routes are rare, so the extra read is not worth optimising away.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const { userId } = getAuthUser(req);
  const user = await User.findById(userId).select("role isActive").lean();

  if (!user || !user.isActive || user.role !== "admin") {
    return forbiddenResponse("Admin access required");
  }
  return null;
}

export function getAuthUser(req: Request): JwtPayload {
  const user = authStore.get(req);
  if (!user) {
    throw new Error("No authenticated user found — was authenticateRequest called?");
  }
  return user;
}
