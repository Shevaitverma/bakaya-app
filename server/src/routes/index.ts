import { healthCheck, readinessCheck, livenessCheck } from "./health";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/user.controller";
import { login, register } from "@/controllers/auth.controller";
import { getPersonalExpenses, createPersonalExpense, deletePersonalExpense } from "@/controllers/expense.controller";
import {
  getGroups,
  getGroup,
  createGroup as createGroupHandler,
  updateGroup as updateGroupHandler,
  deleteGroup as deleteGroupHandler,
  addMember as addMemberHandler,
  removeMember as removeMemberHandler,
} from "@/controllers/group.controller";
import {
  getGroupExpenses,
  createGroupExpense as createGroupExpenseHandler,
  deleteGroupExpense as deleteGroupExpenseHandler,
  getGroupBalances,
} from "@/controllers/groupExpense.controller";
import { authenticateRequest } from "@/middleware/auth";
import { notFoundResponse, internalErrorResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import type { RouteHandler } from "@/types";

// Route definitions
const routes: RouteHandler[] = [
  // Health routes
  { path: "/health", method: "GET", handler: healthCheck },
  { path: "/ready", method: "GET", handler: readinessCheck },
  { path: "/live", method: "GET", handler: livenessCheck },

  // Auth routes
  { path: "/api/v1/auth/login", method: "POST", handler: login },
  { path: "/api/v1/auth/register", method: "POST", handler: register },

  // User routes
  { path: "/api/v1/users", method: "GET", handler: getUsers },
  { path: "/api/v1/users", method: "POST", handler: createUser },
  { path: "/api/v1/users/:id", method: "GET", handler: getUser },
  { path: "/api/v1/users/:id", method: "PUT", handler: updateUser },
  { path: "/api/v1/users/:id", method: "DELETE", handler: deleteUser },

  // Personal expenses routes (protected)
  { path: "/api/v1/personal-expenses", method: "GET", handler: getPersonalExpenses, protected: true },
  { path: "/api/v1/personal-expenses", method: "POST", handler: createPersonalExpense, protected: true },
  { path: "/api/v1/personal-expenses/:id", method: "DELETE", handler: deletePersonalExpense, protected: true },

  // Group CRUD routes (protected)
  { path: "/api/v1/groups", method: "GET", handler: getGroups, protected: true },
  { path: "/api/v1/groups", method: "POST", handler: createGroupHandler, protected: true },
  { path: "/api/v1/groups/:id", method: "GET", handler: getGroup, protected: true },
  { path: "/api/v1/groups/:id", method: "PUT", handler: updateGroupHandler, protected: true },
  { path: "/api/v1/groups/:id", method: "DELETE", handler: deleteGroupHandler, protected: true },

  // Group members routes (protected)
  { path: "/api/v1/groups/:id/members", method: "POST", handler: addMemberHandler, protected: true },
  { path: "/api/v1/groups/:id/members/:memberId", method: "DELETE", handler: removeMemberHandler, protected: true },

  // Group expenses routes (protected)
  { path: "/api/v1/groups/:id/expenses", method: "GET", handler: getGroupExpenses, protected: true },
  { path: "/api/v1/groups/:id/expenses", method: "POST", handler: createGroupExpenseHandler, protected: true },
  { path: "/api/v1/groups/:id/expenses/:expenseId", method: "DELETE", handler: deleteGroupExpenseHandler, protected: true },

  // Group balances route (protected)
  { path: "/api/v1/groups/:id/balances", method: "GET", handler: getGroupBalances, protected: true },
];

interface MatchResult {
  route: RouteHandler;
  params: Record<string, string>;
}

function matchRoute(
  method: string,
  pathname: string
): MatchResult | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const routeParts = route.path.split("/");
    const pathParts = pathname.split("/");

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i]!;
      const pathPart = pathParts[i]!;

      if (routePart.startsWith(":")) {
        params[routePart.slice(1)] = pathPart;
      } else if (routePart !== pathPart) {
        match = false;
        break;
      }
    }

    if (match) {
      return { route, params };
    }
  }

  return null;
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  const startTime = performance.now();

  try {
    const match = matchRoute(method, pathname);

    if (!match) {
      logger.debug("Route not found", { method, pathname });
      return notFoundResponse(`Cannot ${method} ${pathname}`);
    }

    // Enforce authentication for protected routes
    if (match.route.protected) {
      const authError = await authenticateRequest(req);
      if (authError) return authError;
    }

    const response = await match.route.handler(req, match.params);

    const duration = performance.now() - startTime;
    logger.info("Request completed", {
      method,
      pathname,
      status: response.status,
      duration: `${duration.toFixed(2)}ms`,
    });

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error("Request failed", {
      method,
      pathname,
      error,
      duration: `${duration.toFixed(2)}ms`,
    });

    return internalErrorResponse();
  }
}
