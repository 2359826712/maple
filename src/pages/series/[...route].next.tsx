import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import { stripRouteSuffixes } from '@/i18n/languageRouting';
import SeriesPage from './page';
import SeriesResourceDetailPage from './SeriesResourceDetailPage';
import { isSeriesModule } from './scope';
import { safeDecodeURIComponent } from '@/utils/safeDecodeURIComponent';

export default function SeriesNextRoute(props: NextRoutePageProps) {
  const [, , initialSeriesId, initialSeriesModule, initialSlug] = stripRouteSuffixes(props.pathname).split('/');
  const initialRouteElement = initialSlug && isSeriesModule(initialSeriesModule)
    ? (
      <SeriesResourceDetailPage
        initialContentModule={initialSeriesModule}
        initialDetail={props.initialSeriesResourceDetail}
        initialSeriesId={initialSeriesId}
        initialSlug={safeDecodeURIComponent(initialSlug)}
      />
    )
    : <SeriesPage initialSeriesId={initialSeriesId} initialSeriesModule={initialSeriesModule} />;
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={initialRouteElement}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
