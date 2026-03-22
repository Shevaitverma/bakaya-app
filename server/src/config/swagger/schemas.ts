export const swaggerSchemas = {
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "ERROR_CODE" },
          message: { type: "string", example: "Error message" },
        },
      },
      meta: { $ref: "#/components/schemas/ResponseMeta" },
    },
  },
  Success: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { type: "object" },
      meta: { $ref: "#/components/schemas/ResponseMeta" },
    },
  },
  ResponseMeta: {
    type: "object",
    properties: {
      timestamp: { type: "string", format: "date-time" },
    },
  },
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      total: { type: "integer", example: 100 },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      email: { type: "string", format: "email", example: "user@example.com" },
      username: { type: "string", example: "johndoe" },
      firstName: { type: "string", nullable: true, example: "John" },
      lastName: { type: "string", nullable: true, example: "Doe" },
      profilePicture: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
      role: { type: "string", enum: ["user", "admin"], example: "user" },
      isActive: { type: "boolean", example: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Profile: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      userId: { type: "string", example: "507f1f77bcf86cd799439011" },
      name: { type: "string", example: "Self" },
      relationship: { type: "string", nullable: true, example: "self" },
      avatar: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
      color: { type: "string", nullable: true, example: "#FF5733" },
      isDefault: { type: "boolean", example: false },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateProfileInput: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "Brother",
      },
      relationship: {
        type: "string",
        maxLength: 50,
        example: "family",
      },
      avatar: {
        type: "string",
        maxLength: 500,
        example: "https://example.com/avatar.jpg",
      },
      color: {
        type: "string",
        maxLength: 20,
        example: "#FF5733",
      },
    },
  },
  UpdateProfileInput: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "Brother Updated",
      },
      relationship: {
        type: "string",
        maxLength: 50,
        example: "family",
      },
      avatar: {
        type: "string",
        maxLength: 500,
        example: "https://example.com/avatar.jpg",
      },
      color: {
        type: "string",
        maxLength: 20,
        example: "#3366FF",
      },
    },
  },
  PersonalExpense: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      userId: { type: "string", example: "507f1f77bcf86cd799439011" },
      profileId: { type: "string", nullable: true, example: "507f1f77bcf86cd799439011" },
      title: { type: "string", example: "Grocery Shopping" },
      amount: { type: "number", example: 125.5 },
      category: { type: "string", nullable: true, example: "Food" },
      notes: { type: "string", nullable: true, example: "Weekly groceries" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreatePersonalExpenseInput: {
    type: "object",
    required: ["title", "amount", "profileId"],
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Grocery Shopping",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 125.5,
        description: "Amount must be greater than or equal to 0",
      },
      profileId: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
        description: "ID of the profile this expense is for",
      },
      category: {
        type: "string",
        maxLength: 50,
        example: "Food",
      },
      notes: {
        type: "string",
        maxLength: 500,
        example: "Weekly groceries from supermarket",
      },
    },
  },
  UpdatePersonalExpenseInput: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Grocery Shopping Updated",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 150.0,
      },
      profileId: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
      },
      category: {
        type: "string",
        maxLength: 50,
        example: "Food",
      },
      notes: {
        type: "string",
        maxLength: 500,
        example: "Updated notes",
      },
    },
  },
  Group: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      name: { type: "string", example: "Project Team Alpha" },
      description: { type: "string", nullable: true, example: "Main project team" },
      createdBy: { type: "string", example: "507f1f77bcf86cd799439011" },
      members: {
        type: "array",
        items: { $ref: "#/components/schemas/GroupMember" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  GroupMember: {
    type: "object",
    properties: {
      userId: { type: "string", example: "507f1f77bcf86cd799439011" },
      role: { type: "string", enum: ["admin", "member"], example: "member" },
      joinedAt: { type: "string", format: "date-time" },
    },
  },
  CreateGroupInput: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "Project Team Alpha",
      },
      description: {
        type: "string",
        maxLength: 500,
        example: "Main project team for Alpha project",
      },
    },
  },
  UpdateGroupInput: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "Project Team Alpha Updated",
      },
      description: {
        type: "string",
        maxLength: 500,
        nullable: true,
        example: "Updated description",
      },
    },
  },
  GroupExpense: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      groupId: { type: "string", example: "507f1f77bcf86cd799439011" },
      title: { type: "string", example: "Team Dinner" },
      amount: { type: "number", example: 250.0 },
      category: { type: "string", nullable: true, example: "Food" },
      notes: { type: "string", nullable: true, example: "Monthly team dinner" },
      paidBy: { type: "string", example: "507f1f77bcf86cd799439011" },
      splitAmong: {
        type: "array",
        items: {
          type: "object",
          properties: {
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            amount: { type: "number", example: 50.0 },
          },
        },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateGroupExpenseInput: {
    type: "object",
    required: ["title", "amount"],
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Team Dinner",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 250.0,
      },
      category: {
        type: "string",
        maxLength: 50,
        example: "Food",
      },
      notes: {
        type: "string",
        maxLength: 500,
        example: "Monthly team dinner",
      },
      splitAmong: {
        type: "array",
        items: {
          type: "object",
          required: ["userId", "amount"],
          properties: {
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            amount: { type: "number", example: 50.0 },
          },
        },
        description: "Optional split configuration among group members",
      },
    },
  },
  UpdateGroupExpenseInput: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        example: "Team Dinner Updated",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 300.0,
      },
      category: {
        type: "string",
        maxLength: 50,
        example: "Food",
      },
      notes: {
        type: "string",
        maxLength: 500,
        example: "Updated notes",
      },
      splitAmong: {
        type: "array",
        items: {
          type: "object",
          required: ["userId", "amount"],
          properties: {
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            amount: { type: "number", example: 60.0 },
          },
        },
        description: "Optional updated split configuration",
      },
    },
  },
  Settlement: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      groupId: { type: "string", example: "507f1f77bcf86cd799439011" },
      paidBy: { type: "string", example: "507f1f77bcf86cd799439011" },
      paidTo: { type: "string", example: "507f1f77bcf86cd799439011" },
      amount: { type: "number", example: 100.0 },
      notes: { type: "string", nullable: true, example: "Settling dinner debt" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateSettlementInput: {
    type: "object",
    required: ["paidBy", "paidTo", "amount"],
    properties: {
      paidBy: {
        type: "string",
        example: "507f1f77bcf86cd799439011",
        description: "User ID of the person who paid to settle",
      },
      paidTo: {
        type: "string",
        example: "507f1f77bcf86cd799439012",
        description: "User ID of the person who received payment",
      },
      amount: {
        type: "number",
        minimum: 0,
        example: 100.0,
        description: "Settlement amount (must be positive)",
      },
      notes: {
        type: "string",
        maxLength: 500,
        example: "Settling dinner debt",
      },
    },
  },
};
