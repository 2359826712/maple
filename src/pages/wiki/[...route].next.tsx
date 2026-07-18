import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import WikiArticlePage from './article';
import BossDetailPage from './boss';
import WikiPage from './page';
import { WikiRedirectPage } from './redirect';

export default function WikiNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const initialRouteElement = routePath === '/wiki/redirect'
    ? <WikiRedirectPage />
    : routePath.startsWith('/wiki/article/')
      ? <WikiArticlePage />
      : routePath === '/wiki/boss' || routePath.startsWith('/wiki/boss/')
        ? <BossDetailPage />
        : <SeriesModuleRoute module="wiki"><WikiPage /></SeriesModuleRoute>;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
