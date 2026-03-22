export const groupExpenseRoutes = {
  "/api/v1/groups/{id}/expenses": {
    get: {
      tags: ["Group Expenses"],
      summary: "Get group expenses",
      description: "Returns a paginated list of expenses for a specific group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
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
      ],
      responses: {
        "200": {
          description: "List of group expenses",
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
                        items: { $ref: "#/components/schemas/GroupExpense" },
                      },
                      totalAmount: { type: "number", example: 1500.0 },
                      pagination: { $ref: "#/components/schemas/PaginationMeta" },
                    },
                  },
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
          description: "Group not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Group Expenses"],
      summary: "Create group expense",
      description: "Creates a new expense for a specific group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGroupExpenseInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Group expense created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/GroupExpense" },
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
        "400": {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Group not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/groups/{id}/expenses/{expenseId}": {
    get: {
      tags: ["Group Expenses"],
      summary: "Get single group expense",
      description: "Returns a single expense from a specific group by its ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
        {
          name: "expenseId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Expense ID",
        },
      ],
      responses: {
        "200": {
          description: "Group expense found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/GroupExpense" },
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
    put: {
      tags: ["Group Expenses"],
      summary: "Update group expense",
      description: "Updates an existing expense in a specific group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
        {
          name: "expenseId",
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
            schema: { $ref: "#/components/schemas/UpdateGroupExpenseInput" },
          },
        },
      },
      responses: {
        "200": {
          description: "Group expense updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/GroupExpense" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
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
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "403": {
          description: "Not a member of this group",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Group or expense not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Group Expenses"],
      summary: "Delete group expense",
      description: "Deletes an expense from a specific group",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
        {
          name: "expenseId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Expense ID",
        },
      ],
      responses: {
        "200": {
          description: "Group expense deleted successfully",
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
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Group or expense not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/groups/{id}/balances": {
    get: {
      tags: ["Group Expenses"],
      summary: "Get group balances",
      description: "Returns the balance summary for a specific group, showing how much each member owes or is owed",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Group ID",
        },
      ],
      responses: {
        "200": {
          description: "Group balances",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      balances: {
                        type: "object",
                        description: "Balance information per member",
                      },
                    },
                  },
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
          description: "Group not found",
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
