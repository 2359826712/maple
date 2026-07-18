import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import AccountPage from './page';

export default function AccountNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<AccountPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
