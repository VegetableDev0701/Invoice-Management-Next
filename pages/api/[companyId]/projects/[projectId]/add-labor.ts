import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

import { getAPIUrl } from '@/lib/config';
import { getGoogleToken } from '@/lib/utility/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const companyId = req.query.companyId as string;
  const projectId = req.query.projectId as string;

  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const auth0Session = await getSession(req, res);
      if (!auth0Session || !auth0Session.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      const googleToken = await getGoogleToken();
      if (!googleToken) {
        res.status(401).json({ error: 'Not Authenticated' });
      }

      let url = '';
      if (req.method === 'POST') {
        url = `${getAPIUrl()}/${companyId}/add-labor?project_id=${projectId}`;
      }
      if (req.method === 'PATCH') {
        const laborId = req.headers.laborid;
        url = `${getAPIUrl()}/${companyId}/update-labor?project_id=${projectId}&labor_id=${laborId}`;
      }
      const response = await fetch(url, {
        method: req.method,
        body: req.body,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleToken}`,
          Auth0: `Bearer ${auth0Session.accessToken}`,
        },
      });

      if (response.statusText !== 'OK') {
        const errorData = await response.json();
        console.error(errorData);
        res.status(response.status).json({ error: errorData.detail });
        return;
      }
      const data = await response.json();
      res.status(response.status || 200).json(data);
    } catch (error: any) {
      console.error(error);
      res.status(error.status || 500).json({
        code: error.code,
        error: error.message,
      });
    }
    return;
  }
}

export default withApiAuthRequired(handler);
