import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker only — enabled via NEXT_OUTPUT env var
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),
  allowedDevOrigins: ["*"],
  async headers() {
    return [
      {
        // Relax COOP on auth pages so Firebase signInWithPopup works
        source: "/(login|register)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
