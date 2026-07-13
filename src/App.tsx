import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import ScrollToTop from "@/components/base/ScrollToTop";
import AppErrorFallback from "@/components/base/AppErrorFallback";
import ErrorBoundary from "@/components/base/ErrorBoundary";
import { VersionProvider } from "@/hooks/VersionContext";
import PageTelemetry from "@/components/base/PageTelemetry";
import ThemeSwitcher from "@/pages/home/components/ThemeSwitcher";
import { ThemeProvider } from "@/hooks/ThemeContext";
import AccountSessionBootstrap from "@/components/base/AccountSessionBootstrap";

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter basename={__BASE_PATH__}>
          <ErrorBoundary
            fallback={(_error, reset) => <AppErrorFallback onReset={reset} />}
          >
            <VersionProvider>
              <AccountSessionBootstrap />
              <ScrollToTop />
              <PageTelemetry />
              <AppRoutes />
              <ThemeSwitcher />
            </VersionProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
