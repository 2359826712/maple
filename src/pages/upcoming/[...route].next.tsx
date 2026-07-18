import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import UpcomingUpdateDetailPage from './detail/page';
import UpcomingUpdatesPage from './page';

export default function UpcomingNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const postId = routePath.startsWith('/upcoming/')
    ? decodeURIComponent(routePath.slice('/upcoming/'.length))
    : undefined;
  const initialRouteElement = routePath.startsWith('/upcoming/')
    ? <UpcomingUpdateDetailPage initialPostId={postId} />
    : <SeriesModuleRoute module="upcoming"><UpcomingUpdatesPage /></SeriesModuleRoute>;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
