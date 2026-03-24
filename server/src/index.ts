import { env, isProduction } from "@/config/env";
import { connectDatabase, disconnectDatabase } from "@/config/database";
import { handleRequest } from "@/routes";
import { handleCorsPreFlight, addCorsHeaders } from "@/middleware/cors";
import { checkRateLimit, checkAuthRateLimit, getRateLimitHeaders } from "@/middleware/rateLimit";
import { getOrCreateRequestId, addRequestIdHeader } from "@/middleware/requestId";
import { addSecurityHeaders } from "@/middleware/security";
import { handleSwaggerRoute } from "@/plugins/swagger.plugin";
import { logger } from "@/utils/logger";

async function main() {
  // Connect to database
  await connectDatabase();

  const server = Bun.serve({
    port: env.PORT,
    hostname: env.HOST,
    reusePort: true,

    async fetch(req: Request): Promise<Response> {
      const requestId = getOrCreateRequestId(req);
      const url = new URL(req.url);
      const startTime = performance.now();
      const method = req.method;
      const pathname = url.pathname;

      // Determine if this is a health-check path (logged at debug to avoid noise)
      const isHealthCheck = pathname === "/health" || pathname === "/ready" || pathname === "/live";

      // Helper: log the completed request at the appropriate level
      const logRequest = (response: Response, handler: string) => {
        const duration = performance.now() - startTime;
        const meta = {
          method,
          pathname,
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
          handler,
          requestId,
        };

        if (isHealthCheck) {
          logger.debug("Request completed", meta);
        } else {
          // Console.log as fallback in case Winston transport has issues in Bun
          console.log(`[${method}] ${pathname} → ${response.status} (${duration.toFixed(2)}ms)`);
          logger.info("Request completed", meta);
        }
      };

      // Handle Swagger routes first (before rate limiting and with special CORS handling)
      if (url.pathname.startsWith("/api-docs")) {
        if (req.method === "OPTIONS") {
          const corsResponse = handleCorsPreFlight(req);
          if (corsResponse) {
            logRequest(corsResponse, "cors-preflight:swagger");
            return corsResponse;
          }
        }

        const swaggerResponse = await handleSwaggerRoute(req);
        if (swaggerResponse) {
          let response = addCorsHeaders(swaggerResponse, req);
          response = addSecurityHeaders(response);
          logRequest(response, "swagger");
          return response;
        }
      }

      // Handle CORS preflight
      const corsResponse = handleCorsPreFlight(req);
      if (corsResponse) {
        logRequest(corsResponse, "cors-preflight");
        return corsResponse;
      }

      // Stricter rate limit for auth endpoints
      if (pathname.startsWith("/api/v1/auth/")) {
        const authLimitResponse = checkAuthRateLimit(req);
        if (authLimitResponse) {
          logRequest(authLimitResponse, "auth-rate-limit");
          return authLimitResponse;
        }
      }

      // Check general rate limit
      const rateLimitResponse = checkRateLimit(req);
      if (rateLimitResponse) {
        logger.warn("Rate limit exceeded", {
          method,
          pathname,
          status: rateLimitResponse.status,
          duration: `${(performance.now() - startTime).toFixed(2)}ms`,
          handler: "rate-limit",
          requestId,
        });
        return rateLimitResponse;
      }

      // Handle the request
      let response = await handleRequest(req);

      // Add headers
      response = addRequestIdHeader(response, requestId);
      response = addCorsHeaders(response, req);
      response = addSecurityHeaders(response);

      // Add rate limit headers
      const rateLimitHeaders = getRateLimitHeaders(req);
      const headers = new Headers(response.headers);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value as string);
      });

      const finalResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      logRequest(finalResponse, "router");
      return finalResponse;
    },

    error(error: Error): Response {
      logger.error("Unhandled server error", { error: error.message, stack: error.stack });
      return Response.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: isProduction
              ? "Internal server error"
              : error.message,
          },
        },
        { status: 500 }
      );
    },
  });

  logger.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`, {
    port: env.PORT,
    host: env.HOST,
    env: env.NODE_ENV,
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info("Received shutdown signal", { signal });

    server.stop(true);
    await disconnectDatabase();

    logger.info("Server shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
