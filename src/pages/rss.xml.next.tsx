import type { GetServerSideProps } from 'next';
import { buildRssFeedXml } from '@/seo/rssFeed';

export default function Rss() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(buildRssFeedXml());
  res.end();
  return { props: {} };
};
