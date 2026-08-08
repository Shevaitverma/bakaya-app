import type { UserCredential } from "firebase/auth";
import { authApi } from "./api/auth";
import { setToken, setRefreshToken } from "./api-client";

/**
 * An installed (home-screen) PWA cannot complete signInWithPopup on iOS: the
 * popup opens in a separate view with no opener link back, so Firebase's
 * postMessage handshake never lands and the promise never settles — the button
 * just spins forever. Redirect is the only flow that works once installed.
 */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS predates display-mode and reports installation here instead.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Trade a Firebase credential for our own session and persist it. */
async function exchangeForSession(result: UserCredential): Promise<void> {
  const idToken = await result.user.getIdToken();
  const { user, accessToken, refreshToken } = await authApi.googleLogin({
    credential: idToken,
  });
  setToken(accessToken);
  setRefreshToken(refreshToken);
  localStorage.setItem("bakaya_user", JSON.stringify(user));
}

/**
 * Begin Google sign-in.
 *
 * Returns `true` when a session is ready and the caller should navigate.
 * Returns `false` when the browser is navigating away to complete a redirect —
 * the caller must NOT clear its loading state in that case, because the page is
 * about to unload. `completeGoogleRedirect()` finishes the job on the way back.
 */
export async function startGoogleSignIn(): Promise<boolean> {
  const { signInWithPopup, signInWithRedirect } = await import("firebase/auth");
  const { auth, googleProvider } = await import("@/lib/firebase");

  if (isStandalone()) {
    await signInWithRedirect(auth, googleProvider);
    return false;
  }

  await exchangeForSession(await signInWithPopup(auth, googleProvider));
  return true;
}

/**
 * Complete a sign-in that was started with a redirect. Safe to call on every
 * page load — resolves `false` when there is no pending redirect.
 */
export async function completeGoogleRedirect(): Promise<boolean> {
  const { getRedirectResult } = await import("firebase/auth");
  const { auth } = await import("@/lib/firebase");

  const result = await getRedirectResult(auth);
  if (!result) return false;

  await exchangeForSession(result);
  return true;
}
