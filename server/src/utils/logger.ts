import winston from "winston";
import { env, isDevelopment } from "@/config/env";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development (readable logs)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Production format (JSON for log aggregation)
const prodFormat = combine(
  timestamp({ format: "ISO" }),
  errors({ stack: true }),
  json()
);

// Development format (colorized, readable)
const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  devFormat
);

// Create Winston logger
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { env: env.NODE_ENV },
  format: isDevelopment ? developmentFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

// Add file transports in production
if (!isDevelopment) {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create child logger with additional context
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

// Stream for Morgan or other middleware (if needed)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
