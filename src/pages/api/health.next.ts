import type { NextApiRequest, NextApiResponse } from 'next';

export default function health(_request: NextApiRequest, response: NextApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).send('ok');
}
