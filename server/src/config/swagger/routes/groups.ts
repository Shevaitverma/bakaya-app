export const groupRoutes = {
  "/api/v1/groups": {
    get: {
      tags: ["Groups"],
      summary: "Get all groups",
      description: "Returns a paginated list of groups for the authenticated user",
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
      ],
      responses: {
        "200": {
          description: "List of groups",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      groups: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Group" },
                      },
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
      },
    },
    post: {
      tags: ["Groups"],
      summary: "Create group",
      description: "Creates a new group. The authenticated user is automatically set as the creator and admin.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateGroupInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Group created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Group" },
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
      },
    },
  },
  "/api/v1/groups/{id}": {
    get: {
      tags: ["Groups"],
      summary: "Get group by ID",
      description: "Returns a single group by its ID",
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
          description: "Group found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Group" },
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
    put: {
      tags: ["Groups"],
      summary: "Update group",
      description: "Updates an existing group. Only group admins or creator can update.",
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
            schema: { $ref: "#/components/schemas/UpdateGroupInput" },
          },
        },
      },
      responses: {
        "200": {
          description: "Group updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Group" },
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
    delete: {
      tags: ["Groups"],
      summary: "Delete group",
      description: "Deletes a group by its ID. Only the group creator can delete.",
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
          description: "Group deleted successfully",
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
  "/api/v1/groups/{id}/members": {
    post: {
      tags: ["Groups"],
      summary: "Add member to group",
      description: "Adds a new member to the group by email",
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
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "newmember@example.com",
                  description: "Email of the user to add as member",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Member added successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Group" },
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
          description: "Group or user not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/groups/{id}/members/{memberId}": {
    delete: {
      tags: ["Groups"],
      summary: "Remove member from group",
      description: "Removes a member from the group",
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
          name: "memberId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Member user ID to remove",
        },
      ],
      responses: {
        "200": {
          description: "Member removed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      removed: { type: "boolean", example: true },
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
          description: "Group or member not found",
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
