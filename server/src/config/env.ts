import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // MongoDB
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/zts_bakaya"),
  MONGODB_DB_NAME: z.string().default("zts_bakaya"),

  // JWT
  JWT_SECRET: z.string().default("bakaya-dev-jwt-secret-change-in-production"),
  JWT_REFRESH_SECRET: z.string().default("bakaya-dev-refresh-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("90d"),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().default(""),

  // Security
  CORS_ORIGIN: z.string().default("*"),
  TRUST_PROXY: z.string().default("false"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Logging
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.format());
    process.exit(1);
  }

  const config = parsed.data;

  // Reject default JWT secrets in production
  const DEV_JWT_SECRET = "bakaya-dev-jwt-secret-change-in-production";
  const DEV_REFRESH_SECRET = "bakaya-dev-refresh-secret-change-in-production";
  if (config.NODE_ENV === "production") {
    if (config.JWT_SECRET === DEV_JWT_SECRET || config.JWT_REFRESH_SECRET === DEV_REFRESH_SECRET) {
      console.error("❌ FATAL: JWT secrets must be changed from defaults in production!");
      process.exit(1);
    }
  }

  return config;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
