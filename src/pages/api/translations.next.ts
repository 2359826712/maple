import type { NextApiRequest, NextApiResponse } from 'next';

export default async function translations(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  response.setHeader('Cache-Control', 'no-store');
  response.status(410).json({
    error: 'Realtime translation is disabled; read published localizations from the content API.',
  });
}
