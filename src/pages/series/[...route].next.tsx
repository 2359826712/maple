import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesPage from './page';
import SeriesResourceDetailPage from './SeriesResourceDetailPage';
import { getSeriesModuleFromPathSegment, isSeriesModule } from './scope';

export default function SeriesNextRoute(props: NextRoutePageProps) {
  const [, , initialSeriesId, initialSeriesModule, initialSlug] = stripRouteSuffixes(props.pathname).split('/');
  const initialRouteElement = initialSlug && isSeriesModule(initialSeriesModule)
    ? (
      <SeriesResourceDetailPage
        initialContentModule={initialSeriesModule}
        initialDetail={props.initialSeriesResourceDetail}
        initialSeriesId={initialSeriesId}
        initialSlug={decodeURIComponent(initialSlug)}
      />
    )
    : (
      <SeriesPage
        initialSeriesId={initialSeriesId}
        initialSeriesModule={getSeriesModuleFromPathSegment(initialSeriesModule)}
      />
    );
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={initialRouteElement}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
