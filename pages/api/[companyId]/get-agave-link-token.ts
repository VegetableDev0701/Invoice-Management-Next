import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: `Method not allowed: ${req.method}` });
  }
  const reference_id = req.headers.reference_id;

  try {
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (
      process.env.AGAVE_TOKEN_CREATE_URL &&
      process.env.AGAVE_CLIENT_ID &&
      process.env.AGAVE_CLIENT_SECRET &&
      process.env.AGAVE_API_VERSION
    ) {
      const agaveResponse = await fetch(process.env.AGAVE_TOKEN_CREATE_URL, {
        method: 'POST',
        headers: {
          'API-Version': process.env.AGAVE_API_VERSION,
          'Client-Id': process.env.AGAVE_CLIENT_ID,
          'Client-Secret': process.env.AGAVE_CLIENT_SECRET,
        },
        body: JSON.stringify({
          reference_id: reference_id, // TODO make this dynamic to other systems other than qbd
        }),
      });
      if (agaveResponse.status !== 200) {
        res
          .status(agaveResponse.status || 500)
          .json({ error: agaveResponse.statusText });
      }
      const agaveData = await agaveResponse.json();
      res.status(200).json({ link_token: agaveData.link_token });
    } else {
      res
        .status(401)
        .json({ error: 'Do not have all Agave environment variables.' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(error.status || 500).json({
      code: error.code,
      error: error.message,
    });
  }
}

export default withApiAuthRequired(handler);
