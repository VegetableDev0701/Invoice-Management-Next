import { GoogleAuth } from 'google-auth-library';

export async function getGoogleToken() {
  const googleAuth = new GoogleAuth();
  const client = await googleAuth.getIdTokenClient(
    process.env.TARGET_AUDIENCE as string
  );
  const googleToken = await client.idTokenProvider.fetchIdToken(
    process.env.TARGET_AUDIENCE as string
  );
  return googleToken;
}
