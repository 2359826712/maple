import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import InternalRedirect from '@/components/feature/InternalRedirect';
import RankingsPage from './page';

export default function RankingsNextRoute(props: NextRoutePageProps) {
  const initialRouteElement = stripRouteSuffixes(props.pathname) === '/rankings/classes'
    ? <InternalRedirect to="/mapler-house#stats" label="Mapler House class rankings" />
    : <SeriesModuleRoute module="rankings"><RankingsPage /></SeriesModuleRoute>;
  return <NextRoutePage {...props} initialRouteElement={initialRouteElement} />;
}

export const getServerSideProps = getServerSideRouteProps;
