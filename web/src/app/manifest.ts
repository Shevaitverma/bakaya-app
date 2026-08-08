import type { MetadataRoute } from "next";

/** Served at /manifest.webmanifest. Next injects the <link rel="manifest">
 * automatically, so nothing in layout.tsx needs to reference this. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bakaya — Expense Management",
    short_name: "Bakaya",
    description:
      "Track expenses, split bills with groups, and manage your finances effortlessly.",
    // "/" redirects to /dashboard when a token exists, so it works signed in or out.
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#D81B60",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        // Foreground inset to 80% over the brand pink — Android crops maskable
        // icons to a shape and only that centre circle is guaranteed visible.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
