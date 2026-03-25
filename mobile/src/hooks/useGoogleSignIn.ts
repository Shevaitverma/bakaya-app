/**
 * Hook for Google Sign-In using expo-auth-session + Firebase REST API
 *
 * Flow:
 * 1. Open Google OAuth consent screen via expo-auth-session
 * 2. Exchange the Google ID token for a Firebase ID token via REST API
 * 3. Return the Firebase ID token to send to the server
 *
 * On iOS without a configured iosClientId the hook is still safe to call
 * but `isAvailable` will be false — callers should hide the Google button.
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from '../lib/firebase';

// Required for expo-auth-session to handle browser redirect on Android
WebBrowser.maybeCompleteAuthSession();

/** Google SSO is available when we have the required client ID for the platform */
const hasIosClientId = !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleSignInAvailable = Platform.OS !== 'ios' || hasIosClientId;

interface GoogleSignInState {
  isLoading: boolean;
  error: string | null;
}

interface UseGoogleSignInReturn extends GoogleSignInState {
  /** false on iOS when no iosClientId is configured — hide the button */
  isAvailable: boolean;
  signIn: () => Promise<string | null>;
}

export function useGoogleSignIn(): UseGoogleSignInReturn {
  const [state, setState] = useState<GoogleSignInState>({
    isLoading: false,
    error: null,
  });

  // On iOS without iosClientId we pass the webClientId to prevent the hook
  // from throwing, but mark SSO as unavailable so the UI hides the button.
  const [_request, _response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
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

      const { id_token } = result.params;
      if (!id_token) {
        throw new Error('No ID token received from Google');
      }

      // Step 2: Exchange Google ID token for Firebase ID token via REST API
      const firebaseResult = await signInWithGoogleIdToken(id_token);

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
  }, [promptAsync]);

  return {
    ...state,
    isAvailable: googleSignInAvailable,
    signIn,
  };
}
