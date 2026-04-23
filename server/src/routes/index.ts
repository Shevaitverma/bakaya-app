import { healthCheck, readinessCheck, livenessCheck } from "./health";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/user.controller";
import { login, register, googleAuth, refreshTokenHandler, logout } from "@/controllers/auth.controller";
import {
  getPersonalExpenses,
  getPersonalExpense,
  createPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
  exportExpensesCSVHandler,
} from "@/controllers/expense.controller";
import {
  getProfiles,
  getProfile,
  createProfile as createProfileHandler,
  updateProfile as updateProfileHandler,
  deleteProfile as deleteProfileHandler,
} from "@/controllers/profile.controller";
import {
  getGroups,
  getGroup,
  createGroup as createGroupHandler,
  updateGroup as updateGroupHandler,
  deleteGroup as deleteGroupHandler,
  removeMember as removeMemberHandler,
} from "@/controllers/group.controller";
import {
  createInvitationHandler,
  listGroupInvitationsHandler,
  cancelInvitationHandler,
  listMyInvitationsHandler,
  acceptInvitationHandler,
  declineInvitationHandler,
} from "@/controllers/invitation.controller";
import {
  getGroupExpenses,
  getGroupExpense as getGroupExpenseHandler,
  createGroupExpense as createGroupExpenseHandler,
  updateGroupExpense as updateGroupExpenseHandler,
  deleteGroupExpense as deleteGroupExpenseHandler,
  getGroupBalances,
} from "@/controllers/groupExpense.controller";
import {
  getSettlements,
  createSettlement as createSettlementHandler,
  deleteSettlement as deleteSettlementHandler,
} from "@/controllers/settlement.controller";
import {
  getAnalyticsSummary,
  getAnalyticsBalance,
  getAnalyticsByProfile,
  getAnalyticsByCategory,
  getAnalyticsTrends,
} from "@/controllers/analytics.controller";
import {
  getCategories,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  reorderCategoriesHandler,
} from "@/controllers/category.controller";
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
  { path: "/api/v1/auth/google", method: "POST", handler: googleAuth },
  { path: "/api/v1/auth/refresh", method: "POST", handler: refreshTokenHandler },
  { path: "/api/v1/auth/logout", method: "POST", handler: logout, protected: true },

  // User routes (protected — admin-level management)
  { path: "/api/v1/users", method: "GET", handler: getUsers, protected: true },
  { path: "/api/v1/users", method: "POST", handler: createUser, protected: true },
  { path: "/api/v1/users/:id", method: "GET", handler: getUser, protected: true },
  { path: "/api/v1/users/:id", method: "PUT", handler: updateUser, protected: true },
  { path: "/api/v1/users/:id", method: "DELETE", handler: deleteUser, protected: true },

  // Profile routes (protected)
  { path: "/api/v1/profiles", method: "GET", handler: getProfiles, protected: true },
  { path: "/api/v1/profiles", method: "POST", handler: createProfileHandler, protected: true },
  { path: "/api/v1/profiles/:id", method: "GET", handler: getProfile, protected: true },
  { path: "/api/v1/profiles/:id", method: "PUT", handler: updateProfileHandler, protected: true },
  { path: "/api/v1/profiles/:id", method: "DELETE", handler: deleteProfileHandler, protected: true },

  // Personal expenses routes (protected)
  { path: "/api/v1/personal-expenses", method: "GET", handler: getPersonalExpenses, protected: true },
  { path: "/api/v1/personal-expenses", method: "POST", handler: createPersonalExpense, protected: true },
  { path: "/api/v1/personal-expenses/export", method: "GET", handler: exportExpensesCSVHandler, protected: true },
  { path: "/api/v1/personal-expenses/:id", method: "GET", handler: getPersonalExpense, protected: true },
  { path: "/api/v1/personal-expenses/:id", method: "PUT", handler: updatePersonalExpense, protected: true },
  { path: "/api/v1/personal-expenses/:id", method: "DELETE", handler: deletePersonalExpense, protected: true },

  // Group CRUD routes (protected)
  { path: "/api/v1/groups", method: "GET", handler: getGroups, protected: true },
  { path: "/api/v1/groups", method: "POST", handler: createGroupHandler, protected: true },
  { path: "/api/v1/groups/:id", method: "GET", handler: getGroup, protected: true },
  { path: "/api/v1/groups/:id", method: "PUT", handler: updateGroupHandler, protected: true },
  { path: "/api/v1/groups/:id", method: "DELETE", handler: deleteGroupHandler, protected: true },

  // Group members routes (protected)
  { path: "/api/v1/groups/:id/members/:memberId", method: "DELETE", handler: removeMemberHandler, protected: true },

  // Group invitation routes (protected)
  { path: "/api/v1/groups/:id/invitations", method: "POST", handler: createInvitationHandler, protected: true },
  { path: "/api/v1/groups/:id/invitations", method: "GET", handler: listGroupInvitationsHandler, protected: true },
  { path: "/api/v1/groups/:id/invitations/:invId", method: "DELETE", handler: cancelInvitationHandler, protected: true },
  { path: "/api/v1/invitations/me", method: "GET", handler: listMyInvitationsHandler, protected: true },
  { path: "/api/v1/invitations/:invId/accept", method: "POST", handler: acceptInvitationHandler, protected: true },
  { path: "/api/v1/invitations/:invId/decline", method: "POST", handler: declineInvitationHandler, protected: true },

  // Group expenses routes (protected)
  { path: "/api/v1/groups/:id/expenses", method: "GET", handler: getGroupExpenses, protected: true },
  { path: "/api/v1/groups/:id/expenses", method: "POST", handler: createGroupExpenseHandler, protected: true },
  { path: "/api/v1/groups/:id/expenses/:expenseId", method: "GET", handler: getGroupExpenseHandler, protected: true },
  { path: "/api/v1/groups/:id/expenses/:expenseId", method: "PUT", handler: updateGroupExpenseHandler, protected: true },
  { path: "/api/v1/groups/:id/expenses/:expenseId", method: "DELETE", handler: deleteGroupExpenseHandler, protected: true },

  // Group balances route (protected)
  { path: "/api/v1/groups/:id/balances", method: "GET", handler: getGroupBalances, protected: true },

  // Settlement routes (protected)
  { path: "/api/v1/groups/:id/settlements", method: "GET", handler: getSettlements, protected: true },
  { path: "/api/v1/groups/:id/settlements", method: "POST", handler: createSettlementHandler, protected: true },
  { path: "/api/v1/groups/:id/settlements/:settlementId", method: "DELETE", handler: deleteSettlementHandler, protected: true },

  // Analytics routes (protected)
  { path: "/api/v1/analytics/balance", method: "GET", handler: getAnalyticsBalance, protected: true },
  { path: "/api/v1/analytics/summary", method: "GET", handler: getAnalyticsSummary, protected: true },
  { path: "/api/v1/analytics/by-profile", method: "GET", handler: getAnalyticsByProfile, protected: true },
  { path: "/api/v1/analytics/by-category", method: "GET", handler: getAnalyticsByCategory, protected: true },
  { path: "/api/v1/analytics/trends", method: "GET", handler: getAnalyticsTrends, protected: true },

  // Category routes (protected)
  { path: "/api/v1/categories", method: "GET", handler: getCategories, protected: true },
  { path: "/api/v1/categories", method: "POST", handler: createCategoryHandler, protected: true },
  { path: "/api/v1/categories/reorder", method: "PUT", handler: reorderCategoriesHandler, protected: true },
  { path: "/api/v1/categories/:id", method: "PUT", handler: updateCategoryHandler, protected: true },
  { path: "/api/v1/categories/:id", method: "DELETE", handler: deleteCategoryHandler, protected: true },
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

    return await match.route.handler(req, match.params);
  } catch (error) {
    logger.error("Request handler error", {
      method,
      pathname,
      error,
    });

    return internalErrorResponse();
  }
}
