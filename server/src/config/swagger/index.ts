import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { profileRoutes } from "./routes/profiles";
import { personalExpenseRoutes } from "./routes/personal-expenses";
import { groupRoutes } from "./routes/groups";
import { groupExpenseRoutes } from "./routes/group-expenses";
import { settlementRoutes } from "./routes/settlements";
import { analyticsRoutes } from "./routes/analytics";
import { swaggerSchemas } from "./schemas";

export const swaggerOptions = {
  openapi: "3.0.3",
  info: {
    title: "Bakaya API",
    version: "1.0.0",
    description: "Production-grade Bun backend server with MongoDB",
    contact: {
      name: "API Support",
    },
  },
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management endpoints" },
    { name: "Profiles", description: "Profile management endpoints" },
    { name: "Personal Expenses", description: "Personal expense management endpoints" },
    { name: "Groups", description: "Group management endpoints" },
    { name: "Group Expenses", description: "Group expense management endpoints" },
    { name: "Settlements", description: "Settlement tracking endpoints" },
    { name: "Analytics", description: "Spending analytics endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your access token obtained from the login endpoint",
      },
    },
    schemas: swaggerSchemas,
  },
  paths: {
    ...healthRoutes,
    ...authRoutes,
    ...userRoutes,
    ...profileRoutes,
    ...personalExpenseRoutes,
    ...groupRoutes,
    ...groupExpenseRoutes,
    ...settlementRoutes,
    ...analyticsRoutes,
  },
};
