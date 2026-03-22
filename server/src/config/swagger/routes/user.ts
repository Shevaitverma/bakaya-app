export const userRoutes = {
  "/api/v1/users": {
    get: {
      summary: "Get all users",
      description: "Returns a paginated list of users with optional filters",
      tags: ["Users"],
      security: [],
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
          name: "role",
          in: "query",
          schema: { type: "string", enum: ["user", "admin"] },
          description: "Filter by role",
        },
        {
          name: "isActive",
          in: "query",
          schema: { type: "boolean" },
          description: "Filter by active status",
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Search by username, email, firstName, or lastName",
        },
      ],
      responses: {
        200: {
          description: "Users fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                  meta: { $ref: "#/components/schemas/PaginationMeta" },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    post: {
      summary: "Create user",
      description: "Creates a new user",
      tags: ["Users"],
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
                username: {
                  type: "string",
                  minLength: 3,
                  maxLength: 30,
                  example: "johndoe",
                },
                password: {
                  type: "string",
                  minLength: 8,
                  example: "SecurePass123",
                  description: "Must contain lowercase, uppercase, and number",
                },
                firstName: {
                  type: "string",
                  maxLength: 50,
                  example: "John",
                },
                lastName: {
                  type: "string",
                  maxLength: 50,
                  example: "Doe",
                },
                name: {
                  type: "string",
                  minLength: 2,
                  maxLength: 100,
                  example: "John Doe",
                },
                role: {
                  type: "string",
                  enum: ["user", "admin"],
                  default: "user",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/User" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request - User already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/users/{id}": {
    get: {
      summary: "Get user by ID",
      description: "Returns a single user by their ID",
      tags: ["Users"],
      security: [],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "User ID",
        },
      ],
      responses: {
        200: {
          description: "User found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/User" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    put: {
      summary: "Update user",
      description: "Updates an existing user",
      tags: ["Users"],
      security: [],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "User ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  minLength: 2,
                  maxLength: 100,
                  example: "John Doe",
                },
                isActive: { type: "boolean" },
                role: {
                  type: "string",
                  enum: ["user", "admin"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/User" },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      summary: "Delete user",
      description: "Deletes a user by their ID",
      tags: ["Users"],
      security: [],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "User ID",
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      message: { type: "string", example: "User deleted successfully" },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
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
