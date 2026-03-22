import { User } from "@/models/User";
import { Device } from "@/models/Device";
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema } from "@/schemas/auth.schema";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { successResponse, badRequestResponse, unauthorizedResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";
import { createDefaultProfile } from "@/services/profile.service";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase/Google JWKS for verifying Firebase ID tokens
const firebaseJWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

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
      const { payload } = await jwtVerify(input.credential, firebaseJWKS, {
        issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
        audience: env.FIREBASE_PROJECT_ID,
      });
      firebasePayload = payload;
    } catch {
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

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    const now = new Date();
    let isNewUser = false;

    if (user) {
      // Link Google account if user exists by email but hasn't linked Google yet
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
