import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D81B60",
  // Let content extend behind the iPhone notch when installed to the home screen.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Bakaya — Expense Management",
  description:
    "Track expenses, split bills with groups, and manage your finances effortlessly.",
  // iOS ignores the manifest's display mode; these are what make an installed
  // home-screen app launch standalone instead of inside Safari chrome.
  appleWebApp: {
    capable: true,
    title: "Bakaya",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
