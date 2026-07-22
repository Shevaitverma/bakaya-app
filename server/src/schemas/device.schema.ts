import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
  deviceId: z.string().min(1).max(200),
  fcmToken: z.string().min(1).max(4096),
  os: z.string().max(50).optional(),
  osVersion: z.string().max(50).optional(),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
