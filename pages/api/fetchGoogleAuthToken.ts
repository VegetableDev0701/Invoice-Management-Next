import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

import { getGoogleToken } from '@/lib/utility/auth';

async function googleTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const googleAuthToken = await getGoogleToken();
    if (!googleAuthToken) {
      res.status(401).json({ error: 'Not Authenticated' });
    }
    res.status(200).json({ token: googleAuthToken });
  } catch (error: any) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

export default withApiAuthRequired(googleTokenHandler);
