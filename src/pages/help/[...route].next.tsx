import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import HelpCenterPage from './page';
import HelpTopicPage from './topic';

export default function HelpNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const segments = routePath.split('/').filter(Boolean);
  const isSeriesHelp = segments[1] === 'series';
  const seriesId = isSeriesHelp ? segments[2] : undefined;
  const topicId = isSeriesHelp ? segments[3] : segments[1];
  const initialRouteElement = topicId
    ? <HelpTopicPage initialSeriesId={seriesId} initialTopicId={topicId} />
    : <HelpCenterPage initialSeriesId={seriesId} />;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
