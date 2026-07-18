import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import GuideDetail from './detail/page';
import LevelGuidePage from './level/page';
import GuidesPage from './page';

export default function GuidesNextRoute(props: NextRoutePageProps) {
  const routePath = stripRouteSuffixes(props.pathname);
  const guideId = routePath.startsWith('/guides/')
    ? decodeURIComponent(routePath.slice('/guides/'.length))
    : undefined;
  const initialRouteElement = routePath === '/guides/level'
    ? <LevelGuidePage />
    : routePath.startsWith('/guides/')
      ? <GuideDetail initialId={guideId} />
      : <SeriesModuleRoute module="guides"><GuidesPage /></SeriesModuleRoute>;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
