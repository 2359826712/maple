import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SearchPage from './page';

export default function SearchNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<SearchPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
