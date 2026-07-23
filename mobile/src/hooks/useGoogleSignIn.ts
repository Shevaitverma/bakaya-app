/**
 * Hook for Google Sign-In using the native Google Identity SDK
 * (@react-native-google-signin) + Firebase REST API.
 *
 * Why native instead of expo-auth-session: the browser/auth-session flow sends
 * Google a custom-scheme redirect (`com.bakaya.app:/oauthredirect`) that Google
 * rejects with `Error 400: invalid_request` in a standalone build. The native
 * SDK uses no browser redirect — it is validated by package + signing SHA-1 and
 * returns a Google ID token directly.
 *
 * Expo Go compatibility: the native module isn't present in Expo Go, and
 * importing it there throws `getEnforcing('RNGoogleSignin')`. So we load it
 * lazily and only outside Expo Go; in Expo Go the button is simply hidden
 * (`isAvailable === false`) and the rest of the app runs normally.
 */

import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as GoogleSigninModule from '@react-native-google-signin/google-signin';
import { signInWithGoogleIdToken } from '../lib/firebase';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Load the native module only outside Expo Go — the require triggers the
// TurboModule lookup that would crash under Expo Go.
const GS: typeof GoogleSigninModule | null = isExpoGo
  ? null
  : require('@react-native-google-signin/google-signin');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Native sign-in needs the Web client ID for the ID-token audience; the Android
// OAuth client is matched via package + SHA-1 from google-services.json. iOS
// additionally needs its own client ID (none yet). Unavailable in Expo Go.
const googleSignInAvailable =
  !!GS && (Platform.OS === 'ios' ? !!IOS_CLIENT_ID : !!WEB_CLIENT_ID);

if (googleSignInAvailable && GS) {
  try {
    GS.GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID || undefined,
    });
  } catch (err) {
    console.warn('[GOOGLE SIGN-IN] configure failed:', err instanceof Error ? err.message : err);
  }
}

interface GoogleSignInState {
  isLoading: boolean;
  error: string | null;
}

interface UseGoogleSignInReturn extends GoogleSignInState {
  /** false when Google SSO isn't available here (missing client ID or Expo Go) — hide the button */
  isAvailable: boolean;
  signIn: () => Promise<string | null>;
}

export function useGoogleSignIn(): UseGoogleSignInReturn {
  const [state, setState] = useState<GoogleSignInState>({
    isLoading: false,
    error: null,
  });

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!googleSignInAvailable || !GS) {
      console.warn('[GOOGLE SIGN-IN] Not available here (Expo Go or unconfigured)');
      return null;
    }

    const { GoogleSignin, statusCodes, isSuccessResponse, isErrorWithCode } = GS;
    setState({ isLoading: true, error: null });

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // A stale session can make signIn() return the previous account silently;
      // sign out first so the account picker always shows.
      await GoogleSignin.signOut().catch(() => {});

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        setState({ isLoading: false, error: null });
        return null;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

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
