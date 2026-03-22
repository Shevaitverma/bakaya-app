export const authRoutes = {
  "/api/v1/auth/register": {
    post: {
      summary: "Register a new user",
      description: "Create a new user account with email and password",
      tags: ["Auth"],
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
                  description: "User's email address",
                },
                username: {
                  type: "string",
                  minLength: 3,
                  maxLength: 30,
                  example: "johndoe",
                  description: "Username (3-30 characters)",
                },
                password: {
                  type: "string",
                  minLength: 8,
                  example: "SecurePass123",
                  description: "Must contain at least one lowercase letter, one uppercase letter, and one number",
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
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
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
          description: "Bad Request - Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        409: {
          description: "Conflict - User already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/login": {
    post: {
      summary: "Login user",
      description: "Authenticate user with email and password",
      tags: ["Auth"],
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
                  description: "User's email address",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "SecurePass123",
                  description: "User's password",
                },
                deviceId: {
                  type: "string",
                  example: "unique-device-id-123",
                  description: "Optional device identifier",
                },
                os: {
                  type: "string",
                  example: "ios",
                  description: "Operating system name",
                },
                osVersion: {
                  type: "string",
                  example: "17.0",
                  description: "Operating system version",
                },
                fcmToken: {
                  type: "string",
                  example: "firebase-cloud-messaging-token",
                  description: "Firebase Cloud Messaging token",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      device: {
                        type: "object",
                        nullable: true,
                        description: "Device info (if device details were provided)",
                      },
                      accessToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        description: "JWT access token",
                      },
                      refreshToken: {
                        type: "string",
                        example: "refresh-token-here",
                        description: "JWT refresh token",
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request - Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        401: {
          description: "Unauthorized - Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  "/api/v1/auth/google": {
    post: {
      summary: "Google SSO Login (Firebase)",
      description: "Authenticate or register a user using Firebase Google Sign-In. The frontend authenticates with Firebase, then sends the Firebase ID token to the server for verification. If the user does not exist, a new account is created automatically.",
      tags: ["Auth"],
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["credential"],
              properties: {
                credential: {
                  type: "string",
                  description: "Firebase ID token obtained after Firebase Google Sign-In",
                  example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                deviceId: {
                  type: "string",
                  example: "unique-device-id-123",
                  description: "Optional device identifier",
                },
                os: {
                  type: "string",
                  example: "web",
                  description: "Operating system name",
                },
                osVersion: {
                  type: "string",
                  example: "Chrome 120",
                  description: "Browser/OS version",
                },
                fcmToken: {
                  type: "string",
                  example: "firebase-cloud-messaging-token",
                  description: "Firebase Cloud Messaging token",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Authentication successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      device: {
                        type: "object",
                        nullable: true,
                        description: "Device info (if device details were provided)",
                      },
                      accessToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        description: "JWT access token",
                      },
                      refreshToken: {
                        type: "string",
                        example: "refresh-token-here",
                        description: "JWT refresh token",
                      },
                    },
                  },
                  meta: { $ref: "#/components/schemas/ResponseMeta" },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request - Invalid data",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        401: {
          description: "Unauthorized - Invalid Google credential or deactivated account",
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
