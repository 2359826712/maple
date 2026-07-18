import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import LoginPage from './login/page';

export default function AuthNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<LoginPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
