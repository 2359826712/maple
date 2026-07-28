import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import NotFound from './NotFound';
import Home from './home/page';

const SeriesResourceDetailPage = dynamic(() => import('./series/SeriesResourceDetailPage'));

export default function HomeNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const contentMatch = routePath.match(/^\/content\/([^/]+)\/(.+)$/);
  const initialRouteElement = routePath === '/'
    ? <Home />
    : contentMatch
      ? (
        <SeriesResourceDetailPage
          initialContentModule={decodeURIComponent(contentMatch[1])}
          initialDetail={props.initialSeriesResourceDetail}
          initialSlug={decodeURIComponent(contentMatch[2])}
        />
      )
      : <NotFound />;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps: GetServerSideProps<NextRoutePageProps> = async (context) => {
  const { getServerSideRouteProps } = await import('@/next/serverRoute');
  return getServerSideRouteProps(context);
};
