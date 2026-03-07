import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env";
import { logger } from "@/utils/logger";

let isConnected = false;

const DNS_PROVIDERS = [
  { name: "Google", servers: ["8.8.8.8", "8.8.4.4"] },
  { name: "Cloudflare", servers: ["1.1.1.1", "1.0.0.1"] },
];

/**
 * Extracts the hostname from a MongoDB connection URI.
 */
function extractMongoHost(uri: string): string | null {
  try {
    // mongodb+srv://user:pass@cluster.mongodb.net/db -> cluster.mongodb.net
    const match = uri.match(/@([^/?]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Tests if a hostname can be resolved with the current DNS settings.
 */
async function testDnsResolution(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolve(hostname, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Configures DNS to use public resolvers (Google/Cloudflare) if the system DNS
 * cannot resolve the MongoDB Atlas hostname. This fixes SRV lookup failures
 * common with mongodb+srv:// connections.
 */
async function ensureDnsResolution(): Promise<void> {
  const host = extractMongoHost(env.MONGODB_URI);
  if (!host) {
    logger.warn("Could not extract hostname from MONGODB_URI, skipping DNS check");
    return;
  }

  // Test with system default DNS first
  const systemDnsWorks = await testDnsResolution(host);
  if (systemDnsWorks) {
    logger.debug("System DNS resolved MongoDB host successfully");
    return;
  }

  logger.warn(`System DNS failed to resolve "${host}", trying public DNS providers`);

  for (const provider of DNS_PROVIDERS) {
    try {
      dns.setServers(provider.servers);
      const works = await testDnsResolution(host);
      if (works) {
        logger.info(`DNS resolution fixed using ${provider.name} DNS (${provider.servers.join(", ")})`);
        return;
      }
    } catch (err) {
      logger.warn(`Failed to set ${provider.name} DNS`, { err });
    }
  }

  logger.error("All DNS providers failed to resolve MongoDB host. Connection will likely fail.");
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    logger.debug("Using existing database connection");
    return mongoose;
  }

  try {
    // Ensure DNS can resolve the MongoDB host before attempting connection
    await ensureDnsResolution();

    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error", { err });
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
      isConnected = true;
    });

    return connection;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected gracefully");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB", { error });
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
