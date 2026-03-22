/**
 * Firebase REST API helpers for mobile app
 *
 * Uses Firebase Auth REST API instead of the JS SDK to avoid
 * Metro bundler compatibility issues with firebase v11.
 *
 * @see https://firebase.google.com/docs/reference/rest/auth
 */

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';

const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1';

interface FirebaseSignInResponse {
  idToken: string;
  email: string;
  displayName?: string;
  localId: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Exchange a Google ID token for a Firebase ID token using the REST API.
 *
 * POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=API_KEY
 */
export async function signInWithGoogleIdToken(
  googleIdToken: string
): Promise<FirebaseSignInResponse> {
  const url = `${FIREBASE_AUTH_URL}/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${googleIdToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnIdpCredential: true,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData?.error?.message || `Firebase auth failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}
