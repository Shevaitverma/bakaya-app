import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for Docker only — enabled via NEXT_OUTPUT env var
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),
  reactStrictMode: true,
  allowedDevOrigins: ["*"],
  async rewrites() {
    return [
      {
        // Serve Firebase's auth handler as first-party content. Safari blocks
        // third-party storage, so signInWithRedirect — the only flow that works
        // in an installed iOS PWA — fails while the handler lives on
        // ztas-bakaya-app.firebaseapp.com. Proxying it through our own origin
        // makes it first-party. Requires NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN to
        // point at this host, plus the matching redirect URI on the Google
        // OAuth client (https://<host>/__/auth/handler).
        source: "/__/auth/:path*",
        destination: "https://ztas-bakaya-app.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
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
