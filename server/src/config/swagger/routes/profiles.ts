export const profileRoutes = {
  "/api/v1/profiles": {
    get: {
      tags: ["Profiles"],
      summary: "List profiles",
      description: "Returns a paginated list of profiles for the authenticated user",
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
          description: "List of profiles",
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
                        items: { $ref: "#/components/schemas/Profile" },
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
      tags: ["Profiles"],
      summary: "Create profile",
      description: "Creates a new profile for the authenticated user",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateProfileInput" },
          },
        },
      },
      responses: {
        "201": {
          description: "Profile created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Profile" },
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
          description: "Validation error or duplicate profile name",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/profiles/{id}": {
    get: {
      tags: ["Profiles"],
      summary: "Get profile by ID",
      description: "Returns a single profile by its ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Profile ID",
        },
      ],
      responses: {
        "200": {
          description: "Profile found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Profile" },
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
          description: "Forbidden - Not authorized to access this profile",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        "404": {
          description: "Profile not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Profiles"],
      summary: "Update profile",
      description: "Updates an existing profile",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Profile ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProfileInput" },
          },
        },
      },
      responses: {
        "200": {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { $ref: "#/components/schemas/Profile" },
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
          description: "Profile not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Profiles"],
      summary: "Delete profile",
      description: "Deletes a profile. Cannot delete the default 'Self' profile or profiles with linked expenses.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Profile ID",
        },
      ],
      responses: {
        "200": {
          description: "Profile deleted successfully",
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
        "400": {
          description: "Cannot delete default profile or profile with linked expenses",
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
        "404": {
          description: "Profile not found",
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
