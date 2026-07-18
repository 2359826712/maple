import { type ReactNode, useState } from 'react';
import { createInstance } from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { AppRoutes } from '@/router';
import { ensureLanguageResources } from '@/i18n';
import { normalizeLanguage } from '@/i18n/languageRouting';
import ScrollToTop from '@/components/base/ScrollToTop';
import RouteErrorBoundary from '@/components/base/RouteErrorBoundary';
import { VersionProvider } from '@/hooks/VersionContext';
import PageTelemetry from '@/components/base/PageTelemetry';
import ThemeSwitcher from '@/pages/home/components/ThemeSwitcher';
import { ThemeProvider } from '@/hooks/ThemeContext';
import AccountSessionBootstrap from '@/components/base/AccountSessionBootstrap';
import MobilePrimaryNav from '@/components/navigation/MobilePrimaryNav';
import RouteMetadata from '@/components/base/RouteMetadata';
import SchemaOrgRoute from '@/components/base/SchemaOrgRoute';
import LocaleRouteSync from '@/components/base/LocaleRouteSync';
import type { NextRoutePageProps } from './routeData';
import { ServerRouteDataProvider } from './ServerRouteDataContext';
import HydrationSafeRouter from './HydrationSafeRouter';
import RoutePreloader from '@/components/base/RoutePreloader';
import RuntimeRecovery from '@/components/base/RuntimeRecovery';

const createRouteI18n = ({ language, translation }: NextRoutePageProps) => {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    resources: { [language]: { translation } },
    ns: ['translation'],
    defaultNS: 'translation',
    initImmediate: false,
    interpolation: { escapeValue: false },
  });

  const rawChangeLanguage = instance.changeLanguage.bind(instance);
  instance.changeLanguage = async (nextLanguage, callback) => {
    if (nextLanguage) await ensureLanguageResources(normalizeLanguage(nextLanguage), instance);
    return rawChangeLanguage(nextLanguage, callback);
  };
  return instance;
};

function ApplicationProviders({
  initialRouteElement,
  page,
}: {
  initialRouteElement?: ReactNode;
  page: NextRoutePageProps;
}) {
  const [routeI18n] = useState(() => createRouteI18n(page));

  return (
    <ServerRouteDataProvider
      initialEvents={page.initialEvents}
      initialGuide={page.initialGuide}
      initialGuides={page.initialGuides}
      initialGuideSection={page.initialGuideSection}
      initialNews={page.initialNews}
      initialOfficialArticle={page.initialOfficialArticle}
      initialTools={page.initialTools}
      initialUpcomingArticle={page.initialUpcomingArticle}
      initialUpcomingFeed={page.initialUpcomingFeed}
      initialWikiEntry={page.initialWikiEntry}
      requestTitle={page.requestTitle}
    >
      <ThemeProvider>
        <I18nextProvider i18n={routeI18n}>
          <RuntimeRecovery />
          <RouteErrorBoundary>
            <LocaleRouteSync />
            <VersionProvider initialVersion={page.server}>
              <AccountSessionBootstrap />
              <ScrollToTop />
              <PageTelemetry />
              <RouteMetadata />
              <SchemaOrgRoute />
              <RoutePreloader />
              <AppRoutes initialPath={page.pathname} initialRouteElement={initialRouteElement} />
              <MobilePrimaryNav />
              <ThemeSwitcher />
            </VersionProvider>
          </RouteErrorBoundary>
        </I18nextProvider>
      </ThemeProvider>
    </ServerRouteDataProvider>
  );
}

export default function NextApplication({
  initialRouteElement,
  ...page
}: NextRoutePageProps & { initialRouteElement?: ReactNode }) {
  const application = <ApplicationProviders page={page} initialRouteElement={initialRouteElement} />;
  return (
    <div data-server-rendered-route={page.pathname}>
      <HydrationSafeRouter initialLocation={page.requestPath || page.pathname}>
        {application}
      </HydrationSafeRouter>
    </div>
  );
}
