import { NextApiRequest, NextApiResponse } from 'next';
import {
  getSession,
  getAccessToken,
  withApiAuthRequired,
} from '@auth0/nextjs-auth0';
import jwtDecode from 'jsonwebtoken/decode';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the current user's session
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Request a new access token
    const tokenResponse = await getAccessToken(req, res, {
      refresh: true,
    });

    // Decode the new access token to get its expiration time
    const decodedToken = jwtDecode(tokenResponse.accessToken as string);
    const tokenExpiration = (decodedToken as DecodedToken).exp * 1000;

    // Update the user's session with the new access token
    auth0Session.accessToken = tokenResponse.accessToken;
    auth0Session.accessTokenExpiresAt = tokenExpiration;

    // Send the new expiration time in the response
    res.status(200).json({ tokenExpiration });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
}

export default withApiAuthRequired(handler);
