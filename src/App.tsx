import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import ScrollToTop from "@/components/base/ScrollToTop";
import RouteErrorBoundary from "@/components/base/RouteErrorBoundary";
import { VersionProvider } from "@/hooks/VersionContext";
import PageTelemetry from "@/components/base/PageTelemetry";
import ThemeSwitcher from "@/pages/home/components/ThemeSwitcher";
import { ThemeProvider } from "@/hooks/ThemeContext";
import AccountSessionBootstrap from "@/components/base/AccountSessionBootstrap";
import MobilePrimaryNav from "@/components/navigation/MobilePrimaryNav";
import RouteMetadata from "@/components/base/RouteMetadata";
import SchemaOrgRoute from "@/components/base/SchemaOrgRoute";
import LocaleRouteSync from "@/components/base/LocaleRouteSync";
import { BrowserRouter } from "react-router-dom";
import RoutePreloader from '@/components/base/RoutePreloader';
import RuntimeRecovery from '@/components/base/RuntimeRecovery';

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter basename={__BASE_PATH__}>
          <RuntimeRecovery />
          <RouteErrorBoundary>
            <LocaleRouteSync />
            <VersionProvider>
              <AccountSessionBootstrap />
              <ScrollToTop />
              <PageTelemetry />
              <RouteMetadata />
              <SchemaOrgRoute />
              <RoutePreloader />
              <AppRoutes />
              <MobilePrimaryNav />
              <ThemeSwitcher />
            </VersionProvider>
          </RouteErrorBoundary>
        </BrowserRouter>
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
