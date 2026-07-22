"use client";

import { useEffect, useState } from "react";
import { registerWebPush } from "@/lib/push";

type Status = "idle" | "registering" | "enabled" | "denied" | "unsupported";

export function EnableNotifications() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      // Already granted: silently refresh the token on load.
      setStatus("enabled");
      registerWebPush();
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  if (status === "unsupported" || status === "enabled") return null;

  async function handleClick() {
    setStatus("registering");
    const ok = await registerWebPush();
    setStatus(ok ? "enabled" : Notification.permission === "denied" ? "denied" : "idle");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "registering" || status === "denied"}
      style={{
        width: "100%",
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        background: status === "denied" ? "#9e9e9e" : "#E91E63",
        border: "none",
        borderRadius: 8,
        cursor: status === "denied" ? "default" : "pointer",
      }}
    >
      {status === "registering"
        ? "Enabling…"
        : status === "denied"
          ? "Notifications blocked"
          : "🔔 Enable notifications"}
    </button>
  );
}
