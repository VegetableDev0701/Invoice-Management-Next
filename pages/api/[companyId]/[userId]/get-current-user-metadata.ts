import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const companyId = req.query.companyId as string;
  const userId = req.query.userId as string;

  try {
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (
      auth0Session.user.user_metadata.companyId !== companyId ||
      auth0Session.user.user_metadata.userUUID !== userId
    ) {
      res.status(401).json({
        error: 'Not authenticated to access data for this company and/or user.',
      });
      return;
    }

    const keyResponse = await fetch(`${process.env.AUTH0_TENANT}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `${process.env.AUTH0_TENANT}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    });

    if (keyResponse.statusText !== 'OK') {
      throw new Error(
        'Fetching the updated key for management API failed...Sad Panda :('
      );
    }
    const keyData = await keyResponse.json();
    if (keyData) {
      const response = await fetch(
        `${process.env.AUTH0_TENANT}/api/v2/users/${auth0Session.user.sub}?fields=user_metadata&include_fields=true`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${keyData['access_token']}`,
          },
        }
      );

      if (response.statusText !== 'OK') {
        const errorData = await response.json();
        res.status(response.status).json({ error: errorData.detail });
        return;
      }
      const data = await response.json();
      res.status(response.status || 200).json(data);
    }
  } catch (error: any) {
    console.error(error);
    res.status((error.status as number) || 500).json({
      code: error.code as number,
      error: error.message as string,
    });
  }
}

export default withApiAuthRequired(handler);
