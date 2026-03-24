import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker only — enabled via NEXT_OUTPUT env var
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),
  // Disable React Strict Mode to prevent double-firing of useEffect in development.
  // Next.js App Router enables Strict Mode by default; this prevents duplicate API calls during dev.
  reactStrictMode: false,
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
