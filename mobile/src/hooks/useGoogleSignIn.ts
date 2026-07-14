/**
 * Hook for Google Sign-In using expo-auth-session + Firebase REST API
 *
 * Flow:
 * 1. Open Google OAuth consent screen via expo-auth-session
 * 2. Exchange the Google ID token for a Firebase ID token via REST API
 * 3. Return the Firebase ID token to send to the server
 *
 * Without a configured client ID for the platform the hook is still safe to
 * call but `isAvailable` will be false — callers should hide the Google button.
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { exchangeCodeAsync } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from '../lib/firebase';

// Required for expo-auth-session to handle browser redirect on Android
WebBrowser.maybeCompleteAuthSession();

/** Google SSO is available when we have the required client ID for the platform */
const googleSignInAvailable = !!Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

interface GoogleSignInState {
  isLoading: boolean;
  error: string | null;
}

interface UseGoogleSignInReturn extends GoogleSignInState {
  /** false when no client ID is configured for this platform — hide the button */
  isAvailable: boolean;
  signIn: () => Promise<string | null>;
}

export function useGoogleSignIn(): UseGoogleSignInReturn {
  const [state, setState] = useState<GoogleSignInState>({
    isLoading: false,
    error: null,
  });

  // The 'unavailable' placeholders keep the hook from throwing when a client
  // ID is missing; they are unreachable because signIn() early-returns when
  // SSO is unavailable on the platform.
  const [request, _response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'unavailable',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'unavailable',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'unavailable',
  });

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!googleSignInAvailable) {
      console.warn('[GOOGLE SIGN-IN] Not available on this platform');
      return null;
    }

    setState({ isLoading: true, error: null });

    try {
      // Step 1: Open Google OAuth consent screen
      const result = await promptAsync();

      if (result.type !== 'success') {
        // User cancelled or flow was dismissed
        if (result.type === 'cancel' || result.type === 'dismiss') {
          setState({ isLoading: false, error: null });
          return null;
        }
        throw new Error('Google sign-in was not successful');
      }

      // Native uses the code flow — exchange the authorization code for tokens
      const code = result.params.code;
      if (!code) {
        throw new Error('No authorization code received from Google');
      }
      const tokens = await exchangeCodeAsync(
        {
          clientId: request!.clientId,
          redirectUri: request!.redirectUri,
          code,
          extraParams: { code_verifier: request?.codeVerifier ?? '' },
        },
        Google.discovery
      );

      if (!tokens.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Step 2: Exchange Google ID token for Firebase ID token via REST API
      const firebaseResult = await signInWithGoogleIdToken(tokens.idToken);

      console.log('[GOOGLE SIGN-IN] Firebase ID token obtained');

      setState({ isLoading: false, error: null });
      return firebaseResult.idToken;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Google sign-in failed';
      console.error('[GOOGLE SIGN-IN] Error:', errorMessage);
      setState({ isLoading: false, error: errorMessage });
      throw err;
    }
  }, [promptAsync, request]);

  return {
    ...state,
    isAvailable: googleSignInAvailable,
    signIn,
  };
}
