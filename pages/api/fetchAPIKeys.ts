import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

async function tokenHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth0Session = await getSession(req, res);
    if (!auth0Session || !auth0Session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.status(200).json({ googleMapsAPIKey: process.env.GOOGLEMAPS_API_KEY });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export default withApiAuthRequired(tokenHandler);
