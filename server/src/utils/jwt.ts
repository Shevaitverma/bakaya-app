import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";

export interface JwtPayload {
  userId: string;
  email: string;
}

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

function parseDuration(duration: string): string {
  return duration;
}

export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseDuration(env.JWT_EXPIRES_IN))
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseDuration(env.JWT_REFRESH_EXPIRES_IN))
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as JwtPayload;
}
