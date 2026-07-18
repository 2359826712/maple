import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesPage from './page';

export default function SeriesNextRoute(props: NextRoutePageProps) {
  const [, , initialSeriesId, initialSeriesModule] = stripRouteSuffixes(props.pathname).split('/');
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={(
        <SeriesPage initialSeriesId={initialSeriesId} initialSeriesModule={initialSeriesModule} />
      )}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
