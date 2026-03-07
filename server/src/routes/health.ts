import { getConnectionStatus } from "@/config/database";
import { successResponse, errorResponse } from "@/utils/response";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  uptime: number;
  timestamp: string;
  services: {
    database: {
      status: "connected" | "disconnected";
    };
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

const startTime = Date.now();

export async function healthCheck(): Promise<Response> {
  const dbConnected = getConnectionStatus();
  const memoryUsage = process.memoryUsage();

  const health: HealthStatus = {
    status: dbConnected ? "healthy" : "unhealthy",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbConnected ? "connected" : "disconnected",
      },
    },
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  };

  if (!dbConnected) {
    return errorResponse(
      "SERVICE_UNAVAILABLE",
      "One or more services are unavailable",
      503,
      health as unknown as Record<string, unknown>
    );
  }

  return successResponse(health);
}

export async function readinessCheck(): Promise<Response> {
  const dbConnected = getConnectionStatus();

  if (!dbConnected) {
    return errorResponse("NOT_READY", "Service is not ready", 503);
  }

  return successResponse({ ready: true });
}

export async function livenessCheck(): Promise<Response> {
  return successResponse({ alive: true });
}
