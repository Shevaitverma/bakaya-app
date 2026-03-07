import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker only — enabled via NEXT_OUTPUT env var
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),
};

export default nextConfig;
