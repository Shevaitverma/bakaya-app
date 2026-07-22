import { getAuthUser } from "@/middleware/auth";
import { registerDeviceTokenSchema } from "@/schemas/device.schema";
import { Device } from "@/models/Device";
import { successResponse, badRequestResponse } from "@/utils/response";
import { logger } from "@/utils/logger";
import { z } from "zod";

/**
 * PUT /api/v1/devices/token
 *
 * Registers or updates the FCM token for the caller's device. FCM tokens
 * rotate while a user stays logged in, so the client calls this whenever the
 * token changes — login-time capture alone is not enough.
 */
export async function registerDeviceToken(req: Request): Promise<Response> {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json();
    const input = registerDeviceTokenSchema.parse(body);

    await Device.findOneAndUpdate(
      { userId, deviceId: input.deviceId },
      {
        $set: {
          fcmToken: input.fcmToken,
          isActive: true,
          lastLoginAt: new Date(),
          ...(input.os ? { os: input.os } : {}),
          ...(input.osVersion ? { osVersion: input.osVersion } : {}),
        },
        $setOnInsert: { userId, deviceId: input.deviceId },
      },
      { upsert: true, new: true }
    );

    return successResponse({ registered: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse("Invalid device token payload");
    }
    if (error instanceof SyntaxError) {
      return badRequestResponse("Invalid request body");
    }
    logger.error("Register device token error", { error });
    throw error;
  }
}
