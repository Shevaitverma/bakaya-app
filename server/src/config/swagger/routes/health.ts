export const healthRoutes = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns the health status of the server and its dependencies",
      security: [],
      responses: {
        "200": {
          description: "Server is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["healthy", "unhealthy"], example: "healthy" },
                      uptime: { type: "integer", description: "Uptime in seconds", example: 3600 },
                      timestamp: { type: "string", format: "date-time" },
                      services: {
                        type: "object",
                        properties: {
                          database: {
                            type: "object",
                            properties: {
                              status: { type: "string", enum: ["connected", "disconnected"], example: "connected" },
                            },
                          },
                        },
                      },
                      memory: {
                        type: "object",
                        properties: {
                          heapUsed: { type: "integer", description: "Heap used in MB" },
                          heapTotal: { type: "integer", description: "Heap total in MB" },
                          external: { type: "integer", description: "External in MB" },
                          rss: { type: "integer", description: "RSS in MB" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "503": {
          description: "Server is unhealthy",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/ready": {
    get: {
      tags: ["Health"],
      summary: "Readiness check",
      description: "Returns whether the server is ready to accept requests",
      security: [],
      responses: {
        "200": {
          description: "Server is ready",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Success" },
            },
          },
        },
        "503": {
          description: "Server is not ready",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/live": {
    get: {
      tags: ["Health"],
      summary: "Liveness check",
      description: "Returns whether the server is alive",
      security: [],
      responses: {
        "200": {
          description: "Server is alive",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Success" },
            },
          },
        },
      },
    },
  },
};
