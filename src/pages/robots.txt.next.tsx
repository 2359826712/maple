import type { GetServerSideProps } from 'next';

export default function Robots() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.write([
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /admin/',
    'Disallow: /auth/login',
    'Disallow: /api/',
    'Sitemap: https://mpstorys.com/sitemap.xml',
    '',
  ].join('\n'));
  res.end();
  return { props: {} };
};
