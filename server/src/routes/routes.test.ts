import { expect, test } from "bun:test";
import { routes } from "./index";

// Regression guard for the authorisation hole fixed in this change:
// /api/v1/users manages *other people's* accounts and was reachable by any
// authenticated user. If someone adds a user route without adminOnly, fail here.
test("every /api/v1/users route is admin-gated", () => {
  const userRoutes = routes.filter((r) => r.path.startsWith("/api/v1/users"));

  expect(userRoutes.length).toBeGreaterThan(0);
  for (const route of userRoutes) {
    expect(`${route.method} ${route.path}: adminOnly=${route.adminOnly}`).toBe(
      `${route.method} ${route.path}: adminOnly=true`
    );
  }
});

test("admin-gated routes are also authenticated", () => {
  for (const route of routes.filter((r) => r.adminOnly)) {
    expect(`${route.method} ${route.path}: protected=${route.protected}`).toBe(
      `${route.method} ${route.path}: protected=true`
    );
  }
});

test("no non-auth route is left unprotected by accident", () => {
  const publicPaths = [
    "/health",
    "/ready",
    "/live",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/google",
    "/api/v1/auth/refresh",
  ];

  const unprotected = routes
    .filter((r) => !r.protected && !r.adminOnly)
    .map((r) => r.path);

  expect(unprotected.sort()).toEqual([...publicPaths].sort());
});
