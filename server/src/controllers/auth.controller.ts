import { User } from "@/models/User";
import { Device } from "@/models/Device";
import { getAuthUser } from "@/middleware/auth";
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema } from "@/schemas/auth.schema";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { successResponse, badRequestResponse, unauthorizedResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";
import { createDefaultProfile } from "@/services/profile.service";
import { z } from "zod";
import { createLocalJWKSet, jwtVerify, type JSONWebKeySet } from "jose";

// Firebase/Google JWKS - fetched manually and cached for 1 hour
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let cachedJWKS: ReturnType<typeof createLocalJWKSet> | null = null;
let jwksCachedAt = 0;
const JWKS_CACHE_DURATION = 3600_000; // 1 hour

async function fetchJWKSData(): Promise<JSONWebKeySet> {
  // Try curl first (faster on Windows where Bun fetch is slow)
  try {
    const proc = Bun.spawn(["curl", "-s", "--max-time", "10", GOOGLE_JWKS_URL], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0 && text) {
      return JSON.parse(text) as JSONWebKeySet;
    }
  } catch {
    // curl not available, fall through to fetch
  }

  // Fallback to Bun fetch (works fine on Linux/production)
  const res = await fetch(GOOGLE_JWKS_URL);
  return await res.json() as JSONWebKeySet;
}

async function getFirebaseJWKS() {
  const now = Date.now();
  if (cachedJWKS && (now - jwksCachedAt) < JWKS_CACHE_DURATION) {
    return cachedJWKS;
  }

  const jwks = await fetchJWKSData();
  cachedJWKS = createLocalJWKSet(jwks);
  jwksCachedAt = now;
  logger.info("Firebase JWKS fetched and cached");
  return cachedJWKS;
}

// Pre-fetch JWKS at startup
getFirebaseJWKS().catch((err) => {
  logger.warn("Initial JWKS fetch failed, will retry on first auth request", { error: err.message });
});

export async function register(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: input.email.toLowerCase() });
    if (existingEmail) {
      return badRequestResponse("Email already registered");
    }

    // Check for duplicate username
    if (input.username) {
      const existingUsername = await User.findOne({ username: input.username.toLowerCase() });
      if (existingUsername) {
        return badRequestResponse("Username already taken");
      }
    }

    const user = await User.create({
      email: input.email,
      username: input.username,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    // Auto-create default profile with user's name
    const userName = [input.firstName, input.lastName].filter(Boolean).join(" ");
    await createDefaultProfile(user._id.toString(), userName);

    logger.info("User registered", { userId: user._id });

    return successResponse(user.toJSON(), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid registration data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Registration error", { error });
    throw error;
  }
}

export async function login(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);

    const user = await User.findByEmail(input.email);
    if (!user) {
      return unauthorizedResponse("Invalid email or password");
    }

    if (!user.isActive) {
      return unauthorizedResponse("Account is deactivated");
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      return unauthorizedResponse("Invalid email or password");
    }

    // Generate JWT tokens
    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    // Update last login timestamp
    const now = new Date();
    await User.updateOne({ _id: user._id }, { lastLoginAt: now });

    // Upsert device if deviceId provided
    let device = null;
    if (input.deviceId) {
      device = await Device.findOneAndUpdate(
        { userId: user._id, deviceId: input.deviceId },
        {
          userId: user._id,
          deviceId: input.deviceId,
          os: input.os,
          osVersion: input.osVersion,
          fcmToken: input.fcmToken,
          isActive: true,
          lastLoginAt: now,
        },
        { upsert: true, new: true }
      );
    }

    logger.info("User logged in", { userId: user._id });

    const userData = user.toJSON();
    userData.lastLoginAt = now;

    return successResponse({
      user: userData,
      device: device?.toJSON() ?? null,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid login data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Login error", { error });
    throw error;
  }
}

export async function googleAuth(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = googleAuthSchema.parse(body);

    // Verify the Firebase ID token
    let firebasePayload;
    try {
      const jwks = await getFirebaseJWKS();
      const { payload } = await jwtVerify(input.credential, jwks, {
        issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
        audience: env.FIREBASE_PROJECT_ID,
      });
      firebasePayload = payload;
    } catch (jwtError) {
      logger.error("Firebase JWT verification failed", {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        code: (jwtError as any)?.code,
        claim: (jwtError as any)?.claim,
        reason: (jwtError as any)?.reason,
      });
      return unauthorizedResponse("Invalid Firebase credential");
    }

    const googleId = firebasePayload.sub as string;
    const firebaseUser = firebasePayload.firebase as { sign_in_provider?: string } | undefined;
    const email = firebasePayload.email as string;
    const firstName = (firebasePayload.name as string | undefined)?.split(" ")[0];
    const lastName = (firebasePayload.name as string | undefined)?.split(" ").slice(1).join(" ") || undefined;
    const profilePicture = firebasePayload.picture as string | undefined;

    // Ensure it's a Google sign-in
    if (firebaseUser?.sign_in_provider !== "google.com") {
      return badRequestResponse("Only Google sign-in is supported");
    }

    if (!email) {
      return badRequestResponse("Google account does not have an email");
    }

    // HIGH 1: Verify email is verified with Google
    if (!firebasePayload.email_verified) {
      return badRequestResponse("Email not verified with Google");
    }

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    const now = new Date();
    let isNewUser = false;

    if (user) {
      // HIGH 2: Don't auto-link if user registered with email/password
      if (!user.googleId && user.authProvider === "local") {
        return badRequestResponse("An account with this email already exists. Please login with your password.");
      }
      // Link Google account only if not a local auth user
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
      }
      if (profilePicture && !user.profilePicture) {
        user.profilePicture = profilePicture;
      }
      user.lastLoginAt = now;
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user from Google profile
      user = await User.create({
        email,
        firstName,
        lastName,
        profilePicture,
        googleId,
        authProvider: "google",
        isVerified: true,
        lastLoginAt: now,
      });
      isNewUser = true;
    }

    // Auto-create default profile with user's name for new users
    if (isNewUser) {
      const fullName = (firebasePayload.name as string | undefined) ||
        [firstName, lastName].filter(Boolean).join(" ");
      await createDefaultProfile(user._id.toString(), fullName);
    }

    if (!user.isActive) {
      return unauthorizedResponse("Account is deactivated");
    }

    // Generate JWT tokens
    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    // Upsert device if deviceId provided
    let device = null;
    if (input.deviceId) {
      device = await Device.findOneAndUpdate(
        { userId: user._id, deviceId: input.deviceId },
        {
          userId: user._id,
          deviceId: input.deviceId,
          os: input.os,
          osVersion: input.osVersion,
          fcmToken: input.fcmToken,
          isActive: true,
          lastLoginAt: now,
        },
        { upsert: true, new: true }
      );
    }

    logger.info("User logged in via Google", { userId: user._id });

    return successResponse({
      user: user.toJSON(),
      device: device?.toJSON() ?? null,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid Google auth data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Google auth error", { error });
    throw error;
  }
}

export async function refreshTokenHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = refreshTokenSchema.parse(body);

    // Verify the refresh token
    let payload;
    try {
      payload = await verifyRefreshToken(input.refreshToken);
    } catch {
      return unauthorizedResponse("Invalid or expired refresh token");
    }

    // Look up the user
    const user = await User.findById(payload.userId);
    if (!user) {
      return unauthorizedResponse("User not found");
    }

    if (!user.isActive) {
      return unauthorizedResponse("Account is deactivated");
    }

    // Generate new token pair
    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    logger.info("Token refreshed", { userId: user._id });

    return successResponse({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid refresh token data");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Token refresh error", { error });
    throw error;
  }
}

export async function logout(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);

    // Invalidate all devices for this user
    await Device.updateMany({ userId }, { isActive: false });

    logger.info("User logged out", { userId });
    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error", { error });
    throw error;
  }
}
