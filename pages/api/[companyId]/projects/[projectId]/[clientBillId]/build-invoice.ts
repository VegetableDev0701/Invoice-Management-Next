import { getAPIUrl } from '@/lib/config';
import { getGoogleToken } from '@/lib/utility/auth';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const companyId = req.query.companyId as string;
  const projectId = req.query.projectId as string;
  const clientBillId = req.query.clientBillId as string;

  if (req.method === 'POST') {
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

      const url = `${getAPIUrl()}/${companyId}/build-ar-invoice?project_id=${projectId}&client_bill_id=${clientBillId}`;

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
