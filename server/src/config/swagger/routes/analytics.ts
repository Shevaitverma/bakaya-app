const analyticsQueryParams = [
  {
    name: "startDate",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "Start date for the period (default: 1st of current month)",
  },
  {
    name: "endDate",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "End date for the period (default: today)",
  },
  {
    name: "profileId",
    in: "query",
    schema: { type: "string" },
    description: "Filter to a specific profile",
  },
];

const unauthorizedResponse = {
  description: "Unauthorized - Invalid or missing access token",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

export const analyticsRoutes = {
  "/api/v1/analytics/summary": {
    get: {
      tags: ["Analytics"],
      summary: "Get spending summary",
      description:
        "Returns total spending and per-profile breakdown for the given period. Defaults to the current month.",
      security: [{ bearerAuth: [] }],
      parameters: analyticsQueryParams,
      responses: {
        "200": {
          description: "Spending summary",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      totalSpent: { type: "number", example: 15000 },
                      byProfile: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            profileId: {
                              type: "string",
                              example: "507f1f77bcf86cd799439011",
                            },
                            profileName: {
                              type: "string",
                              example: "Self",
                            },
                            total: { type: "number", example: 8000 },
                          },
                        },
                      },
                      period: {
                        type: "object",
                        properties: {
                          start: {
                            type: "string",
                            format: "date",
                            example: "2026-03-01",
                          },
                          end: {
                            type: "string",
                            format: "date",
                            example: "2026-03-12",
                          },
                        },
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": unauthorizedResponse,
      },
    },
  },
  "/api/v1/analytics/by-profile": {
    get: {
      tags: ["Analytics"],
      summary: "Get spending by profile",
      description:
        "Returns spending grouped by profile with totals and expense counts.",
      security: [{ bearerAuth: [] }],
      parameters: analyticsQueryParams,
      responses: {
        "200": {
          description: "Spending grouped by profile",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      profiles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            profileId: {
                              type: "string",
                              example: "507f1f77bcf86cd799439011",
                            },
                            profileName: {
                              type: "string",
                              example: "Self",
                            },
                            total: { type: "number", example: 8000 },
                            count: { type: "integer", example: 12 },
                          },
                        },
                      },
                      totalSpent: { type: "number", example: 15000 },
                      period: {
                        type: "object",
                        properties: {
                          start: {
                            type: "string",
                            format: "date",
                            example: "2026-03-01",
                          },
                          end: {
                            type: "string",
                            format: "date",
                            example: "2026-03-12",
                          },
                        },
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": unauthorizedResponse,
      },
    },
  },
  "/api/v1/analytics/by-category": {
    get: {
      tags: ["Analytics"],
      summary: "Get spending by category",
      description:
        "Returns spending grouped by category with totals and expense counts.",
      security: [{ bearerAuth: [] }],
      parameters: analyticsQueryParams,
      responses: {
        "200": {
          description: "Spending grouped by category",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      categories: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            category: {
                              type: "string",
                              example: "Food",
                            },
                            total: { type: "number", example: 5000 },
                            count: { type: "integer", example: 8 },
                          },
                        },
                      },
                      totalSpent: { type: "number", example: 15000 },
                      period: {
                        type: "object",
                        properties: {
                          start: {
                            type: "string",
                            format: "date",
                            example: "2026-03-01",
                          },
                          end: {
                            type: "string",
                            format: "date",
                            example: "2026-03-12",
                          },
                        },
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": unauthorizedResponse,
      },
    },
  },
  "/api/v1/analytics/trends": {
    get: {
      tags: ["Analytics"],
      summary: "Get spending trends",
      description:
        "Returns monthly spending totals over time. Defaults to the last 6 months if no date range is provided.",
      security: [{ bearerAuth: [] }],
      parameters: analyticsQueryParams,
      responses: {
        "200": {
          description: "Monthly spending trends",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      months: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            year: { type: "integer", example: 2026 },
                            month: { type: "integer", example: 3 },
                            total: { type: "number", example: 15000 },
                            count: { type: "integer", example: 25 },
                          },
                        },
                      },
                      period: {
                        type: "object",
                        properties: {
                          start: {
                            type: "string",
                            format: "date",
                            example: "2025-10-01",
                          },
                          end: {
                            type: "string",
                            format: "date",
                            example: "2026-03-12",
                          },
                        },
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": unauthorizedResponse,
      },
    },
  },
};
