import type { ReactNode } from 'react';
import RouteHead from './RouteHead';
import NextApplication from './NextApplication';
import type { NextRoutePageProps } from './routeData';

export default function NextRoutePage({
  initialRouteElement,
  ...props
}: NextRoutePageProps & { initialRouteElement: ReactNode }) {
  return (
    <>
      <RouteHead page={props} />
      <NextApplication {...props} initialRouteElement={initialRouteElement} />
    </>
  );
}
