import { getAPIUrl } from '@/lib/config';
import { getGoogleToken } from '@/lib/utility/auth';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

async function getSignedUrl(req: NextApiRequest, res: NextApiResponse) {
  const companyId = req.query.companyId as string;
  const projectId = req.query.projectId as string;
  const docId = req.headers.docid as string;
  const filenames: string[] = JSON.parse(req.headers.filenames as string);

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

    const filenameQueries = filenames.map((filename) => {
      return `&filenames=${encodeURIComponent(filename)}`;
    });

    const response = await fetch(
      `${getAPIUrl()}/${companyId}/contract/generate-signed-url?project_id=${projectId}&contract_id=${docId}${filenameQueries.join(
        ''
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${googleToken}`,
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
    res.status(response.status || 200).json(data);
  } catch (error: any) {
    console.error('Failed to fetch Signed URL: ', error);
    res.status(error.status || 500).json({ error: error.message });
    return null;
  }
}

export default withApiAuthRequired(getSignedUrl);
