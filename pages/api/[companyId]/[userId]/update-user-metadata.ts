import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const companyId = req.query.companyId as string;
  const userId = req.query.userId as string;
  if (req.method === 'PATCH') {
    try {
      const auth0Session = await getSession(req, res);
      if (!auth0Session || !auth0Session.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      if (auth0Session.user.user_metadata.companyId !== companyId) {
        res.status(401).json({
          error: 'Not authenticated to access data for this company.',
        });
        return;
      }

      const auth0ManagementAPIResponse = await fetch(
        `${process.env.AUTH0_TENANT}/oauth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
            client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
            audience: `${process.env.AUTH0_TENANT}/api/v2/`,
            grant_type: 'client_credentials',
          }),
        }
      );
      if (auth0ManagementAPIResponse.statusText !== 'OK') {
        res.status(auth0ManagementAPIResponse.status).json({
          error: auth0ManagementAPIResponse.statusText,
        });
        return;
      }

      const auth0Data = await auth0ManagementAPIResponse.json();

      const userMetadataResponse = await fetch(
        `${process.env.AUTH0_TENANT}/api/v2/users/${auth0Session.user.sub}?fields=user_metadata&include_fields=true`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth0Data.access_token}`,
          },
        }
      );

      if (userMetadataResponse.statusText !== 'OK') {
        res.status(userMetadataResponse.status).json({
          error: userMetadataResponse.statusText,
        });
        return;
      }

      const userMetadata = await userMetadataResponse.json();
      if (userMetadata.user_metadata.userUUID !== userId) {
        res.status(401).json({
          error: 'Not authenticated for this user',
        });
        return;
      }

      // development auth0 tenant
      const response = await fetch(
        `${process.env.AUTH0_TENANT}/api/v2/users/${auth0Session.user.sub}`,
        {
          method: req.method,
          body: JSON.stringify(req.body),
          headers: {
            Authorization: `Bearer ${auth0Data.access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
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
    } catch (error: any) {
      console.error(error);
      res.status((error.status as number) || 500).json({
        code: error.code as number,
        error: error.message as string,
      });
    }
  } else {
    res.status(405).json({ error: 'Not a PATCH request.' });
  }
}

export default withApiAuthRequired(handler);
