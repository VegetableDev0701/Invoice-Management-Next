import { getAccessToken } from '@auth0/nextjs-auth0';
import jwtDecode from 'jsonwebtoken/decode';
import { NextApiRequest, NextApiResponse } from 'next';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const tokenResponse = await getAccessToken(req, res);

    const decodedToken = jwtDecode(tokenResponse.accessToken as string);
    const tokenExpiration = (decodedToken as DecodedToken).exp * 1000;

    res.status(200).json({ tokenExpiration });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
