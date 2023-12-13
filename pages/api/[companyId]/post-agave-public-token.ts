import { getAPIUrl } from '@/lib/config';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: `Method not allowed: ${req.method}` });
  }
  const companyId = req.query.companyId as string;

  try {
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = req.body;
    const publicToken = data.public_token;
    const software = data.software;

    const agaveResponse = await fetch(
      `${getAPIUrl()}/${companyId}/agave-account-token?public_token=${publicToken}&software_name=${software}`,
      {
        method: req.method,
        headers: {
          Auth0: `Bearer ${auth0Session.accessToken}`,
        },
      }
    );

    if (agaveResponse.status !== 200) {
      res
        .status(agaveResponse.status || 500)
        .json({ error: agaveResponse.statusText });
      return;
    }

    const agaveData = await agaveResponse.json();
    res.status(200).json({ message: agaveData.message });
  } catch (error: any) {
    console.error(error);
    res.status(error.status || 500).json({
      code: error.code,
      error: error.message,
    });
  }
}

export default withApiAuthRequired(handler);
