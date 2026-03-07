import { User } from "@/models/User";
import { Device } from "@/models/Device";
import { registerSchema, loginSchema } from "@/schemas/auth.schema";
import { generateAccessToken, generateRefreshToken } from "@/utils/jwt";
import { successResponse, badRequestResponse, unauthorizedResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

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
