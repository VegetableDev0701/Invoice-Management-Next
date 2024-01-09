import { getAPIUrl } from '@/lib/config';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const auth0Session = await getSession(req, res);
      if (!auth0Session || !auth0Session.user) {
        res.status(401).json({ error: 'Not authenticated' });
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

      // slightly different data logic for when a new user onboards and when
      // they are just updating the account settings
      const user_metadata = req.body?.userData
        ? req.body.userData.user_metadata
        : req.body.user_metadata;
      const name = req.body?.userData
        ? req.body.userData.name
        : `${req.body.user_metadata.accountSettings['first-name-as'].value} \
        ${req.body.user_metadata.accountSettings['last-name-as'].value}`;

      console.log(user_metadata);

      const updateCompanyNameResponse = await fetch(
        `${getAPIUrl()}/update_new_user_info`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            company_name: user_metadata.companyName,
            company_id: user_metadata.companyId,
            user_id: user_metadata.userUUID,
            user_name: name,
            business_address:
              user_metadata.accountSettings?.['business-address-as']?.value ??
              null,
            business_city:
              user_metadata.accountSettings?.['city-business-as']?.value ??
              null,
            business_state:
              user_metadata.accountSettings?.['state-business-as']?.value ??
              null,
            business_zip:
              user_metadata.accountSettings?.['zip-code-business-as']?.value ??
              null,
          }),
          headers: {
            'Content-Type': 'application/json',
            Auth0: `Bearer ${auth0Session.accessToken}`,
          },
        }
      );
      if (updateCompanyNameResponse.statusText !== 'OK') {
        const errorData = await updateCompanyNameResponse.json();
        res
          .status(updateCompanyNameResponse.status)
          .json({ error: errorData.detail });
        return;
      }

      // development auth0 tenant
      const response = await fetch(
        `${process.env.AUTH0_TENANT}/api/v2/users/${auth0Session.user.sub}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            user_metadata,
            name,
          }),
          headers: {
            Authorization: `Bearer ${auth0Data.access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.statusText !== 'OK') {
        const errorData = await response.json();
        res.status(response.status).json({ error: errorData.message });
        return;
      }
      res
        .status(response.status || 200)
        .json({ message: 'Succesfully updated user.' });
    } catch (error: any) {
      console.error(error);
      res.status((error.status as number) || 500).json({
        code: error.code as number,
        error: error.message as string,
      });
    }
  } else {
    res.status(405).json({ error: 'Not a POST or PATCH request.' });
  }
}

export default withApiAuthRequired(handler);
