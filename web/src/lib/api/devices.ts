import { api } from "../api-client";

export const devicesApi = {
  registerToken(data: {
    deviceId: string;
    fcmToken: string;
    os?: string;
    osVersion?: string;
  }) {
    return api.put<{ registered: boolean }>("/api/v1/devices/token", data);
  },
};
