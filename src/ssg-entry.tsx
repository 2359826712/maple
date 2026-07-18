import { StrictMode } from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AppRoutes } from './router';
import i18n, { ensureLanguageResources, i18nReady } from './i18n';
import ScrollToTop from '@/components/base/ScrollToTop';
import RouteErrorBoundary from '@/components/base/RouteErrorBoundary';
import { VersionProvider, type GameVersion } from '@/hooks/VersionContext';
import PageTelemetry from '@/components/base/PageTelemetry';
import ThemeSwitcher from '@/pages/home/components/ThemeSwitcher';
import { ThemeProvider } from '@/hooks/ThemeContext';
import AccountSessionBootstrap from '@/components/base/AccountSessionBootstrap';
import MobilePrimaryNav from '@/components/navigation/MobilePrimaryNav';
import RouteMetadata from '@/components/base/RouteMetadata';
import SchemaOrgRoute from '@/components/base/SchemaOrgRoute';
import LocaleRouteSync from '@/components/base/LocaleRouteSync';
import type { SupportedLanguage } from '@/i18n/languageRouting';
import RuntimeRecovery from '@/components/base/RuntimeRecovery';

function StaticApplication({ location, version }: { location: string; version: GameVersion }) {
  return (
    <StrictMode>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <StaticRouter location={location}>
            <RuntimeRecovery />
            <RouteErrorBoundary>
              <LocaleRouteSync />
              <VersionProvider initialVersion={version}>
                <AccountSessionBootstrap />
                <ScrollToTop />
                <PageTelemetry />
                <RouteMetadata />
                <SchemaOrgRoute />
                <AppRoutes />
                <MobilePrimaryNav />
                <ThemeSwitcher />
              </VersionProvider>
            </RouteErrorBoundary>
          </StaticRouter>
        </I18nextProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

function renderStream(element: React.ReactNode) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const destination = new PassThrough();
    let renderError: unknown = null;
    let settled = false;

    const finishWithError = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    destination.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    destination.on('error', finishWithError);
    destination.on('end', () => {
      if (renderError) {
        finishWithError(renderError);
        return;
      }
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    const stream = renderToPipeableStream(element, {
      onAllReady() {
        stream.pipe(destination);
      },
      onShellError: finishWithError,
      onError(error) {
        renderError ||= error;
      },
    });

    setTimeout(() => {
      if (settled) return;
      stream.abort();
      finishWithError(new Error('Static React rendering timed out.'));
    }, 30_000).unref();
  });
}

export async function renderRoute({
  language,
  pathname,
  version,
}: {
  language: SupportedLanguage;
  pathname: string;
  version: GameVersion;
}) {
  await i18nReady;
  await ensureLanguageResources(language);
  await i18n.changeLanguage(language);
  return renderStream(<StaticApplication location={pathname} version={version} />);
}
