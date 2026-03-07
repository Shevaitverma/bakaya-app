import { env, isProduction } from "@/config/env";
import { connectDatabase, disconnectDatabase } from "@/config/database";
import { handleRequest } from "@/routes";
import { handleCorsPreFlight, addCorsHeaders } from "@/middleware/cors";
import { checkRateLimit, getRateLimitHeaders } from "@/middleware/rateLimit";
import { getOrCreateRequestId, addRequestIdHeader } from "@/middleware/requestId";
import { addSecurityHeaders } from "@/middleware/security";
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

      // Handle CORS preflight
      const corsResponse = handleCorsPreFlight(req);
      if (corsResponse) {
        return corsResponse;
      }

      // Check rate limit
      const rateLimitResponse = checkRateLimit(req);
      if (rateLimitResponse) {
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

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
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
