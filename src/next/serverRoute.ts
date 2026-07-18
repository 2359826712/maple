import type { GetServerSideProps } from 'next';
import {
  createRoutePageProps,
  getLocalizedRedirect,
  pathnameFromServerContext,
  type NextRoutePageProps,
} from './routeData';
import { stripRouteSuffixes } from '@/i18n/languageRouting';

const liveContentRoutes = ['/news', '/events', '/guides', '/upcoming', '/wiki', '/rankings', '/mapler-house', '/source'];

const routeCacheControl = (pathname: string) => {
  const routePath = stripRouteSuffixes(pathname);
  const hasLiveContent = routePath === '/'
    || liveContentRoutes.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`));
  return hasLiveContent
    ? 'public, s-maxage=300, stale-while-revalidate=3600'
    : 'public, s-maxage=43200, stale-while-revalidate=604800';
};

export const getServerSideRouteProps: GetServerSideProps<NextRoutePageProps> = async (context) => {
  const pathname = pathnameFromServerContext(context);
  const redirect = getLocalizedRedirect(context.resolvedUrl || pathname);
  if (redirect) return { redirect: { destination: redirect, permanent: true } };
  const props = await createRoutePageProps(context.resolvedUrl);
  if (!props) return { notFound: true };
  context.res.setHeader('Cache-Control', routeCacheControl(pathname));
  return { props };
};
