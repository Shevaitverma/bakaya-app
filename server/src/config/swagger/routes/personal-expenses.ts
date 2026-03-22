export const personalExpenseRoutes = {
  "/api/v1/personal-expenses": {
    get: {
      tags: ["Personal Expenses"],
      summary: "List personal expenses",
      description: "Returns a paginated list of personal expenses for the authenticated user",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1, minimum: 1 },
          description: "Page number",
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
          description: "Items per page",
        },
        {
          name: "category",
          in: "query",
          schema: { type: "string" },
          description: "Filter by category",
        },
        {
          name: "profileId",
          in: "query",
          schema: { type: "string" },
          description: "Filter by profile ID",
        },
        {
          name: "startDate",
          in: "query",
          schema: { type: "string", format: "date" },
          description: "Filter expenses from this date (inclusive)",
        },
        {
          name: "endDate",
          in: "query",
          schema: { type: "string", format: "date" },
          description: "Filter expenses up to this date (inclusive)",
        },
      ],
      responses: {
        "200": {
          description: "List of personal expenses",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      expenses: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PersonalExpense" },
                      },
                      totalExpenseAmount: { type: "number", example: 5000.75 },
                      pagination: { $ref: "#/components/schemas/PaginationMeta" },
                    },
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Personal Expenses"],
      summary: "Create personal expense",
      description: "Creates a new personal expense for the authenticated user",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePersonalExpenseInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Personal expense created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PersonalExpense" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/personal-expenses/{id}": {
    get: {
      tags: ["Personal Expenses"],
      summary: "Get personal expense by ID",
      description: "Returns a single personal expense by its ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Expense ID",
        },
      ],
      responses: {
        "200": {
          description: "Expense found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PersonalExpense" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "403": {
          description: "Forbidden - Not authorized to access this expense",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Expense not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Personal Expenses"],
      summary: "Update personal expense",
      description: "Updates an existing personal expense",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Expense ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePersonalExpenseInput" },
          },
        },
      },
      responses: {
        "200": {
          description: "Expense updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/PersonalExpense" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Expense not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Personal Expenses"],
      summary: "Delete personal expense",
      description: "Deletes a personal expense by its ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Expense ID",
        },
      ],
      responses: {
        "200": {
          description: "Expense deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      deleted: { type: "boolean", example: true },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        "401": {
          description: "Unauthorized - Invalid or missing access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Expense not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
};
