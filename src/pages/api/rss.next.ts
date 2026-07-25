import type { NextApiRequest, NextApiResponse } from 'next';
import { buildRssFeedXml } from '@/seo/rssFeed';

export default function rss(_request: NextApiRequest, response: NextApiResponse) {
  response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  response.status(200).send(buildRssFeedXml());
}
