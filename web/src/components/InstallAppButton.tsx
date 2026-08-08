"use client";

import { useEffect, useState } from "react";

/** Chromium-only, so it isn't in lib.dom. Safari never fires this. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/* Chrome fires beforeinstallprompt once the app becomes installable, which on a
 * repeat visit (service worker already active) can happen before React hydrates.
 * Capturing at module scope catches those early firings; the effect below also
 * subscribes for ones that arrive later. */
let captured: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // suppress Chrome's own mini-infobar; we have our own button
    captured = e as BeforeInstallPromptEvent;
  });
}
// ponytail: module-scope capture still runs at chunk-eval time, so an event fired
// before the bundle loads is missed and the button stays hidden until the next
// visit. If that shows up in practice, move the listener to an inline script in
// layout.tsx that stashes the event on window.

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS predates display-mode and reports installation here instead.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  // iPadOS 13+ reports a desktop Mac user agent, so the UA test alone misses
  // every iPad. Real Macs have no touch screen, making maxTouchPoints the
  // reliable tell-apart.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Install button. Renders nothing unless the app can actually be installed, so
 * it's safe to drop anywhere.
 *
 * On Chromium it triggers the real install prompt. On iOS there is no install
 * API at all, so it reveals the manual Share → Add to Home Screen steps instead.
 * Appearance is the caller's job — pass a className.
 */
export function InstallAppButton({
  className,
  label = "Install app",
}: {
  className?: string;
  label?: React.ReactNode;
}) {
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isInstalled()) return; // already on the home screen — nothing to offer

    if (isIOS()) {
      setMode("ios");
      return;
    }

    if (captured) setMode("prompt");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      captured = e as BeforeInstallPromptEvent;
      setMode("prompt");
    };
    const onInstalled = () => setMode("hidden");

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function handleClick() {
    if (mode === "ios") {
      setShowSteps((v) => !v);
      return;
    }
    if (!captured) return;
    await captured.prompt();
    await captured.userChoice;
    // The event is single-use — Chrome issues a fresh one if still installable.
    captured = null;
    setMode("hidden");
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        // On iOS this is a disclosure, not an install action — say so, rather
        // than promising an install that the platform gives us no API for.
        aria-expanded={mode === "ios" ? showSteps : undefined}
        aria-controls={mode === "ios" ? "install-steps" : undefined}
      >
        {mode === "ios" ? (
          <>
            <span aria-hidden="true">&#x2B07;</span> How to install
          </>
        ) : (
          label
        )}
      </button>
      {showSteps && (
        // color:inherit so this reads correctly on both the dark hero and the
        // light profile page without either caller passing extra styles.
        <p id="install-steps" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5, color: "inherit", opacity: 0.75 }}>
          In Safari, tap the Share button, scroll down, then tap{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      )}
    </>
  );
}
