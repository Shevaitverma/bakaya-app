/**
 * Hook for Google Sign-In using the native Google Identity SDK
 * (@react-native-google-signin) + Firebase REST API.
 *
 * Why native instead of expo-auth-session: the browser/auth-session flow sends
 * Google a custom-scheme redirect (`com.bakaya.app:/oauthredirect`) that Google
 * rejects with `Error 400: invalid_request` in a standalone build (it only
 * worked in Expo Go via the auth.expo.io proxy). The native SDK uses no browser
 * redirect — it is validated by package name + signing SHA-1 (registered in the
 * Firebase project) and returns a Google ID token directly.
 *
 * Flow:
 * 1. Native Google Sign-In → Google ID token (audience = Web client ID)
 * 2. Exchange the Google ID token for a Firebase ID token via REST API
 * 3. Return the Firebase ID token to send to the server
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { signInWithGoogleIdToken } from '../lib/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Native sign-in needs the Web client ID for the ID-token audience; the Android
// OAuth client is matched automatically via package + SHA-1 from
// google-services.json. iOS additionally needs its own client ID (none yet, so
// the button stays hidden on iOS).
const googleSignInAvailable =
  Platform.OS === 'ios' ? !!IOS_CLIENT_ID : !!WEB_CLIENT_ID;

if (googleSignInAvailable) {
  try {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID || undefined,
    });
  } catch (err) {
    // Native module absent (e.g. a build predating this lib) — sign-in will no-op.
    console.warn('[GOOGLE SIGN-IN] configure failed:', err instanceof Error ? err.message : err);
  }
}

interface GoogleSignInState {
  isLoading: boolean;
  error: string | null;
}

interface UseGoogleSignInReturn extends GoogleSignInState {
  /** false when Google SSO isn't configured for this platform — hide the button */
  isAvailable: boolean;
  signIn: () => Promise<string | null>;
}

export function useGoogleSignIn(): UseGoogleSignInReturn {
  const [state, setState] = useState<GoogleSignInState>({
    isLoading: false,
    error: null,
  });

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!googleSignInAvailable) {
      console.warn('[GOOGLE SIGN-IN] Not available on this platform');
      return null;
    }

    setState({ isLoading: true, error: null });

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // A stale session can make signIn() return the previous account silently;
      // sign out first so the account picker always shows.
      await GoogleSignin.signOut().catch(() => {});

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        // User dismissed the picker.
        setState({ isLoading: false, error: null });
        return null;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Exchange the Google ID token for a Firebase ID token via REST API.
      const firebaseResult = await signInWithGoogleIdToken(idToken);
      console.log('[GOOGLE SIGN-IN] Firebase ID token obtained');

      setState({ isLoading: false, error: null });
      return firebaseResult.idToken;
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        setState({ isLoading: false, error: null });
        return null;
      }
      const errorMessage =
        err instanceof Error ? err.message : 'Google sign-in failed';
      console.error('[GOOGLE SIGN-IN] Error:', errorMessage);
      setState({ isLoading: false, error: errorMessage });
      throw err;
    }
  }, []);

  return {
    ...state,
    isAvailable: googleSignInAvailable,
    signIn,
  };
}
