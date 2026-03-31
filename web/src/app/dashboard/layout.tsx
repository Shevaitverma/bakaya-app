"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearAllAuth, getToken, setOnSessionExpired } from "@/lib/api-client";
import styles from "./layout.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "\u2302" },
  { label: "Groups", href: "/dashboard/groups", icon: "\uD83D\uDC65" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "\uD83D\uDCCA" },
  { label: "Profiles", href: "/dashboard/profiles", icon: "\uD83D\uDC64" },
];

interface StoredUser {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

function NavIcon({ label }: { label: string }) {
  switch (label) {
    case "Home":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
        </svg>
      );
    case "Groups":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "Analytics":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "Profiles":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      routerRef.current.push("/login");
      return;
    }

    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      routerRef.current.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser;
      setUser(parsed);
      setIsAuthChecked(true);
    } catch {
      clearAllAuth();
      routerRef.current.push("/login");
      return;
    }

    // Register a global callback so that any API call that detects a truly
    // expired session (refresh token rejected) can redirect to /login.
    // This replaces the per-page clearAllAuth+redirect pattern.
    setOnSessionExpired(() => {
      routerRef.current.push("/login");
    });

    return () => {
      setOnSessionExpired(null);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      // Home is active for /dashboard and /dashboard/expenses/*
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/expenses");
    }
    return pathname.startsWith(href);
  };

  const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!isAuthChecked) {
    return null;
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar (desktop only, hidden on mobile via CSS) */}
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.sidebarBrand}>
          <span className={styles.brandIcon}>B</span>
          <span className={styles.brandText}>
            Bakaya
            <span className={styles.brandSubtitle}>FINANCE TRACKER</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isActive(item.href) ? styles.navLinkActive : ""
              }`}
            >
              <span className={styles.navIcon} aria-hidden>
                <NavIcon label={item.label} />
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{displayName}</p>
              {displayEmail && (
                <p className={styles.userEmail}>{displayEmail}</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>{children}</main>

      {/* Bottom Navigation Bar (mobile only, hidden on desktop via CSS) */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavTab} ${
              isActive(item.href) ? styles.bottomNavTabActive : ""
            }`}
          >
            <NavIcon label={item.label} />
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
