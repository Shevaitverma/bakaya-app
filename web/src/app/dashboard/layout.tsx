"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearToken, getToken } from "@/lib/api-client";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser;
      setUser(parsed);
      setIsAuthChecked(true);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("bakaya_user");
    clearToken();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
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
      {/* Mobile hamburger */}
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        &#9776;
      </button>

      {/* Overlay (mobile) */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <Link href="/dashboard" className={styles.sidebarBrand}>
          <span className={styles.brandIcon}>B</span>
          Bakaya
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
                {item.icon}
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
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
