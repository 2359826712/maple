import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import MapsPage from './page';

export default function MapsNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<MapsPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
