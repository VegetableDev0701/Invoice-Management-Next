import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

import { getAPIUrl } from '@/lib/config';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the current user's session
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const response = await fetch(
      `${getAPIUrl()}/onboard_new_user?user_email=${req.body.user_email}`,
      {
        method: 'PUT',
        headers: {
          // Authorization: `Bearer ${googleToken}`,
          Auth0: `Bearer ${auth0Session.accessToken}`,
        },
      }
    );
    if (response.statusText !== 'OK') {
      const errorData = await response.json();
      res.status(response.status).json({ error: errorData.detail });
      return;
    }
    const data = await response.json();

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export default withApiAuthRequired(handler);
