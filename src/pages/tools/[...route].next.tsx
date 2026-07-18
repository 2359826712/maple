import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import ToolsPage from './page';

export default function ToolsNextRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={<SeriesModuleRoute module="tools"><ToolsPage /></SeriesModuleRoute>}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
