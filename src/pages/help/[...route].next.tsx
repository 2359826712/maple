import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import HelpCenterPage from './page';
import HelpTopicPage from './topic';

export default function HelpNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const topicId = routePath.startsWith('/help/')
    ? routePath.slice('/help/'.length)
    : undefined;
  const initialRouteElement = routePath.startsWith('/help/')
    ? <HelpTopicPage initialTopicId={topicId} />
    : <HelpCenterPage />;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
